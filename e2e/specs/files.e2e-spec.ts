import { createS3Client, GetUploadDataDto, KeyDto } from '@app/common';
import { HeadObjectCommand } from '@aws-sdk/client-s3';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Server } from 'http';
import request from 'supertest';
import {
  clearS3Bucket,
  poll,
  publishAntivirusMessage,
  setupE2e,
  uploadFileToS3,
} from '../utils';
import { v4 as uuid } from 'uuid';
import { PrismaService as FilesPrismaService } from '@apps/files/src/prisma';
import { FileStatus } from '@prisma/files-client';
import {
  MAX_FILE_SIZE_BYTES,
  MAX_SCANNABLE_FILE_SIZE_BYTES,
} from '@app/common/constants';

describe('Files e2e', () => {
  let app: INestApplication;
  let httpServer: Server;
  let configService: ConfigService;
  let prisma: FilesPrismaService;

  beforeAll(async () => {
    const setup = await setupE2e();

    app = setup.app;
    httpServer = setup.httpServer;
    prisma = app.get(FilesPrismaService);
    configService = app.get(ConfigService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    await prisma.file.deleteMany();
    await clearS3Bucket(configService);
  });

  describe('Files', () => {
    let accessToken: string;
    let email: string;

    beforeEach(async () => {
      email = `test+${uuid()}@gmail.com`;
      const response = await request(httpServer)
        .post('/api/v1/auth/register')
        .send({
          email,
          password: '123456',
          name: 'Test User',
        });
      const body = response.body as Record<string, string>;

      accessToken = body.accessToken;
    });

    describe('upload-url', () => {
      const query: GetUploadDataDto = {
        filename: 'avatar.png',
        contentType: 'image/png',
        fileSize: 1024,
      };

      it('should return an upload url with a key if body is valid and access token is provided', async () => {
        const response = await request(httpServer)
          .get('/api/v1/files/upload-data')
          .query(query)
          .set({
            Authorization: `Bearer ${accessToken}`,
          });
        const body = response.body as Record<string, string>;

        expect(body.url).toBeDefined();
        expect(body.key).toBeDefined();
      });
      it('should store a slug in the database matching the filename', async () => {
        const response = await request(httpServer)
          .get('/api/v1/files/upload-data')
          .query(query)
          .set({ Authorization: `Bearer ${accessToken}` });

        const { key } = response.body as { key: string };
        const file = await prisma.file.findUnique({ where: { key } });

        expect(file?.slug).toMatch(/^avatar-[a-z0-9]{12}\.png$/);
      });

      it('should return a 403 if no access token provided', async () => {
        await request(httpServer)
          .get('/api/v1/files/upload-data')
          .query(query)
          .expect(403);
      });
      it('should return a 400 if no filename provided', async () => {
        const invalidQuery = {
          contentType: query.contentType,
        };

        await request(httpServer)
          .get('/api/v1/files/upload-data')
          .query(invalidQuery)
          .set({
            Authorization: `Bearer ${accessToken}`,
          })
          .expect(400);
      });
      it('should return a 400 if no contentType provided', async () => {
        const invalidQuery = {
          filename: query.filename,
        };

        await request(httpServer)
          .get('/api/v1/files/upload-data')
          .query(invalidQuery)
          .set({
            Authorization: `Bearer ${accessToken}`,
          })
          .expect(400);
      });

      it('should return a 400 if fileSize exceeds 100GB', async () => {
        await request(httpServer)
          .get('/api/v1/files/upload-data')
          .query({ ...query, fileSize: MAX_FILE_SIZE_BYTES + 1 })
          .set({ Authorization: `Bearer ${accessToken}` })
          .expect(400);
      });
    });

    describe('confirm-upload', () => {
      let key: string;

      beforeEach(async () => {
        const response = await request(httpServer)
          .get('/api/v1/files/upload-data')
          .query({
            filename: 'avatar.png',
            contentType: 'image/png',
            fileSize: 1024,
          })
          .set({ Authorization: `Bearer ${accessToken}` });

        key = (response.body as { key: string }).key;

        await uploadFileToS3(configService, key);
      });

      it('should return the key', async () => {
        const response = await request(httpServer)
          .post('/api/v1/files/confirm-upload')
          .send({ key })
          .set({ Authorization: `Bearer ${accessToken}` });

        expect((response.body as { key: string }).key).toBe(key);
      });

      it('should return a 201', async () => {
        await request(httpServer)
          .post('/api/v1/files/confirm-upload')
          .send({ key })
          .set({ Authorization: `Bearer ${accessToken}` })
          .expect(201);
      });

      it('should return a 404 if no PENDING record exists in DB', async () => {
        await request(httpServer)
          .post('/api/v1/files/confirm-upload')
          .send({ key: 'unknown/key' })
          .set({ Authorization: `Bearer ${accessToken}` })
          .expect(404);
      });

      it('should return 400 and set file status to FAILED if file is not in S3', async () => {
        const uploadResponse = await request(httpServer)
          .get('/api/v1/files/upload-data')
          .query({
            filename: 'missing.png',
            contentType: 'image/png',
            fileSize: 1024,
          })
          .set({ Authorization: `Bearer ${accessToken}` });

        const missingKey = (uploadResponse.body as { key: string }).key;

        await request(httpServer)
          .post('/api/v1/files/confirm-upload')
          .send({ key: missingKey })
          .set({ Authorization: `Bearer ${accessToken}` })
          .expect(400);

        const file = await prisma.file.findUnique({
          where: { key: missingKey },
        });

        expect(file?.status).toBe(FileStatus.FAILED);
      });

      it('should set file status to FAILED when max retries are exhausted', async () => {
        const file = await prisma.file.findUnique({ where: { key } });

        await publishAntivirusMessage(
          configService,
          { key, userId: file!.userId, fileSize: file!.size ?? 1024 },
          5,
        );

        await poll(async () => {
          const polledFile = await prisma.file.findUnique({ where: { key } });
          return polledFile?.status === FileStatus.FAILED;
        });

        const updatedFile = await prisma.file.findUnique({ where: { key } });
        expect(updatedFile?.status).toBe(FileStatus.FAILED);
      });

      it('should set file status to CLEAN with scanned=true after a successful scan', async () => {
        await request(httpServer)
          .post('/api/v1/files/confirm-upload')
          .send({ key })
          .set({ Authorization: `Bearer ${accessToken}` });

        await poll(async () => {
          const file = await prisma.file.findUnique({ where: { key } });
          return file?.status === FileStatus.CLEAN;
        });

        const file = await prisma.file.findUnique({ where: { key } });
        expect(file?.status).toBe(FileStatus.CLEAN);
        expect(file?.scanned).toBe(true);
      });

      it('should set file status to CLEAN with scanned=false when file exceeds 100MB', async () => {
        const uploadResponse = await request(httpServer)
          .get('/api/v1/files/upload-data')
          .query({
            filename: 'large.bin',
            contentType: 'application/octet-stream',
            fileSize: MAX_SCANNABLE_FILE_SIZE_BYTES + 1,
          })
          .set({ Authorization: `Bearer ${accessToken}` });

        const largeKey = (uploadResponse.body as { key: string }).key;

        await uploadFileToS3(configService, largeKey);

        await request(httpServer)
          .post('/api/v1/files/confirm-upload')
          .send({ key: largeKey })
          .set({ Authorization: `Bearer ${accessToken}` });

        await poll(async () => {
          const file = await prisma.file.findUnique({
            where: { key: largeKey },
          });
          return file?.status === FileStatus.CLEAN;
        });

        const file = await prisma.file.findUnique({ where: { key: largeKey } });
        expect(file?.status).toBe(FileStatus.CLEAN);
        expect(file?.scanned).toBe(false);
      });

      it('should delete infected file from DB and S3', async () => {
        const uploadResponse = await request(httpServer)
          .get('/api/v1/files/upload-data')
          .query({
            filename: 'eicar.txt',
            contentType: 'text/plain',
            fileSize: 1024,
          })
          .set({ Authorization: `Bearer ${accessToken}` });

        const infectedKey = (uploadResponse.body as { key: string }).key;

        await uploadFileToS3(configService, infectedKey, true);

        await request(httpServer)
          .post('/api/v1/files/confirm-upload')
          .send({ key: infectedKey })
          .set({ Authorization: `Bearer ${accessToken}` });

        const s3 = createS3Client(configService);

        // poll until antivirus pipeline completes: file.uploaded → ClamAV scan → file.scan.infected → cleanup
        await poll(async () => {
          const file = await prisma.file.findUnique({
            where: { key: infectedKey },
          });
          return file === null;
        });

        const file = await prisma.file.findUnique({
          where: { key: infectedKey },
        });
        expect(file).toBeNull();

        await expect(
          s3.send(
            new HeadObjectCommand({
              Bucket: configService.get<string>('AWS_S3_BUCKET_NAME')!,
              Key: infectedKey,
            }),
          ),
        ).rejects.toThrow(Error);
      });

      it('should return a 403 if no access token provided', async () => {
        await request(httpServer)
          .post('/api/v1/files/confirm-upload')
          .send({ key })
          .expect(403);
      });

      it('should return a 400 if no body provided', async () => {
        await request(httpServer)
          .post('/api/v1/files/confirm-upload')
          .set({ Authorization: `Bearer ${accessToken}` })
          .expect(400);
      });

      it('should return a 400 if no key provided', async () => {
        await request(httpServer)
          .post('/api/v1/files/confirm-upload')
          .send({})
          .set({ Authorization: `Bearer ${accessToken}` })
          .expect(400);
      });
    });

    describe('file-status', () => {
      let key: string;

      beforeEach(async () => {
        const uploadResponse = await request(httpServer)
          .get('/api/v1/files/upload-data')
          .query({
            filename: 'avatar.png',
            contentType: 'image/png',
            fileSize: 1024,
          })
          .set({ Authorization: `Bearer ${accessToken}` });

        key = (uploadResponse.body as KeyDto).key;

        await uploadFileToS3(configService, key);

        await request(httpServer)
          .post('/api/v1/files/confirm-upload')
          .send({ key })
          .set({ Authorization: `Bearer ${accessToken}` });
      });

      it('should eventually return CLEAN status after a successful scan', async () => {
        await poll(async () => {
          const response = await request(httpServer)
            .get('/api/v1/files/status')
            .query({ key })
            .set({ Authorization: `Bearer ${accessToken}` });

          return (
            (response.body as { status: string }).status === FileStatus.CLEAN
          );
        });

        const response = await request(httpServer)
          .get('/api/v1/files/status')
          .query({ key })
          .set({ Authorization: `Bearer ${accessToken}` });

        expect((response.body as { status: string }).status).toBe(
          FileStatus.CLEAN,
        );
      });

      it('should return a 404 for an unknown key', async () => {
        await request(httpServer)
          .get('/api/v1/files/status')
          .query({ key: 'unknown/key' })
          .set({ Authorization: `Bearer ${accessToken}` })
          .expect(404);
      });

      it('should return a 403 if no access token provided', async () => {
        await request(httpServer)
          .get('/api/v1/files/status')
          .query({ key })
          .expect(403);
      });

      it('should return a 404 for a key belonging to another user', async () => {
        const otherEmail = `test+${uuid()}@gmail.com`;
        const otherResponse = await request(httpServer)
          .post('/api/v1/auth/register')
          .send({ email: otherEmail, password: '123456', name: 'Other User' });

        const otherToken = (otherResponse.body as { accessToken: string })
          .accessToken;

        await request(httpServer)
          .get('/api/v1/files/status')
          .query({ key })
          .set({ Authorization: `Bearer ${otherToken}` })
          .expect(404);
      });
    });

    describe('read-url', () => {
      let fileKey: string;

      beforeEach(async () => {
        const uploadResponse = await request(httpServer)
          .get('/api/v1/files/upload-data')
          .query({
            filename: 'avatar.png',
            contentType: 'image/png',
            fileSize: 1024,
          })
          .set({ Authorization: `Bearer ${accessToken}` });

        fileKey = (uploadResponse.body as { key: string }).key;

        await uploadFileToS3(configService, fileKey);

        await request(httpServer)
          .post('/api/v1/files/confirm-upload')
          .send({ key: fileKey })
          .set({ Authorization: `Bearer ${accessToken}` });
      });

      it('should return a url if key is valid', async () => {
        const response = await request(httpServer)
          .get('/api/v1/files/read-url')
          .set({ Authorization: `Bearer ${accessToken}` })
          .query({ key: fileKey });

        const body = response.body as Record<string, string>;

        expect(body.url).toBeDefined();
      });
      it('should return a 404 if file does not exist', async () => {
        await request(httpServer)
          .get('/api/v1/files/read-url')
          .set({ Authorization: `Bearer ${accessToken}` })
          .query({ key: 'file-key' })
          .expect(404);
      });
      it('should return a 403 if no access token provided', async () => {
        await request(httpServer)
          .get('/api/v1/files/read-url')
          .query({ key: fileKey })
          .expect(403);
      });
      it('should return a 400 if no query provided', async () => {
        await request(httpServer)
          .get('/api/v1/files/read-url')
          .set({ Authorization: `Bearer ${accessToken}` })
          .expect(400);
      });
    });
  });
});

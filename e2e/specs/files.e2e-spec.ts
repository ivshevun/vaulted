import { createS3Client, GetUploadDataDto } from '@app/common';
import { HeadObjectCommand } from '@aws-sdk/client-s3';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Server } from 'http';
import request from 'supertest';
import { clearS3Bucket, poll, setupE2e, uploadFileToS3 } from '../utils';
import { v4 as uuid } from 'uuid';
import { PrismaService as FilesPrismaService } from '@apps/files/src/prisma';
import { FileStatus } from '@prisma/files-client';

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
      const response = await request(httpServer).post('/auth/register').send({
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
      };

      it('should return an upload url with a key if body is valid and access token is provided', async () => {
        const response = await request(httpServer)
          .get('/files/upload-data')
          .query(query)
          .set({
            Authorization: `Bearer ${accessToken}`,
          });
        const body = response.body as Record<string, string>;

        expect(body.url).toBeDefined();
        expect(body.key).toBeDefined();
      });
      it('should return a 403 if no access token provided', async () => {
        await request(httpServer)
          .get('/files/upload-data')
          .query(query)
          .expect(403);
      });
      it('should return a 400 if no filename provided', async () => {
        const invalidQuery = {
          contentType: query.contentType,
        };

        await request(httpServer)
          .get('/files/upload-data')
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
          .get('/files/upload-data')
          .query(invalidQuery)
          .set({
            Authorization: `Bearer ${accessToken}`,
          })
          .expect(400);
      });
    });

    describe('confirm-upload', () => {
      let key: string;

      beforeEach(async () => {
        const response = await request(httpServer)
          .get('/files/upload-data')
          .query({ filename: 'avatar.png', contentType: 'image/png' })
          .set({ Authorization: `Bearer ${accessToken}` });

        key = (response.body as { key: string }).key;

        await uploadFileToS3(configService, key);
      });

      it('should return the key', async () => {
        const response = await request(httpServer)
          .post('/files/confirm-upload')
          .send({ key })
          .set({ Authorization: `Bearer ${accessToken}` });

        expect((response.body as { key: string }).key).toBe(key);
      });

      it('should return a 201', async () => {
        await request(httpServer)
          .post('/files/confirm-upload')
          .send({ key })
          .set({ Authorization: `Bearer ${accessToken}` })
          .expect(201);
      });

      it('should return a 404 if no PENDING record exists in DB', async () => {
        await request(httpServer)
          .post('/files/confirm-upload')
          .send({ key: 'unknown/key' })
          .set({ Authorization: `Bearer ${accessToken}` })
          .expect(404);
      });

      it('should set file status to FAILED if file is not in S3', async () => {
        const uploadResponse = await request(httpServer)
          .get('/files/upload-data')
          .query({ filename: 'missing.png', contentType: 'image/png' })
          .set({ Authorization: `Bearer ${accessToken}` });

        const missingKey = (uploadResponse.body as { key: string }).key;

        await request(httpServer)
          .post('/files/confirm-upload')
          .send({ key: missingKey })
          .set({ Authorization: `Bearer ${accessToken}` });

        const file = await prisma.file.findUnique({
          where: { key: missingKey },
        });

        expect(file?.status).toBe(FileStatus.FAILED);
      });

      it('should delete infected file from DB and S3', async () => {
        const uploadResponse = await request(httpServer)
          .get('/files/upload-data')
          .query({ filename: 'eicar.txt', contentType: 'text/plain' })
          .set({ Authorization: `Bearer ${accessToken}` });

        const infectedKey = (uploadResponse.body as { key: string }).key;

        await uploadFileToS3(configService, infectedKey, true);

        await request(httpServer)
          .post('/files/confirm-upload')
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
          .post('/files/confirm-upload')
          .send({ key })
          .expect(403);
      });

      it('should return a 400 if no body provided', async () => {
        await request(httpServer)
          .post('/files/confirm-upload')
          .set({ Authorization: `Bearer ${accessToken}` })
          .expect(400);
      });

      it('should return a 400 if no key provided', async () => {
        await request(httpServer)
          .post('/files/confirm-upload')
          .send({})
          .set({ Authorization: `Bearer ${accessToken}` })
          .expect(400);
      });
    });

    describe('read-url', () => {
      let fileKey: string;

      beforeEach(async () => {
        const uploadResponse = await request(httpServer)
          .get('/files/upload-data')
          .query({ filename: 'avatar.png', contentType: 'image/png' })
          .set({ Authorization: `Bearer ${accessToken}` });

        fileKey = (uploadResponse.body as { key: string }).key;

        await uploadFileToS3(configService, fileKey);

        await request(httpServer)
          .post('/files/confirm-upload')
          .send({ key: fileKey })
          .set({ Authorization: `Bearer ${accessToken}` });
      });

      it('should return a url if key is valid', async () => {
        const response = await request(httpServer)
          .get('/files/read-url')
          .set({ Authorization: `Bearer ${accessToken}` })
          .query({ key: fileKey });

        const body = response.body as Record<string, string>;

        expect(body.url).toBeDefined();
      });
      it('should return a 404 if file does not exist', async () => {
        await request(httpServer)
          .get('/files/read-url')
          .set({ Authorization: `Bearer ${accessToken}` })
          .query({ key: 'file-key' })
          .expect(404);
      });
      it('should return a 403 if no access token provided', async () => {
        await request(httpServer)
          .get('/files/read-url')
          .query({ key: fileKey })
          .expect(403);
      });
      it('should return a 400 if no query provided', async () => {
        await request(httpServer)
          .get('/files/read-url')
          .set({ Authorization: `Bearer ${accessToken}` })
          .expect(400);
      });
    });
  });
});

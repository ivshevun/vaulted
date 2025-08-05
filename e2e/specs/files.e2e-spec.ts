import {
  ConfirmUploadDto,
  createS3Client,
  GetUploadDataDto,
} from '@app/common';
import { HeadObjectCommand } from '@aws-sdk/client-s3';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Server } from 'http';
import request from 'supertest';
import { setupE2e, uploadFileToS3 } from '../utils';
import { v4 as uuid } from 'uuid';
import { PrismaService as FilesPrismaService } from '@apps/files/src/prisma';

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
    await prisma.file.deleteMany();

    await app.close();
  });

  afterEach(async () => {
    await prisma.file.deleteMany();
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
      let dto: ConfirmUploadDto;
      beforeAll(async () => {
        dto = {
          key: 'ee3030fe-503b-474c-aa3e-3837aeb6e0ed/avatar.png-8bac9ec1-992e-4512-b266-bd4f5ee07620',
          filename: 'avatar.png',
          contentType: 'image/png',
        };

        dto.key = await uploadFileToS3(configService, 'user-id');
      });

      it('should return true if body is valid and access token is provided', async () => {
        const response = await request(httpServer)
          .post('/files/confirm-upload')
          .send(dto)
          .set({
            Authorization: `Bearer ${accessToken}`,
          });

        const body = response.body as boolean;

        expect(body).toBeTruthy();
      });
      it('should create a file if body is valid and access token is provided', async () => {
        await request(httpServer)
          .post('/files/confirm-upload')
          .send(dto)
          .set({
            Authorization: `Bearer ${accessToken}`,
          });

        const file = await prisma.file.findUnique({
          where: {
            key: dto.key,
          },
        });

        expect(file).toBeDefined();
      });
      it('should delete a file from db if file is infected', async () => {
        const dto: ConfirmUploadDto = {
          key: await uploadFileToS3(configService, 'user-id', true),
          filename: 'eicar.txt',
          contentType: 'text/plain',
        };

        await request(httpServer)
          .post('/files/confirm-upload')
          .send(dto)
          .set({
            Authorization: `Bearer ${accessToken}`,
          });

        const file = await prisma.file.findUnique({
          where: {
            key: dto.key,
          },
        });

        expect(file).toBeNull();
      });
      it('should delete file from aws if file was infected', async () => {
        const dto: ConfirmUploadDto = {
          key: await uploadFileToS3(configService, 'user-id', true),
          filename: 'eicar.txt',
          contentType: 'text/plain',
        };

        await request(httpServer)
          .post('/files/confirm-upload')
          .send(dto)
          .set({
            Authorization: `Bearer ${accessToken}`,
          });

        const s3 = createS3Client(configService);

        const command = new HeadObjectCommand({
          Bucket: configService.get<string>('AWS_S3_BUCKET_NAME')!,
          Key: dto.key,
        });

        await expect(s3.send(command)).rejects.toThrow(Error);
      });
      it('should return a 201 if file is created', async () => {
        await request(httpServer)
          .post('/files/confirm-upload')
          .send(dto)
          .set({
            Authorization: `Bearer ${accessToken}`,
          })
          .expect(201);
      });
      it('should return a 403 if no access token provided', async () => {
        await request(httpServer)
          .post('/files/confirm-upload')
          .send(dto)
          .expect(403);
      });

      it('should return a 400 if no body provided', async () => {
        await request(httpServer)
          .post('/files/confirm-upload')
          .set({
            Authorization: `Bearer ${accessToken}`,
          })
          .expect(400);
      });
      it('should return a 400 if no key provided', async () => {
        const invalidDto = {
          filename: 'avatar.png',
          contentType: 'image/png',
        };

        await request(httpServer)
          .post('/files/confirm-upload')
          .send(invalidDto)
          .set({
            Authorization: `Bearer ${accessToken}`,
          })
          .expect(400);
      });
      it('should return a 400 if no filename provided', async () => {
        const invalidDto = {
          key: 'ee3030fe-503b-474c-aa3e-3837aeb6e0ed/avatar.png-8bac9ec1-992e-4512-b266-bd4f5ee07620',
          contentType: 'image/png',
        };

        await request(httpServer)
          .post('/files/confirm-upload')
          .send(invalidDto)
          .set({
            Authorization: `Bearer ${accessToken}`,
          })
          .expect(400);
      });
      it('should return a 400 if no contentType provided', async () => {
        const invalidDto = {
          key: 'ee3030fe-503b-474c-aa3e-3837aeb6e0ed/avatar.png-8bac9ec1-992e-4512-b266-bd4f5ee07620',
          filename: 'avatar.png',
        };

        await request(httpServer)
          .post('/files/confirm-upload')
          .send(invalidDto)
          .set({
            Authorization: `Bearer ${accessToken}`,
          })
          .expect(400);
      });
    });

    describe('read-url', () => {
      let fileKey: string;

      beforeEach(async () => {
        fileKey = await uploadFileToS3(configService, 'user-id');

        const dto: ConfirmUploadDto = {
          key: fileKey,
          filename: 'avatar.png',
          contentType: 'image/png',
        };

        await request(httpServer)
          .post('/files/confirm-upload')
          .set({
            Authorization: `Bearer ${accessToken}`,
          })
          .send(dto);
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

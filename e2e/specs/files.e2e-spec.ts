import { INestApplication } from '@nestjs/common';
import { Server } from 'http';
import { PrismaClient } from '@prisma/client';
import { setupE2e } from '../utils';
import request from 'supertest';
import { ConfirmUploadDto, GetUploadDataDto } from '@app/common';

describe('Files e2e', () => {
  let app: INestApplication;
  let httpServer: Server;
  const prisma = new PrismaClient();

  beforeAll(async () => {
    const setup = await setupE2e();

    app = setup.app;
    httpServer = setup.httpServer;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await prisma.file.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('Files', () => {
    let accessToken: string;

    beforeEach(async () => {
      const response = await request(httpServer).post('/auth/register').send({
        email: 'test@gmail.com',
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
      const dto: ConfirmUploadDto = {
        key: 'ee3030fe-503b-474c-aa3e-3837aeb6e0ed/avatar.png-8bac9ec1-992e-4512-b266-bd4f5ee07620',
        filename: 'avatar.png',
        contentType: 'image/png',
        size: 123,
      };

      it('should return a created file if body is valid and access token is provided', async () => {
        const response = await request(httpServer)
          .post('/files/confirm-upload')
          .send(dto)
          .set({
            Authorization: `Bearer ${accessToken}`,
          });

        const body = response.body as Record<string, string>;

        expect(body).toMatchObject({
          id: expect.any(String) as string,
          filename: expect.any(String) as string,
          contentType: expect.any(String) as string,
          size: expect.any(Number) as number,
        });
      });
      it('should create a file if body is valid and access token is provided', async () => {
        await request(httpServer)
          .post('/files/confirm-upload')
          .send(dto)
          .set({
            Authorization: `Bearer ${accessToken}`,
          });

        const files = await prisma.file.findMany();

        expect(files.length).toBe(1);
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
          size: 123,
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
          size: 123,
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
          size: 123,
        };

        await request(httpServer)
          .post('/files/confirm-upload')
          .send(invalidDto)
          .set({
            Authorization: `Bearer ${accessToken}`,
          })
          .expect(400);
      });
      it('should return a 400 if no size provided', async () => {
        const invalidDto = {
          key: 'ee3030fe-503b-474c-aa3e-3837aeb6e0ed/avatar.png-8bac9ec1-992e-4512-b266-bd4f5ee07620',
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
    });

    describe('read-url', () => {
      let fileKey: string;

      beforeEach(async () => {
        fileKey =
          'ee3030fe-503b-474c-aa3e-3837aeb6e0ed/avatar.png-8bac9ec1-992e-4512-b266-bd4f5ee07620';

        const dto: ConfirmUploadDto = {
          key: fileKey,
          filename: 'avatar.png',
          contentType: 'image/png',
          size: 123,
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

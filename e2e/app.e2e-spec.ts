import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiGatewayModule } from '../apps/api-gateway/src/api-gateway.module';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { Server } from 'http';
import { GetUploadDataDto, RegisterDto } from '@app/common';
import { HttpRpcExceptionInterceptor } from '../apps/api-gateway/src/auth/interceptors';
import cookieParser from 'cookie-parser';

describe('App (e2e)', () => {
  let app: INestApplication;
  let httpServer: Server;
  const prisma = new PrismaClient();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ApiGatewayModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalInterceptors(new HttpRpcExceptionInterceptor());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.use(cookieParser());

    httpServer = app.getHttpServer() as Server;

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await prisma.file.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('Auth', () => {
    describe('Register', () => {
      const registerDto: RegisterDto = {
        email: 'test@gmail.com',
        password: '123456',
        name: 'Test User',
      };

      it('should return 201 if user is created', async () => {
        return request(httpServer)
          .post('/auth/register')
          .send(registerDto)
          .expect(201);
      });
      it('should return an access token if user is created', async () => {
        const response = await request(httpServer)
          .post('/auth/register')
          .send(registerDto);

        const body = response.body as Record<string, string>;

        expect(response.body).toHaveProperty('accessToken');
        expect(typeof body.accessToken).toBe('string');
      });
      it('should set a refresh token to a set-cookie header', async () => {
        const response = await request(httpServer)
          .post('/auth/register')
          .send(registerDto)
          .expect(201);

        const cookies = response.header['set-cookie'] as unknown as string[];
        expect(cookies).toBeDefined();
        expect(cookies.some((cookie) => cookie.startsWith('refreshToken')));
      });
      it('should save a user in DB if user is created', async () => {
        await request(httpServer)
          .post('/auth/register')
          .send(registerDto)
          .expect(201);

        expect(
          prisma.user.findUnique({ where: { email: registerDto.email } }),
        ).toBeDefined();
      });
      it('should throw a ConflictException if user already exists', async () => {
        // creating a user for the first time
        await request(httpServer).post('/auth/register').send(registerDto);

        await request(httpServer)
          .post('/auth/register')
          .send(registerDto)
          .expect(409);
      });
      it('should throw a BadRequestException if no body provided to the request', async () => {
        await request(httpServer).post('/auth/register').expect(400);
      });
      it('should throw a BadRequestException if no email provided', async () => {
        const invalidDto = {
          password: registerDto.password,
          name: registerDto.name,
        };

        await request(httpServer)
          .post('/auth/register')
          .send(invalidDto)
          .expect(400);
      });
      it('should throw a BadRequestException if no name provided', async () => {
        const invalidDto = {
          email: registerDto.email,
          password: registerDto.password,
        };

        await request(httpServer)
          .post('/auth/register')
          .send(invalidDto)
          .expect(400);
      });
      it('should throw a BadRequestException if no password provided', async () => {
        const invalidDto = {
          name: registerDto.name,
          email: registerDto.email,
        };

        await request(httpServer)
          .post('/auth/register')
          .send(invalidDto)
          .expect(400);
      });
    });
    describe('Login', () => {
      const registerDto: RegisterDto = {
        email: 'login@gmail.com',
        password: '123456',
        name: 'Login User',
      };

      const loginDto = {
        email: registerDto.email,
        password: registerDto.password,
      };

      beforeEach(async () => {
        await request(httpServer).post('/auth/register').send(registerDto);
      });

      it('should return 200 if credentials are valid', async () => {
        await request(httpServer)
          .post('/auth/login')
          .send(loginDto)
          .expect(200);
      });

      it('should return an access token if login is successful', async () => {
        const response = await request(httpServer)
          .post('/auth/login')
          .send(loginDto);

        expect(response.body).toHaveProperty('accessToken');
      });

      it('should set a refresh token in the Set-Cookie header', async () => {
        const response = await request(httpServer)
          .post('/auth/login')
          .send(loginDto);

        const cookies = response.header['set-cookie'] as unknown as string[];

        expect(cookies).toBeDefined();
        expect(
          cookies.some((cookie) => cookie.startsWith('refreshToken')),
        ).toBeTruthy();
      });

      it('should return 401 if email is invalid', async () => {
        await request(httpServer)
          .post('/auth/login')
          .send({
            email: 'wrong@email.com',
            password: loginDto.password,
          })
          .expect(401);
      });

      it('should return 401 if password is invalid', async () => {
        await request(httpServer)
          .post('/auth/login')
          .send({
            email: loginDto.email,
            password: 'wrong-password',
          })
          .expect(401);
      });

      it('should return 400 if email is not provided', async () => {
        await request(httpServer)
          .post('/auth/login')
          .send({
            password: loginDto.password,
          })
          .expect(400);
      });

      it('should return 400 if password is not provided', async () => {
        await request(httpServer)
          .post('/auth/login')
          .send({
            email: loginDto.email,
          })
          .expect(400);
      });

      it('should return 400 if no body provided', async () => {
        await request(httpServer).post('/auth/login').expect(400);
      });
    });
    describe('Refresh', () => {
      const registerDto: RegisterDto = {
        email: 'refresh@gmail.com',
        password: '123456',
        name: 'Refresh Test',
      };

      let refreshToken: string;

      beforeEach(async () => {
        const response = await request(httpServer)
          .post('/auth/register')
          .send(registerDto)
          .expect(201);

        const cookies = response.header['set-cookie'] as unknown as string[];
        refreshToken = cookies
          .find((cookie) => cookie.startsWith('refreshToken='))
          ?.split(';')[0]
          ?.split('=')[1] as string;
      });

      it('should return 200 if refresh token is valid', async () => {
        return request(httpServer)
          .post('/auth/refresh')
          .set('Cookie', [`refreshToken=${refreshToken}`])
          .expect(200);
      });

      it('should return a new access token if refresh token is valid', async () => {
        const response = await request(httpServer)
          .post('/auth/refresh')
          .set('Cookie', [`refreshToken=${refreshToken}`])
          .expect(200);

        const body = response.body as Record<string, string>;

        expect(response.body).toHaveProperty('accessToken');
        expect(typeof body.accessToken).toBe('string');
      });

      it('should set a new refresh token to a set-cookie header', async () => {
        const response = await request(httpServer)
          .post('/auth/refresh')
          .set('Cookie', [`refreshToken=${refreshToken}`])
          .expect(200);

        const cookies = response.header['set-cookie'] as unknown as string[];
        expect(
          cookies.some((cookie) => cookie.startsWith('refreshToken=')),
        ).toBe(true);
      });

      it('should return 401 if no refresh token is provided', async () => {
        return request(httpServer).post('/auth/refresh').expect(401);
      });

      it('should return 401 if refresh token is invalid', async () => {
        return request(httpServer)
          .post('/auth/refresh')
          .set('Cookie', [`refreshToken=invalid-token`])
          .expect(401);
      });
    });
    describe('Logout', () => {
      it('should remove refresh token from response', async () => {
        const response = await request(httpServer)
          .post('/auth/logout')
          .expect(200);

        const cookies = response.headers['set-cookie'] as unknown as string[];

        const refreshCookie = cookies.find((cookie: string) =>
          cookie.startsWith('refreshToken='),
        );

        expect(refreshCookie).toContain(
          'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
        );
      });
    });
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
  });
});

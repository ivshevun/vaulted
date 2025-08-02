import { INestApplication } from '@nestjs/common';
import { Server } from 'http';
import { LoginDto, PrismaService, RegisterDto } from '@app/common';
import request from 'supertest';
import { setupE2e } from '../utils';
import { v4 as uuid } from 'uuid';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let prisma: PrismaService;

  beforeAll(async () => {
    const setup = await setupE2e();

    app = setup.app;
    httpServer = setup.httpServer;

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.file.deleteMany();
    await prisma.user.deleteMany();

    await app.close();
  });

  // beforeEach(async () => {
  //   await prisma.file.deleteMany();
  // });

  describe('Auth', () => {
    describe('Register', () => {
      let registerDto: RegisterDto;

      beforeEach(() => {
        registerDto = {
          email: `test+${uuid()}@gmail.com`,
          password: '123456',
          name: 'Test User',
        };
      });

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
      let registerDto: RegisterDto;
      let loginDto: LoginDto;

      beforeEach(async () => {
        registerDto = {
          email: 'login@gmail.com',
          password: '123456',
          name: 'Login User',
        };

        loginDto = {
          email: registerDto.email,
          password: registerDto.password,
        };

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
      let registerDto: RegisterDto;
      let refreshToken: string;

      beforeEach(async () => {
        registerDto = {
          email: `refresh+${uuid()}@gmail.com`,
          password: '123456',
          name: 'Refresh Test',
        };

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
});

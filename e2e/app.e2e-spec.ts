import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiGatewayModule } from '../apps/api-gateway/src/api-gateway.module';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';

describe('App (e2e)', () => {
  let app: INestApplication;
  const prisma = new PrismaClient();

  beforeAll(async () => {
    await prisma.file.deleteMany();
    await prisma.user.deleteMany();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ApiGatewayModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/register', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: '123456',
        name: 'test',
      })
      .expect(201);
  });
});

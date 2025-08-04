import { Test, TestingModule } from '@nestjs/testing';
import { ApiGatewayModule } from '../../apps/api-gateway/src/api-gateway.module';
import { HttpRpcExceptionInterceptor } from '../../apps/api-gateway/src/auth/interceptors';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { Server } from 'http';
import {
  PrismaModule as FilesPrismaModule,
  PrismaService as FilesPrismaService,
} from '../../apps/files/src/prisma';
import {
  PrismaModule as AuthPrismaModule,
  PrismaService as AuthPrismaService,
} from '../../apps/auth/src/prisma';

export async function setupE2e() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [ApiGatewayModule, FilesPrismaModule, AuthPrismaModule],
    providers: [FilesPrismaService, AuthPrismaService],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalInterceptors(new HttpRpcExceptionInterceptor());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.use(cookieParser());

  const httpServer = app.getHttpServer() as Server;

  await app.init();

  return { app, httpServer };
}

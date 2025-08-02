import { Test, TestingModule } from '@nestjs/testing';
import { ApiGatewayModule } from '../../apps/api-gateway/src/api-gateway.module';
import { HttpRpcExceptionInterceptor } from '../../apps/api-gateway/src/auth/interceptors';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { Server } from 'http';
import { PrismaModule, PrismaService } from '@app/common';

export async function setupE2e() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [ApiGatewayModule, PrismaModule],
    providers: [PrismaService],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalInterceptors(new HttpRpcExceptionInterceptor());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.use(cookieParser());

  const httpServer = app.getHttpServer() as Server;

  await app.init();

  return { app, httpServer };
}

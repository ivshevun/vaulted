import { NestFactory } from '@nestjs/core';
import { ApiGatewayModule } from './api-gateway.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { HttpRpcExceptionInterceptor } from './auth/interceptors';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);

  app.useGlobalInterceptors(new HttpRpcExceptionInterceptor());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.use(cookieParser());

  await app.listen(3001);
}

void bootstrap();

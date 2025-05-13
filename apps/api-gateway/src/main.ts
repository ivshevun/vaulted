import { NestFactory } from '@nestjs/core';
import { ApiGatewayModule } from './api-gateway.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { HttpRpcExceptionInterceptor } from './auth/interceptors';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);

  app.useGlobalInterceptors(new HttpRpcExceptionInterceptor());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.use(cookieParser());

  const config = new DocumentBuilder()
    .setTitle('Vaulted')
    .setDescription('Vaulted API description')
    .setVersion('0.0.1')
    .addTag('vaulted')
    .addBearerAuth()
    .addCookieAuth()
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documentFactory);

  await app.listen(3001);
}

void bootstrap();

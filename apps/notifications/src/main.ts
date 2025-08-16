import { NestFactory } from '@nestjs/core';
import { NotificationsModule } from './notifications.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(NotificationsModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  await app.listen(5001);
}

void bootstrap();

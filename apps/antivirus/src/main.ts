import { NestFactory } from '@nestjs/core';
import { AntivirusModule } from './antivirus.module';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { MicroserviceExceptionFilter } from '@app/common';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AntivirusModule, {
    bufferLogs: true,
  });
  const configService = app.get(ConfigService);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [configService.get<string>('RABBITMQ_URL')!],
      queue: 'antivirus_queue',
      queueOptions: {
        durable: true,
      },
    },
  });

  app.useLogger(app.get(Logger));

  app.useGlobalFilters(new MicroserviceExceptionFilter());

  await app.startAllMicroservices();
}

void bootstrap();

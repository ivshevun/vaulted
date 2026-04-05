import { NestFactory } from '@nestjs/core';
import { AntivirusModule } from './antivirus.module';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { MicroserviceExceptionFilter } from '@app/common';
import { Logger } from 'nestjs-pino';
import { FILE_UPLOADED, RMQ_EXCHANGE } from '@app/common/constants';
import { ANTIVIRUS_DLX } from './antivirus.constants';

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
      noAck: false,
      queueOptions: {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': ANTIVIRUS_DLX,
          'x-dead-letter-routing-key': FILE_UPLOADED,
        } as Record<string, string>,
      },
      wildcards: true,
      exchangeType: 'topic',
      exchange: RMQ_EXCHANGE,
      routingKey: 'file.uploaded',
    },
  });

  app.useLogger(app.get(Logger));

  app.useGlobalFilters(new MicroserviceExceptionFilter());

  await app.startAllMicroservices();
}

void bootstrap();

import { NestFactory } from '@nestjs/core';
import { AntivirusModule } from './antivirus.module';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { MicroserviceExceptionFilter } from '@app/common';
import { Logger } from 'nestjs-pino';
import {
  ANTIVIRUS_DLX,
  ANTIVIRUS_QUEUE,
  FILE_UPLOADED,
  RMQ_EXCHANGE,
} from '@app/common/constants';

async function bootstrap() {
  const app = await NestFactory.create(AntivirusModule, {
    bufferLogs: true,
  });
  const configService = app.get(ConfigService);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [configService.get<string>('RABBITMQ_URL')!],
      queue: ANTIVIRUS_QUEUE,
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
      routingKey: FILE_UPLOADED,
    },
  });

  app.useLogger(app.get(Logger));

  app.useGlobalFilters(new MicroserviceExceptionFilter());

  await Promise.all([
    app.startAllMicroservices(),
    app.listen(configService.get<number>('HTTP_PORT')!),
  ]);
}

void bootstrap();

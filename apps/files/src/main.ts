import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { FilesModule } from './files.module';
import { Logger } from 'nestjs-pino';
import { FILES_QUEUE, RMQ_EXCHANGE } from '@app/common/constants';

async function bootstrap() {
  const app = await NestFactory.create(FilesModule, {
    bufferLogs: true,
  });
  const configService = app.get(ConfigService);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [configService.get<string>('RABBITMQ_URL')!],
      queue: FILES_QUEUE,
      queueOptions: {
        durable: true,
      },
      wildcards: true,
      exchangeType: 'topic',
      exchange: RMQ_EXCHANGE,
      routingKey: 'file.#',
    },
  });

  app.useLogger(app.get(Logger));

  await Promise.all([
    app.startAllMicroservices(),
    app.listen(configService.get<number>('HTTP_PORT')!),
  ]);
}

void bootstrap();

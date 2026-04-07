import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { AUTH_QUEUE, RMQ_EXCHANGE } from '@app/common/constants';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule, {
    bufferLogs: true,
  });
  const configService = app.get(ConfigService);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [configService.get<string>('RABBITMQ_URL')!],
      queue: AUTH_QUEUE,
      queueOptions: {
        durable: true,
      },
      wildcards: true,
      exchangeType: 'topic',
      exchange: RMQ_EXCHANGE,
    },
  });

  app.useLogger(app.get(Logger));

  await Promise.all([
    app.startAllMicroservices(),
    app.listen(configService.get<number>('HTTP_PORT')!),
  ]);
}

void bootstrap();

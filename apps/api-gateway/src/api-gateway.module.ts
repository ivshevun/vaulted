import { Module } from '@nestjs/common';
import { AuthModule } from './auth/src/auth.module';
import { FilesController } from './files/src/files.controller';
import { FilesModule } from './files/src/files.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { pinoConfig } from '@app/common';
import { AUTH_QUEUE, FILES_QUEUE, RMQ_EXCHANGE } from '@app/common/constants';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'auth',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL')!],
            queue: AUTH_QUEUE,
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'files',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL')!],
            queue: FILES_QUEUE,
            queueOptions: {
              durable: true,
            },
            wildcards: true,
            exchangeType: 'topic',
          },
        }),
        inject: [ConfigService],
      },
      {
        name: RMQ_EXCHANGE,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL')!],
            exchange: RMQ_EXCHANGE,
            exchangeType: 'topic',
            wildcards: true,
          },
        }),
        inject: [ConfigService],
      },
    ]),
    AuthModule,
    FilesModule,
    LoggerModule.forRoot(pinoConfig),
  ],
  controllers: [FilesController],
  providers: [],
})
export class ApiGatewayModule {}

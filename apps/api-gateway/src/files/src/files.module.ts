import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Joi from 'joi';
import { RMQ_EXCHANGE } from '@app/common/constants';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        AUTH_PORT: Joi.number().required(),
        FILES_PORT: Joi.number().required(),
      }),
    }),
    ClientsModule.registerAsync([
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
      {
        name: 'auth',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: 'auth',
            port: configService.get<number>('AUTH_PORT')!,
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'files',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: 'files',
            port: configService.get<number>('FILES_PORT')!,
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
})
export class FilesModule {}

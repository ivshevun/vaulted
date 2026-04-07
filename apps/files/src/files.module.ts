import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import Joi from 'joi';
import { PrismaModule } from './prisma';
import { pinoConfig } from '@app/common';
import { RMQ_EXCHANGE } from '@app/common/constants';
import { LoggerModule } from 'nestjs-pino';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    LoggerModule.forRoot(pinoConfig),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        FILES_DATABASE_URL: Joi.string().required(),
        PORT: Joi.string().required(),

        AWS_ACCESS_ID: Joi.string().required(),
        AWS_SECRET_ACCESS_KEY: Joi.string().required(),
        AWS_REGION: Joi.string().required(),
        AWS_S3_BUCKET_NAME: Joi.string().required(),

        RABBITMQ_URL: Joi.string().required(),
        HTTP_PORT: Joi.number().integer().positive().required(),
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
    ]),
  ],
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}

import { Module } from '@nestjs/common';
import { AntivirusController } from './antivirus.controller';
import { AntivirusService } from './antivirus.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Joi from 'joi';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { LoggerModule } from 'nestjs-pino';
import { pinoConfig } from '@app/common';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        AWS_ACCESS_ID: Joi.string().required(),
        AWS_SECRET_ACCESS_KEY: Joi.string().required(),
        AWS_REGION: Joi.string().required(),
        AWS_S3_BUCKET_NAME: Joi.string().required(),

        RABBITMQ_URL: Joi.string().required(),
      }),
      isGlobal: true,
    }),
    ClientsModule.registerAsync([
      {
        name: 'files',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL')!],
            queue: 'files_queue',
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
    LoggerModule.forRoot(pinoConfig),
  ],
  controllers: [AntivirusController],
  providers: [AntivirusService],
})
export class AntivirusModule {}

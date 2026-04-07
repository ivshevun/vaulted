import { Module } from '@nestjs/common';
import { AntivirusController } from './antivirus.controller';
import { AntivirusService } from './antivirus.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Joi from 'joi';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { LoggerModule } from 'nestjs-pino';
import { pinoConfig } from '@app/common';
import { RMQ_EXCHANGE } from '@app/common/constants';
import { AntivirusDlxSetupService } from '@apps/antivirus/src/antivirus-dlx-setup.service';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        AWS_ACCESS_ID: Joi.string().required(),
        AWS_SECRET_ACCESS_KEY: Joi.string().required(),
        AWS_REGION: Joi.string().required(),
        AWS_S3_BUCKET_NAME: Joi.string().required(),

        RABBITMQ_URL: Joi.string().required(),
        HTTP_PORT: Joi.number().integer().positive().required(),
      }),
      isGlobal: true,
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
    LoggerModule.forRoot(pinoConfig),
    HealthModule,
  ],
  controllers: [AntivirusController],
  providers: [AntivirusService, AntivirusDlxSetupService],
})
export class AntivirusModule {}

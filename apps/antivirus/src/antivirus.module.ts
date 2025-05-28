import { Module } from '@nestjs/common';
import { AntivirusController } from './antivirus.controller';
import { AntivirusService } from './antivirus.service';
import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';
import { PrismaModule, PrismaService } from '@app/common';

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
    PrismaModule,
  ],
  controllers: [AntivirusController],
  providers: [AntivirusService, PrismaService],
})
export class AntivirusModule {}

import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';
import { PrismaModule } from './prisma';
import { pinoConfig } from '@app/common';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    PrismaModule,
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
      }),
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}

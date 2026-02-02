import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from './users';
import { ConfigModule } from '@nestjs/config';
import { TokenModule } from './token';
import Joi from 'joi';
import { JwtStrategy } from './strategies';
import { PrismaModule } from './prisma';
import { LoggerModule } from 'nestjs-pino';
import { pinoConfig } from '@app/common';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationOptions: {
        convert: true,
      },
      validationSchema: Joi.object({
        JWT_SECRET: Joi.string().required(),

        JWT_ACCESS_EXPIRATION_SECONDS: Joi.number()
          .integer()
          .positive()
          .required(),

        JWT_REFRESH_EXPIRATION_SECONDS: Joi.number()
          .integer()
          .positive()
          .required(),

        AUTH_DATABASE_URL: Joi.string().required(),
        RABBITMQ_URL: Joi.string().required(),
      }),
    }),
    LoggerModule.forRoot(pinoConfig),
    PrismaModule,
    TokenModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, UsersService, JwtStrategy],
})
export class AuthModule {}

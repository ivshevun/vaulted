import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from './users';
import { ConfigModule } from '@nestjs/config';
import { TokenModule } from './token';
import Joi from 'joi';
import { JwtStrategy } from './strategies';
import { PrismaModule } from './prisma';
import { LoggerModule } from '@app/common';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        POSTGRES_AUTH_USER: Joi.string().required(),
        POSTGRES_AUTH_PASSWORD: Joi.string().required(),
        POSTGRES_AUTH_DB: Joi.string().required(),
        POSTGRES_AUTH_PORT: Joi.number().required(),
        AUTH_DATABASE_URL: Joi.string().required(),
      }),
    }),
    LoggerModule,
    PrismaModule,
    TokenModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, UsersService, JwtStrategy],
})
export class AuthModule {}

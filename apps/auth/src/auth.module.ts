import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from './users';
import { PrismaModule, PrismaService } from '@app/common';
import { ConfigModule } from '@nestjs/config';
import { TokenModule } from './token';
import Joi from 'joi';
import { JwtStrategy } from './strategies';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        POSTGRES_USER: Joi.string().required(),
        POSTGRES_PASSWORD: Joi.string().required(),
        POSTGRES_DB: Joi.string().required(),
        POSTGRES_PORT: Joi.number().required(),
        DATABASE_URL: Joi.string().required(),
      }),
    }),
    TokenModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, UsersService, PrismaService, JwtStrategy],
})
export class AuthModule {}

import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { AUTH_QUEUE } from '@app/common/constants';
import { DevAuthController } from './dev-auth.controller';

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
            queueOptions: { durable: true },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [DevAuthController],
})
export class DevAuthModule {}

import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { RMQ_EXCHANGE } from '@app/common/constants';
import { DevFilesController } from './dev-files.controller';

@Module({
  imports: [
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
  controllers: [DevFilesController],
})
export class DevFilesModule {}

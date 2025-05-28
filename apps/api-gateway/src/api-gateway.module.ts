import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { FilesController } from './files/files.controller';
import { FilesModule } from './files/files.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { AntivirusController } from './antivirus/antivirus.controller';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'auth',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL')!],
            queue: 'auth_queue',
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
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
      {
        name: 'antivirus',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL')!],
            queue: 'antivirus_queue',
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
    AuthModule,
    FilesModule,
  ],
  controllers: [FilesController, AntivirusController],
  providers: [],
})
export class ApiGatewayModule {}

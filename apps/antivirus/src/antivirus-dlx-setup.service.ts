import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import amqplib from 'amqplib';
import { FILE_UPLOADED, RMQ_EXCHANGE } from '@app/common/constants';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import {
  ANTIVIRUS_DLX,
  ANTIVIRUS_RETRY_QUEUE,
  ANTIVIRUS_RETRY_TTL_MS,
} from './antivirus.constants';

@Injectable()
export class AntivirusDlxSetupService implements OnApplicationBootstrap {
  constructor(
    private readonly configService: ConfigService,
    @InjectPinoLogger() private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AntivirusDlxSetupService.name);
  }

  async onApplicationBootstrap(): Promise<void> {
    const url = this.configService.get<string>('RABBITMQ_URL')!;
    const connection = await amqplib.connect(url);
    const channel = await connection.createChannel();

    await channel.assertExchange(ANTIVIRUS_DLX, 'direct', { durable: true });

    await channel.assertQueue(ANTIVIRUS_RETRY_QUEUE, {
      durable: true,
      arguments: {
        'x-message-ttl': ANTIVIRUS_RETRY_TTL_MS,
        'x-dead-letter-exchange': RMQ_EXCHANGE,
        'x-dead-letter-routing-key': FILE_UPLOADED,
      },
    });

    await channel.bindQueue(
      ANTIVIRUS_RETRY_QUEUE,
      ANTIVIRUS_DLX,
      FILE_UPLOADED,
    );

    await channel.close();
    await connection.close();

    this.logger.info('Antivirus retry topology configured');
  }
}

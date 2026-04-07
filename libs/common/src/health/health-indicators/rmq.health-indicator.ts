import { Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import { connect } from 'amqplib';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RmqHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly configService: ConfigService,
  ) {}

  async isHealthy(key: string) {
    const indicator = this.healthIndicatorService.check(key);
    const rabbitmqUrl = this.configService.get<string>('RABBITMQ_URL');

    if (!rabbitmqUrl) {
      return indicator.down({ reason: 'RABBITMQ_URL not configured' });
    }

    let connection: Awaited<ReturnType<typeof connect>> | undefined;
    try {
      connection = await connect(rabbitmqUrl);
      return indicator.up();
    } catch {
      return indicator.down();
    } finally {
      await connection?.close();
    }
  }
}

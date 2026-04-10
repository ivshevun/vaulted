import { Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import net from 'net';
import {
  CLAMAV_PING_COMMAND,
  CLAMAV_PING_TIMEOUT_MS,
  CLAMAV_PONG_RESPONSE,
} from './clamav-health.constants';

@Injectable()
export class ClamavHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly configService: ConfigService,
  ) {}

  async isHealthy(key: string) {
    const indicator = this.healthIndicatorService.check(key);
    try {
      await this.ping();
      return indicator.up();
    } catch {
      return indicator.down();
    }
  }

  private ping(): Promise<void> {
    const host = this.configService.get<string>('CLAMAV_HOST')!;
    const port = this.configService.get<number>('CLAMAV_PORT')!;
    return new Promise((resolve, reject) => {
      const socket = net.createConnection(port, host);

      socket.setTimeout(CLAMAV_PING_TIMEOUT_MS);

      socket.once('connect', () => socket.write(CLAMAV_PING_COMMAND));

      socket.once('data', (data) => {
        socket.destroy();
        if (data.toString() === CLAMAV_PONG_RESPONSE) {
          resolve();
        } else {
          reject(new Error(`Unexpected ClamAV response: ${data.toString()}`));
        }
      });

      socket.once('timeout', () => {
        socket.destroy();
        reject(new Error('ClamAV ping timed out'));
      });

      socket.once('error', (err) => {
        socket.destroy();
        reject(err);
      });
    });
  }
}

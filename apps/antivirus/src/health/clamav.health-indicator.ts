import { Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import net from 'net';
import {
  CLAMAV_HOST,
  CLAMAV_PING_COMMAND,
  CLAMAV_PING_TIMEOUT_MS,
  CLAMAV_PONG_RESPONSE,
  CLAMAV_PORT,
} from './clamav-health.constants';

@Injectable()
export class ClamavHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
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
    return new Promise((resolve, reject) => {
      const socket = net.createConnection(CLAMAV_PORT, CLAMAV_HOST);

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

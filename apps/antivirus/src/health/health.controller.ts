import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { RmqHealthIndicator } from '@app/common';
import { ClamavHealthIndicator } from './clamav.health-indicator';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly rmq: RmqHealthIndicator,
    private readonly clamav: ClamavHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.rmq.isHealthy('rabbitmq'),
      () => this.clamav.isHealthy('clamav'),
    ]);
  }
}

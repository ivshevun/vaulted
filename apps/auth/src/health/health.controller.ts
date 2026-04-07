import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { PrismaHealthIndicator, RmqHealthIndicator } from '@app/common';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly rmq: RmqHealthIndicator,
    private readonly prisma: PrismaHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.rmq.isHealthy('rabbitmq'),
      () => this.prisma.isHealthy('database'),
    ]);
  }
}

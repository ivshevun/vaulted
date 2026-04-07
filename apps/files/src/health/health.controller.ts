import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { PrismaHealthIndicator, RmqHealthIndicator } from '@app/common';
import { S3HealthIndicator } from './s3.health-indicator';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly rmq: RmqHealthIndicator,
    private readonly prisma: PrismaHealthIndicator,
    private readonly s3: S3HealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.rmq.isHealthy('rabbitmq'),
      () => this.prisma.isHealthy('database'),
      () => this.s3.isHealthy('s3'),
    ]);
  }
}

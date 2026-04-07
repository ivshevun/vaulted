import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { RmqHealthIndicator } from '@app/common';
import { HealthController } from './health.controller';
import { ClamavHealthIndicator } from './clamav.health-indicator';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [RmqHealthIndicator, ClamavHealthIndicator],
})
export class HealthModule {}

import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { RmqHealthIndicator } from '@app/common';
import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [RmqHealthIndicator],
})
export class HealthModule {}

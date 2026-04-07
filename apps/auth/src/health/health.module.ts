import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import {
  PrismaHealthIndicator,
  PRISMA_HEALTH_CLIENT,
  RmqHealthIndicator,
} from '@app/common';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [
    RmqHealthIndicator,
    PrismaHealthIndicator,
    { provide: PRISMA_HEALTH_CLIENT, useExisting: PrismaService },
  ],
})
export class HealthModule {}

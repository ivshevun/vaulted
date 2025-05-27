import { Module } from '@nestjs/common';
import { AntivirusController } from './antivirus.controller';
import { AntivirusService } from './antivirus.service';

@Module({
  imports: [],
  controllers: [AntivirusController],
  providers: [AntivirusService],
})
export class AntivirusModule {}

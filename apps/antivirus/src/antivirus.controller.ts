import { Controller, Get } from '@nestjs/common';
import { AntivirusService } from './antivirus.service';

@Controller()
export class AntivirusController {
  constructor(private readonly antivirusService: AntivirusService) {}

  @Get()
  getHello(): string {
    return this.antivirusService.getHello();
  }
}

import { Controller } from '@nestjs/common';
import { AntivirusService } from './antivirus.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import { KeyPayload } from '@app/common';

@Controller()
export class AntivirusController {
  constructor(private readonly antivirusService: AntivirusService) {}

  @EventPattern('scan')
  async scan(@Payload() payload: KeyPayload) {
    await this.antivirusService.scan(payload);
  }
}

import { KeyPayload } from '@app/common';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AntivirusService } from './antivirus.service';

@Controller()
export class AntivirusController {
  constructor(private readonly antivirusService: AntivirusService) {}

  @MessagePattern('scan')
  async scan(@Payload() payload: KeyPayload) {
    return await this.antivirusService.scan(payload);
  }
}

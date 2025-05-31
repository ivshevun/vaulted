import { Controller } from '@nestjs/common';
import { AntivirusService } from './antivirus.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { of } from 'rxjs';
import { KeyPayload } from '@app/common';

@Controller()
export class AntivirusController {
  constructor(private readonly antivirusService: AntivirusService) {}

  @MessagePattern('scan')
  async scan(@Payload() payload: KeyPayload) {
    return of(await this.antivirusService.scan(payload));
  }
}

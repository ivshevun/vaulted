import { Controller } from '@nestjs/common';
import { AntivirusService } from './antivirus.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ScanPayload } from '@app/common';
import { of } from 'rxjs';

@Controller()
export class AntivirusController {
  constructor(private readonly antivirusService: AntivirusService) {}

  @MessagePattern('scan')
  async scan(@Payload() payload: ScanPayload) {
    return of(await this.antivirusService.scan(payload));
  }
}

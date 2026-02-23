import { FileUploadedPayload } from '@app/common';
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AntivirusService } from './antivirus.service';

@Controller()
export class AntivirusController {
  constructor(private readonly antivirusService: AntivirusService) {}

  @EventPattern('file.uploaded')
  async scan(@Payload() payload: FileUploadedPayload) {
    return await this.antivirusService.scan(payload);
  }
}

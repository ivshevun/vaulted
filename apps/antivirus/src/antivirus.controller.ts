import { FileUploadedPayload } from '@app/common';
import { FILE_UPLOADED } from '@app/common/constants';
import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { AntivirusService } from './antivirus.service';

@Controller()
export class AntivirusController {
  constructor(private readonly antivirusService: AntivirusService) {}

  @EventPattern(FILE_UPLOADED)
  async scan(
    @Payload() payload: FileUploadedPayload,
    @Ctx() context: RmqContext,
  ) {
    const retryCount = this.extractRetryCount(context);
    return await this.antivirusService.scan(payload, retryCount);
  }

  private extractRetryCount(context: RmqContext): number {
    const message = context.getMessage() as {
      properties: { headers?: { 'x-death'?: { count: number }[] } };
    };

    const xDeath = message.properties.headers?.['x-death'];

    return xDeath?.[0]?.count ?? 0;
  }
}

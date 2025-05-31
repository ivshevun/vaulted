import { Controller, Get, Inject, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { KeyDto } from '@app/common';

@Controller('antivirus')
export class AntivirusController {
  constructor(@Inject('antivirus') private antivirusClient: ClientProxy) {}

  @Get('scan')
  async scan(@Query() { key }: KeyDto) {
    return await firstValueFrom<string>(
      this.antivirusClient.send('scan', { key }),
    );
  }
}

import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { FILE_DEV_GET_FILE, RMQ_EXCHANGE } from '@app/common/constants';

@Controller('dev/files')
export class DevFilesController {
  constructor(@Inject(RMQ_EXCHANGE) private readonly eventBus: ClientProxy) {}

  @Get('files')
  async getFile(@Query('key') key: string) {
    if (!key) throw new BadRequestException();

    const file = await firstValueFrom(
      this.eventBus
        .send<Record<string, unknown> | null>(FILE_DEV_GET_FILE, { key })
        .pipe(timeout(5000)),
    );
    if (!file) throw new NotFoundException();

    return file;
  }
}

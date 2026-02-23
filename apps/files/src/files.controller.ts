import { GetUploadDataPayload, KeyPayload } from '@app/common';
import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { of } from 'rxjs';
import { FilesService } from './files.service';
import { CreateFileType } from './types';

@Controller()
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @MessagePattern('get-upload-data')
  async getUploadData(@Payload() getUploadDataPayload: GetUploadDataPayload) {
    const url = await this.filesService.getUploadData(getUploadDataPayload);

    return of(url);
  }

  @MessagePattern('get-read-url')
  async getReadUrl(@Payload() getReadUrlPayload: KeyPayload) {
    const url = await this.filesService.getReadUrl(getReadUrlPayload);

    return of(url);
  }

  @EventPattern('file.scan.infected')
  async onInfected(@Payload() payload: KeyPayload) {
    await this.filesService.onInfected(payload);
  }

  @EventPattern('file.scan.clear')
  async onClearFile(@Payload() payload: CreateFileType) {
    await this.filesService.onClearFile(payload);
  }
}

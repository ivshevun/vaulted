import {
  ConfirmUploadPayload,
  GetUploadDataPayload,
  KeyPayload,
} from '@app/common';
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

  @MessagePattern('confirm-upload')
  async confirmUpload(@Payload() confirmUploadPayload: ConfirmUploadPayload) {
    const file = await this.filesService.confirmUpload(confirmUploadPayload);

    return of(file);
  }

  @MessagePattern('get-read-url')
  async getReadUrl(@Payload() getReadUrlPayload: KeyPayload) {
    const url = await this.filesService.getReadUrl(getReadUrlPayload);

    return of(url);
  }

  @EventPattern('on-infected')
  async onInfected(@Payload() payload: KeyPayload) {
    await this.filesService.onInfected(payload);
  }

  @EventPattern('on-clear-file')
  async onClearFile(@Payload() payload: CreateFileType) {
    await this.filesService.onClearFile(payload);
  }
}

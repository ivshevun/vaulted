import { Controller } from '@nestjs/common';
import { FilesService } from './files.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  ConfirmUploadPayload,
  GetReadUrlPayload,
  GetUploadDataPayload,
} from '@app/common';
import { of } from 'rxjs';

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
  async getReadUrl(@Payload() getReadUrlPayload: GetReadUrlPayload) {
    const url = await this.filesService.getReadUrl(getReadUrlPayload);

    return of(url);
  }
}

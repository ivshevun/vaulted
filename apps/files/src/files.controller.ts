import { GetUploadDataPayload, KeyPayload } from '@app/common';
import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { of } from 'rxjs';
import { FilesService } from './files.service';
import {
  FILE_GET_READ_URL,
  FILE_GET_UPLOAD_DATA,
  FILE_SCAN_CLEAR,
  FILE_SCAN_INFECTED,
} from '@app/common/constants';

@Controller()
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @MessagePattern(FILE_GET_UPLOAD_DATA)
  async getUploadData(@Payload() getUploadDataPayload: GetUploadDataPayload) {
    const url = await this.filesService.getUploadData(getUploadDataPayload);

    return of(url);
  }

  @MessagePattern(FILE_GET_READ_URL)
  async getReadUrl(@Payload() getReadUrlPayload: KeyPayload) {
    const url = await this.filesService.getReadUrl(getReadUrlPayload);

    return of(url);
  }

  @EventPattern(FILE_SCAN_INFECTED)
  async onInfected(@Payload() payload: KeyPayload) {
    await this.filesService.onInfected(payload);
  }

  @EventPattern(FILE_SCAN_CLEAR)
  async onClearFile(@Payload() payload: KeyPayload) {
    await this.filesService.onClearFile(payload);
  }
}

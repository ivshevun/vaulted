import {
  FileUploadedPayload,
  GetFileStatusPayload,
  GetUploadDataPayload,
  KeyPayload,
} from '@app/common';
import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { of } from 'rxjs';
import { FilesService } from './files.service';
import {
  FILE_CONFIRM_UPLOAD,
  FILE_GET_READ_URL,
  FILE_GET_STATUS,
  FILE_GET_UPLOAD_DATA,
  FILE_SCAN_CLEAR,
  FILE_SCAN_FAILED,
  FILE_SCAN_INFECTED,
  FILE_SCAN_SKIPPED,
  FILE_SCAN_STARTED,
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

  @EventPattern(FILE_SCAN_FAILED)
  async onScanFailed(@Payload() payload: KeyPayload) {
    await this.filesService.onScanFailed(payload);
  }

  @EventPattern(FILE_SCAN_STARTED)
  async onScanStarted(@Payload() payload: KeyPayload) {
    await this.filesService.onScanStarted(payload);
  }

  @EventPattern(FILE_SCAN_INFECTED)
  async onInfected(@Payload() payload: KeyPayload) {
    await this.filesService.onInfected(payload);
  }

  @MessagePattern(FILE_GET_STATUS)
  async getFileStatus(@Payload() payload: GetFileStatusPayload) {
    const result = await this.filesService.getFileStatus(payload);
    return of(result);
  }

  @MessagePattern(FILE_CONFIRM_UPLOAD)
  async confirmUpload(@Payload() payload: FileUploadedPayload) {
    const result = await this.filesService.confirmUpload(payload);

    return of(result);
  }

  @EventPattern(FILE_SCAN_CLEAR)
  async onClearFile(@Payload() payload: KeyPayload) {
    await this.filesService.onClearFile(payload);
  }

  @EventPattern(FILE_SCAN_SKIPPED)
  async onScanSkipped(@Payload() payload: KeyPayload) {
    await this.filesService.onScanSkipped(payload);
  }
}

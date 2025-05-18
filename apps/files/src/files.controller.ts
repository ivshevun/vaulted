import { Controller } from '@nestjs/common';
import { FilesService } from './files.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { GetUploadDataPayload } from '@app/common';
import { of } from 'rxjs';

@Controller()
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @MessagePattern('get-upload-data')
  async getUploadData(@Payload() getUploadDataPayload: GetUploadDataPayload) {
    const url = await this.filesService.getUploadData(getUploadDataPayload);

    return of(url);
  }
}

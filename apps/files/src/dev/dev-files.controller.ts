import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { FILE_DEV_GET_FILE } from '@app/common/constants';
import { DevFilesService } from './dev-files.service';
import { KeyPayload } from '@app/common';

@Controller()
export class DevFilesController {
  constructor(private readonly devFilesService: DevFilesService) {}

  @MessagePattern(FILE_DEV_GET_FILE)
  getFile(@Payload() { key }: KeyPayload) {
    return this.devFilesService.findByKey(key);
  }
}

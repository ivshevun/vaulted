import { Module } from '@nestjs/common';
import { FilesRepository } from '../files.repository';
import { DevFilesController } from './dev-files.controller';
import { DevFilesService } from './dev-files.service';

@Module({
  providers: [FilesRepository, DevFilesService],
  controllers: [DevFilesController],
})
export class DevFilesModule {}

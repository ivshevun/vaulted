import { Injectable } from '@nestjs/common';
import { FilesRepository } from '../files.repository';

@Injectable()
export class DevFilesService {
  constructor(private readonly filesRepository: FilesRepository) {}

  findByKey(key: string) {
    return this.filesRepository.findFile({ key });
  }
}

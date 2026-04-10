import { FileStatus } from '@prisma/files-client';

export interface UpdateFileDto {
  status?: FileStatus;
  size?: number;
}

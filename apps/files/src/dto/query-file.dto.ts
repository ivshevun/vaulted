import { FileStatus } from '@prisma/files-client';

export interface QueryFileDto {
  key: string;
  userId: string;
  status?: FileStatus;
}

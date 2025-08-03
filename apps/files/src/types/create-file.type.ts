import { File } from '@prisma/files-client';

export type CreateFileType = Omit<File, 'id' | 'createdAt' | 'updatedAt'>;

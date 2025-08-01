import { File } from '@prisma/client';

export type CreateFileType = Omit<File, 'id' | 'createdAt' | 'updatedAt'>;

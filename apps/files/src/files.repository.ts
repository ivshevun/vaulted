import { Injectable } from '@nestjs/common';
import { File } from '@prisma/files-client';
import { PrismaService } from './prisma';
import { CreateFileDto, QueryFileDto, UpdateFileDto } from './dto';

@Injectable()
export class FilesRepository {
  constructor(private readonly prisma: PrismaService) {}

  createFile(dto: CreateFileDto): Promise<File> {
    return this.prisma.file.create({ data: dto });
  }

  deleteFile(key: string): Promise<File> {
    return this.prisma.file.delete({ where: { key } });
  }

  updateFile(key: string, dto: UpdateFileDto): Promise<File> {
    return this.prisma.file.update({
      where: { key },
      data: dto,
    });
  }

  findFile(dto: QueryFileDto): Promise<File | null> {
    return this.prisma.file.findFirst({ where: dto });
  }
}

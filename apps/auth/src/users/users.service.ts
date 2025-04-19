import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@app/common';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  create(createUserDto: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data: createUserDto });
  }
}

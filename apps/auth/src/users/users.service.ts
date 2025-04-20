import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@app/common';
import argon from 'argon2';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: Prisma.UserCreateInput) {
    const hashedPassword = await argon.hash(createUserDto.password);

    return this.prisma.user.create({
      data: { ...createUserDto, password: hashedPassword },
    });
  }
}

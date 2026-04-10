import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/auth-client';
import argon from 'argon2';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(createUserDto: Prisma.UserCreateInput): Promise<User> {
    const hashedPassword = await argon.hash(createUserDto.password);

    return this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }
}

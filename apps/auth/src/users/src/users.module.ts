import { Module } from '@nestjs/common';
import { UsersService } from '@apps/auth/src/users/src/users.service';
import { UsersRepository } from '@apps/auth/src/users/src/users.repository';

@Module({
  providers: [UsersRepository, UsersService],
  exports: [UsersService],
})
export class UsersModule {}

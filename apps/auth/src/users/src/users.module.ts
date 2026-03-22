import { Module } from '@nestjs/common';
import { UsersService } from '@apps/auth/src/users/src/users.service';

@Module({
  imports: [],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

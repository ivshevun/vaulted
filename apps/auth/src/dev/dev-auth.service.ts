import { Injectable } from '@nestjs/common';
import { UsersService } from '@apps/auth/src/users/src/users.service';

@Injectable()
export class DevAuthService {
  constructor(private readonly usersService: UsersService) {}

  findByEmail(email: string) {
    return this.usersService.findByEmail(email);
  }
}

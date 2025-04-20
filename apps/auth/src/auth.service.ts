import { Injectable } from '@nestjs/common';
import { UsersService } from './users';
import { RegisterDto } from './dto';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  register(registerDto: RegisterDto) {
    return this.usersService.create(registerDto);
  }
}

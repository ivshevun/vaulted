import { HttpStatus, Injectable } from '@nestjs/common';
import { UsersService } from './users';
import { LoginDto, RegisterDto } from '@app/common';
import { TokenService } from './token';
import argon from 'argon2';
import { RpcException } from '@nestjs/microservices';
import { convertToUserDto } from './utils';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
  ) {}

  async register(registerDto: RegisterDto) {
    const userInDb = await this.usersService.findByEmail(registerDto.email);

    if (userInDb) {
      throw new RpcException({
        message: 'User already exists',
        status: HttpStatus.CONFLICT,
      });
    }

    const createdUser = await this.usersService.create(registerDto);

    const userDto = convertToUserDto(createdUser);
    return this.tokenService.signTokens(userDto);
  }

  async login(loginDto: LoginDto) {
    const userInDB = await this.usersService.findByEmail(loginDto.email);

    if (!userInDB) {
      throw new RpcException({
        message: 'Invalid credentials',
        status: HttpStatus.UNAUTHORIZED,
      });
    }

    const isValidPassword = await argon.verify(
      userInDB.password,
      loginDto.password,
    );

    if (!isValidPassword) {
      throw new RpcException({
        message: 'Invalid credentials',
        status: HttpStatus.UNAUTHORIZED,
      });
    }

    const userDto = convertToUserDto(userInDB);
    return this.tokenService.signTokens(userDto);
  }

  async refresh(refreshToken: string | null) {
    if (!refreshToken) {
      throw new RpcException({
        message: 'Invalid refresh token',
        status: HttpStatus.UNAUTHORIZED,
      });
    }

    const userDto = await this.tokenService.verifyToken(refreshToken);

    return this.tokenService.signTokens(userDto);
  }
}

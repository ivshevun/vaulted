import { HttpStatus, Injectable } from '@nestjs/common';
import { UsersService } from './users';
import { LoginDto, RegisterDto } from '@app/common';
import { TokenService } from './token';
import argon from 'argon2';
import { RpcException } from '@nestjs/microservices';
import { convertToUserDto } from './utils';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
    @InjectPinoLogger() private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuthService.name);
  }

  async register(dto: RegisterDto) {
    const { email } = dto;

    this.logger.info({ email }, 'User registration started');

    const existing = await this.usersService.findByEmail(email);

    if (existing) {
      this.logger.warn({ email }, 'Registration failed: user exists');

      throw new RpcException({
        message: 'User already exists',
        status: HttpStatus.CONFLICT,
      });
    }

    const user = await this.usersService.create(dto);

    this.logger.info(
      {
        userId: user.id,
        email: user.email,
      },
      'User registered successfully',
    );

    const userDto = convertToUserDto(user);

    return this.tokenService.signTokens(userDto);
  }

  async login(dto: LoginDto) {
    const { email } = dto;

    this.logger.info({ email }, 'Login attempt');

    const user = await this.usersService.findByEmail(email);

    if (!user) {
      this.logger.warn({ email }, 'Login failed: user not found');

      throw new RpcException({
        message: 'Invalid credentials',
        status: HttpStatus.UNAUTHORIZED,
      });
    }

    const valid = await argon.verify(user.password, dto.password);

    if (!valid) {
      this.logger.warn(
        {
          userId: user.id,
          email,
        },
        'Login failed: invalid password',
      );

      throw new RpcException({
        message: 'Invalid credentials',
        status: HttpStatus.UNAUTHORIZED,
      });
    }

    this.logger.info(
      {
        userId: user.id,
        email,
      },
      'Login successful',
    );

    const userDto = convertToUserDto(user);

    return this.tokenService.signTokens(userDto);
  }

  async refresh(refreshToken: string | null) {
    this.logger.info('Token refresh attempt');

    if (!refreshToken) {
      this.logger.warn('Token refresh failed: missing token');

      throw new RpcException({
        message: 'Invalid refresh token',
        status: HttpStatus.UNAUTHORIZED,
      });
    }

    const userDto = await this.tokenService.verifyToken(refreshToken);

    this.logger.info(
      {
        userId: userDto.id,
        email: userDto.email,
      },
      'Token refreshed successfully',
    );

    return this.tokenService.signTokens(userDto);
  }
}

import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from './users';
import { LoginDto, RegisterDto } from './dto';
import { UserDto } from '@app/common';
import { TokenService } from './token';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import argon from 'argon2';

@Injectable()
export class AuthService {
  public readonly REFRESH_TOKEN_NAME: string;
  private readonly EXPIRE_DAY_REFRESH_TOKEN: number;

  constructor(
    readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
  ) {
    this.EXPIRE_DAY_REFRESH_TOKEN = configService.get<number>(
      'JWT_REFRESH_EXPIRATION_DAYS',
    )!;
    this.REFRESH_TOKEN_NAME = 'refreshToken';
  }

  async register(registerDto: RegisterDto) {
    const userInDb = await this.usersService.findByEmail(registerDto.email);

    if (userInDb) {
      throw new ConflictException('User already exists');
    }

    const createdUser = await this.usersService.create(registerDto);

    const userDto = new UserDto(createdUser);
    return this.tokenService.signTokens(userDto);
  }

  async login(loginDto: LoginDto) {
    const userInDB = await this.usersService.findByEmail(loginDto.email);

    if (!userInDB) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValidPassword = await argon.verify(
      userInDB.password,
      loginDto.password,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const userDto = new UserDto(userInDB);
    return this.tokenService.signTokens(userDto);
  }

  async refresh(refreshToken: string | null) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const userDto = await this.tokenService.verifyToken(refreshToken);

    return this.tokenService.signTokens(userDto);
  }

  addRefreshTokenToResponse(res: Response, refreshToken: string) {
    const expiresIn = new Date();

    expiresIn.setDate(expiresIn.getDate() + this.EXPIRE_DAY_REFRESH_TOKEN);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      expires: expiresIn,
      secure: true,
      sameSite: 'lax',
    });
  }
}

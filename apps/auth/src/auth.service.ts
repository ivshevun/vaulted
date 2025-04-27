import { ConflictException, Injectable } from '@nestjs/common';
import { UsersService } from './users';
import { RegisterDto } from './dto';
import { UserDto } from '@app/common';
import { TokenService } from './token';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly EXPIRE_DAY_REFRESH_TOKEN: number;

  constructor(
    readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
  ) {
    this.EXPIRE_DAY_REFRESH_TOKEN = configService.get<number>(
      'JWT_REFRESH_EXPIRATION_DAYS',
    )!;
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

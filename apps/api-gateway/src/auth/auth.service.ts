import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly EXPIRE_DAY_REFRESH_TOKEN: string;

  constructor(readonly configService: ConfigService) {
    this.EXPIRE_DAY_REFRESH_TOKEN = configService.get<string>(
      'JWT_REFRESH_EXPIRATION_DAYS',
    )!;
  }

  addRefreshTokenToResponse(res: Response, refreshToken: string) {
    const expiresIn = new Date();

    expiresIn.setDate(
      expiresIn.getDate() + parseInt(this.EXPIRE_DAY_REFRESH_TOKEN),
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      expires: expiresIn,
      secure: true,
      sameSite: 'lax',
    });
  }
}

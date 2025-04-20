import { Injectable } from '@nestjs/common';
import { UserDto } from '@app/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  signTokens(user: UserDto) {
    const jwtPayload: UserDto = {
      id: user.id,
      email: user.email,
    };
    const accessToken = this.signAccessToken(jwtPayload);
    const refreshToken = this.signRefreshToken(jwtPayload);

    return { accessToken, refreshToken };
  }

  private signAccessToken(payload: UserDto) {
    const expirationSeconds = this.configService.get<string>(
      'JWT_ACCESS_EXPIRATION_SECONDS',
    )!;

    return this.jwtService.sign(payload, {
      expiresIn: `${expirationSeconds}s`,
    });
  }

  private signRefreshToken(payload: UserDto) {
    const expirationDays = this.configService.get<string>(
      'JWT_REFRESH_EXPIRATION_DAYS',
    )!;

    return this.jwtService.sign(payload, {
      expiresIn: `${expirationDays}d`,
    });
  }
}

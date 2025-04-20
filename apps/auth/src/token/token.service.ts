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

  signAccessToken(payload: UserDto) {
    const expirationSeconds = this.configService.get<string>(
      'JWT_ACCESS_EXPIRATION_SECONDS',
    )!;
    return this.jwtService.sign(payload, {
      expiresIn: `${expirationSeconds}s`,
    });
  }

  signRefreshToken(payload: UserDto) {
    const expirationSeconds = this.configService.get<string>(
      'JWT_REFRESH_EXPIRATION_SECONDS',
    )!;
    return this.jwtService.sign(payload, {
      expiresIn: `${expirationSeconds}s`,
    });
  }
}

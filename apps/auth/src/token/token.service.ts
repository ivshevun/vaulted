import { HttpStatus, Injectable } from '@nestjs/common';
import { UserDto } from '@app/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';

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

  async verifyToken(token: string) {
    try {
      return await this.jwtService.verifyAsync<UserDto>(token, {
        secret: this.configService.get('JWT_SECRET'),
      });
    } catch {
      throw new RpcException({
        message: 'Invalid refresh token',
        status: HttpStatus.UNAUTHORIZED,
      });
    }
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

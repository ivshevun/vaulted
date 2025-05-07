import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { UsersService } from '../users';
import { ConfigService } from '@nestjs/config';
import { UserDto } from '@app/common';
import { Injectable } from '@nestjs/common';
import { extractJwtFromBearer } from '../utils';
import { JwtRequest } from '../interfaces';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly usersService: UsersService,
    readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: JwtRequest) => {
          return extractJwtFromBearer(request?.Authorization);
        },
      ]),
      secretOrKey: configService.get<string>('JWT_SECRET')!,
      ignoreExpiration: true,
    });
  }

  async validate({ email }: UserDto) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return null;
    }

    return new UserDto(user);
  }
}

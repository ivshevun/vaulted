import { Controller, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { of } from 'rxjs';
import {
  AuthorizePayload,
  LoginPayload,
  RefreshPayload,
  RegisterPayload,
} from '@app/common';
import { JwtGuard } from './guards';
import {
  AUTHORIZE,
  LOGIN,
  PING,
  REFRESH,
  REGISTER,
} from '@app/common/constants';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern(PING)
  ping() {
    return of('pong');
  }

  @MessagePattern(REGISTER)
  async register(@Payload() registerPayload: RegisterPayload) {
    const tokens = await this.authService.register(registerPayload);

    return of(tokens);
  }

  @MessagePattern(LOGIN)
  async login(@Payload() loginPayload: LoginPayload) {
    const tokens = await this.authService.login(loginPayload);

    return of(tokens);
  }

  @MessagePattern(REFRESH)
  async refresh(@Payload() { refreshToken }: RefreshPayload) {
    return await this.authService.refresh(refreshToken);
  }

  @UseGuards(JwtGuard)
  @MessagePattern(AUTHORIZE)
  authorize(@Payload() payload: AuthorizePayload) {
    return payload.user;
  }
}

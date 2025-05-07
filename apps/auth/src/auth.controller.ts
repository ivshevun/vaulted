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

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern('ping')
  ping() {
    return of('pong');
  }

  @MessagePattern('register')
  async register(@Payload() registerPayload: RegisterPayload) {
    const tokens = await this.authService.register(registerPayload);

    return of(tokens);
  }

  @MessagePattern('login')
  async login(@Payload() loginPayload: LoginPayload) {
    const tokens = await this.authService.login(loginPayload);

    return of(tokens);
  }

  @MessagePattern('refresh')
  async refresh(@Payload() { refreshToken }: RefreshPayload) {
    return await this.authService.refresh(refreshToken);
  }

  @UseGuards(JwtGuard)
  @MessagePattern('authorize')
  authorize(@Payload() payload: AuthorizePayload) {
    return payload.user;
  }
}

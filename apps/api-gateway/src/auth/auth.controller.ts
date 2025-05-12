import {
  Body,
  Controller,
  HttpCode,
  Inject,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { LoginDto, RegisterDto, RequestWithCookies } from '@app/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { Tokens } from '@app/common/interfaces';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject('auth')
    private readonly authClient: ClientProxy,
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken }: Tokens = await firstValueFrom(
      this.authClient.send('register', registerDto),
    );

    this.authService.addRefreshTokenToResponse(res, refreshToken);

    return { accessToken };
  }

  @HttpCode(200)
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken }: Tokens = await firstValueFrom(
      this.authClient.send('login', loginDto),
    );

    this.authService.addRefreshTokenToResponse(res, refreshToken);

    return { accessToken };
  }

  @HttpCode(200)
  @Post('refresh')
  async refresh(
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshTokenFromCookie = req.cookies.refreshToken;

    const { accessToken, refreshToken }: Tokens = await firstValueFrom(
      this.authClient.send('refresh', {
        refreshToken: refreshTokenFromCookie,
      }),
    );

    this.authService.addRefreshTokenToResponse(res, refreshToken);

    return { accessToken };
  }
}

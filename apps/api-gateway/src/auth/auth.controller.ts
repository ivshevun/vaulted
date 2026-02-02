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
import { catchError, firstValueFrom, timeout } from 'rxjs';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { Tokens } from '@app/common/interfaces';
import { LoginDocs, LogoutDocs, RefreshDocs, RegisterDocs } from './docs';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject('auth')
    private readonly authClient: ClientProxy,
    private readonly authService: AuthService,
    @InjectPinoLogger() private readonly logger: PinoLogger,
  ) {}

  @RegisterDocs()
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken }: Tokens = await firstValueFrom(
      this.authClient.send('register', registerDto).pipe(
        timeout(5000),
        catchError((err: unknown) => {
          this.logger.error(
            {
              err,
              layer: 'gateway',
              target: 'auth',
              action: 'register',
            },
            'Auth service request failed',
          );

          throw err;
        }),
      ),
    );

    this.authService.addRefreshTokenToResponse(res, refreshToken);

    return { accessToken };
  }

  @LoginDocs()
  @HttpCode(200)
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken }: Tokens = await firstValueFrom(
      this.authClient.send('login', loginDto).pipe(
        timeout(5000),
        catchError((err: unknown) => {
          this.logger.error(
            {
              err,
              layer: 'gateway',
              target: 'auth',
              action: 'login',
            },
            'Auth service request failed',
          );

          throw err;
        }),
      ),
    );

    this.authService.addRefreshTokenToResponse(res, refreshToken);

    return { accessToken };
  }

  @RefreshDocs()
  @HttpCode(200)
  @Post('refresh')
  async refresh(
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshTokenFromCookie = req.cookies.refreshToken;

    const { accessToken, refreshToken }: Tokens = await firstValueFrom(
      this.authClient
        .send('refresh', {
          refreshToken: refreshTokenFromCookie,
        })
        .pipe(
          timeout(5000),
          catchError((err: unknown) => {
            this.logger.error(
              {
                err,
                layer: 'gateway',
                target: 'auth',
                action: 'refresh',
              },
              'Auth service request failed',
            );

            throw err;
          }),
        ),
    );

    this.authService.addRefreshTokenToResponse(res, refreshToken);

    return { accessToken };
  }

  @LogoutDocs()
  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    this.authService.removeRefreshTokenFromResponse(res);

    return 'Logged out';
  }
}

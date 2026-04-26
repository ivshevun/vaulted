import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { AUTH_DEV_GET_USER } from '@app/common/constants';

@Controller('dev/auth')
export class DevAuthController {
  constructor(@Inject('auth') private readonly authClient: ClientProxy) {}

  @Get('users')
  async getUser(@Query('email') email: string) {
    if (!email) throw new BadRequestException();

    const user = await firstValueFrom(
      this.authClient
        .send<Record<string, string> | null>(AUTH_DEV_GET_USER, { email })
        .pipe(timeout(5000)),
    );

    if (!user) throw new NotFoundException();
    return user;
  }
}

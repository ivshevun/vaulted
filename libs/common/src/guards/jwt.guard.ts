import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { UserDto } from '../dto/auth';
import { Request } from 'express';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(@Inject('auth') private readonly authClient: ClientProxy) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const req: Request = context.switchToHttp().getRequest();
    const jwt = req.headers.authorization;

    if (!jwt) {
      return false;
    }

    return this.authClient
      .send<UserDto>('authorize', {
        Authorization: jwt,
      })
      .pipe(
        tap((res) => {
          req.user = res;
        }),
        map(() => true),
        catchError(() => of(false)),
      );
  }
}

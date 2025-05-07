import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';
import { isHttpError } from '../type-guards';

@Injectable()
export class HttpRpcExceptionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((err) => {
        if (isHttpError(err)) {
          return throwError(() => new HttpException(err.message, err.status));
        }

        return throwError(() => err as Error);
      }),
    );
  }
}

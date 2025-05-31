import { Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';

@Catch()
export class MicroserviceExceptionFilter implements ExceptionFilter {
  catch(exception: Error) {
    throwError(
      () =>
        new RpcException({
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: exception.message,
        }),
    );
  }
}

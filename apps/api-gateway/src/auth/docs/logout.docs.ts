import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function LogoutDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Logs out user',
      description: 'Log user out by removing a refresh token from headers.',
    }),
    ApiResponse({
      status: 200,
      description: 'User logged out',
    }),
  );
}

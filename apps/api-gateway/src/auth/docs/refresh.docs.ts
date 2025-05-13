import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';

export const RefreshDocs = () => {
  return applyDecorators(
    ApiOperation({
      summary: 'Refresh access token',
      description: 'This API route expects a refresh token',
    }),
    ApiResponse({
      status: 200,
      description: 'User refreshed access token successfully',
      content: {
        'application/json': {
          example: {
            accessToken:
              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQzNTgzYWVlLTc0ZGQtNDYxZi05NTgxLTZjNWUzODgxMjExYiIsImVtYWlsIjoiam9obi5zbWl0aEBnbWFpbC5jb20iLCJpYXQiOjE3NDcxMjIwMDQsImV4cCI6MTc0NzEyMjkwNH0.KFkuT5C4N9j3Fr4QtguRjvudMRdGiOfE5paJa-dfsWQ',
          },
        },
        'Set-Cookie': {
          example:
            'refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQzNTgzYWVlLTc0ZGQtNDYxZi05NTgxLTZjNWUzODgxMjExYiIsImVtYWlsIjoiam9obi5zbWl0aEBnbWFpbC5jb20iLCJpYXQiOjE3NDcxMjMyMzcsImV4cCI6MTc0NzcyODAzN30.J511v_mgONqF71KL8dcE2i8IxeT1yfuqaCgqznW5NAQ; Path=/; Expires=Tue, 20 May 2025 08:00:37 GMT; HttpOnly; Secure; SameSite=Lax',
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Invalid refresh token',
      content: {
        'application/json': {
          example: {
            statusCode: 401,
            message: 'Invalid refresh token',
          },
        },
      },
    }),
  );
};

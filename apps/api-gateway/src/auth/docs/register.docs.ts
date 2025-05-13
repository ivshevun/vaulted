import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function RegisterDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Register user' }),
    ApiResponse({
      status: 201,
      description: 'User created successfully',
      content: {
        'application/json': {
          example: {
            accessToken:
              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQzNTgzYWVlLTc0ZGQtNDYxZi05NTgxLTZjNWUzODgxMjExYiIsImVtYWlsIjoiam9obi5zbWl0aEBnbWFpbC5jb20iLCJpYXQiOjE3NDcxMjIwMDQsImV4cCI6MTc0NzEyMjkwNH0.KFkuT5C4N9j3Fr4QtguRjvudMRdGiOfE5paJa-dfsWQ',
          },
        },
        'Set-Cookie': {
          example:
            'refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQwZjVjMWFkLTBhMmMtNGQyMy05NDhkLTk3MmVjMTIwMDg4ZCIsImVtYWlsIjoiam9obi5zbWl0aEBnbWFpbC5jb20iLCJpYXQiOjE3NDcxMjM4NTIsImV4cCI6MTc0NzcyODY1Mn0.pesQtZ6Ccq6IzRSDnXIzxBe9rE44_zlpJtGawKZX5-M; Path=/; Expires=Tue, 20 May 2025 08:10:52 GMT; HttpOnly; Secure; SameSite=Lax',
        },
      },
    }),
    ApiResponse({
      status: 409,
      description: 'User already exists',
      content: {
        'application/json': {
          example: {
            statusCode: 409,
            message: 'User already exists',
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request',
      content: {
        'application/json': {
          example: {
            statusCode: 400,
            message: 'Bad Request Exception',
          },
        },
      },
    }),
  );
}

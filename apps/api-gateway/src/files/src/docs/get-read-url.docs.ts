import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';

export function GetReadUrlDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Get pre-signed S3 file url ' }),
    ApiOkResponse({
      description: 'Get pre-signed file url',
      content: {
        'application/json': {
          example: {
            url: 'https://mock-s3-url.com',
          },
        },
      },
    }),
    ApiForbiddenResponse({
      description: 'Missing/invalid JWT',
      content: {
        'application/json': {
          example: {
            message: 'Forbidden resource',
            error: 'Forbidden',
            statusCode: 403,
          },
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Invalid or missing query parameters',
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

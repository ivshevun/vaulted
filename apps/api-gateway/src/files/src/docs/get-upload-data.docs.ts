import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';

export function GetUploadDataDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Get Upload Url' }),
    ApiOkResponse({
      description: 'Get S3 pre-signed URL with a file key',
      content: {
        'application/json': {
          example: {
            url: 'https://upload-url',
          },
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Invalid query params',
      content: {
        'application/json': {
          example: {
            statusCode: 400,
            message: 'Bad Request Exception',
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
  );
}

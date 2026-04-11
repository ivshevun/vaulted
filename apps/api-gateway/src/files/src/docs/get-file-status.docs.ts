import { applyDecorators } from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';

export function GetFileStatusDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Get file scan status' }),
    ApiOkResponse({
      description: 'Current scan status of the file',
      content: {
        'application/json': {
          example: {
            status: 'SCANNING',
          },
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'File not found or does not belong to user',
      content: {
        'application/json': {
          example: {
            statusCode: 404,
            message: 'File not found',
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

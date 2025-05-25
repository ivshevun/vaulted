import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOperation,
} from '@nestjs/swagger';

export function ConfirmUploadDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Confirm file upload' }),
    ApiCreatedResponse({
      description: 'Get created file data',
      content: {
        'application/json': {
          example: {
            example: {
              id: '423f378a-dafe-4810-b96b-c742cd732de5',
              key: 'ee3030fe-503b-474c-aa3e-3837aeb6e0ed/avatar.png-8bac9ec1-992e-4512-b266-bd4f5ee07620',
              filename: 'avatar.png',
              contentType: 'image/png',
              size: 123,
              userId: '616c12bf-a964-4624-9276-d195bae1f284',
              createdAt: '2025-05-24T16:45:19.153Z',
              updatedAt: '2025-05-24T16:45:19.153Z',
            },
          },
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Invalid body',
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

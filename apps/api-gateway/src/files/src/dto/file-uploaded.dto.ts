import { ApiProperty } from '@nestjs/swagger';
import { FileUploadedDto as BaseFileUploadedDto } from '@app/common';

export class FileUploadedDto extends BaseFileUploadedDto {
  @ApiProperty({
    description: 'Backend generated key',
    example:
      'ee3030fe-503b-474c-aa3e-3837aeb6e0ed/8bac9ec1-992e-4512-b266-bd4f5ee07620',
  })
  declare key: string;
}

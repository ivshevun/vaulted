import { ApiProperty } from '@nestjs/swagger';
import { GetUploadDataDto as BaseGetUploadDataDto } from '@app/common';

export class GetUploadDataDto extends BaseGetUploadDataDto {
  @ApiProperty()
  declare filename: string;

  @ApiProperty()
  declare contentType: string;

  @ApiProperty()
  declare fileSize: number;
}

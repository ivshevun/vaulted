import { ApiProperty } from '@nestjs/swagger';
import {
  IsMimeType,
  IsNotEmpty,
  IsString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MAX_FILE_SIZE_BYTES } from '@app/common/constants';

export class GetUploadDataDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  filename: string;

  @ApiProperty()
  @IsMimeType()
  contentType: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_FILE_SIZE_BYTES)
  fileSize: number;
}

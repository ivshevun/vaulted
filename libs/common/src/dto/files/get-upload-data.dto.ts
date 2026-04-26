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
  @IsString()
  @IsNotEmpty()
  filename: string;

  @IsMimeType()
  contentType: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_FILE_SIZE_BYTES)
  fileSize: number;
}

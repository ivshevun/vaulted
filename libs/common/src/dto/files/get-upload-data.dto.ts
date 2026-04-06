import { ApiProperty } from '@nestjs/swagger';
import { IsMimeType, IsNotEmpty, IsString } from 'class-validator';

export class GetUploadDataDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  filename: string;

  @ApiProperty()
  @IsMimeType()
  contentType: string;
}

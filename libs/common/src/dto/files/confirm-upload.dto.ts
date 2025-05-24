import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmUploadDto {
  @ApiProperty({
    description: 'Backend generated key',
    example:
      'ee3030fe-503b-474c-aa3e-3837aeb6e0ed/avatar.png-8bac9ec1-992e-4512-b266-bd4f5ee07620',
  })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ description: 'Original file name', example: 'avatar.png' })
  @IsString()
  @IsNotEmpty()
  filename: string;

  @ApiProperty({ description: 'File content type', example: 'image/png' })
  @IsString()
  @IsNotEmpty()
  contentType: string;

  @ApiProperty({
    description: 'File content length in bytes',
    example: 1_572_864,
  })
  @IsNumber()
  size: number;
}

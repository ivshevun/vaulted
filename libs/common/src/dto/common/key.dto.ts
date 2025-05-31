import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class KeyDto {
  @ApiProperty({
    description: 'Backend generated file-key',
    example:
      'ee3030fe-503b-474c-aa3e-3837aeb6e0ed/avatar.png-8bac9ec1-992e-4512-b266-bd4f5ee07620',
  })
  @IsString()
  @IsNotEmpty()
  key: string;
}

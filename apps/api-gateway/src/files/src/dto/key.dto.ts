import { ApiProperty } from '@nestjs/swagger';
import { KeyDto as BaseKeyDto } from '@app/common';

export class KeyDto extends BaseKeyDto {
  @ApiProperty({
    description: 'Backend generated file-key',
    example:
      'ee3030fe-503b-474c-aa3e-3837aeb6e0ed/avatar.png-8bac9ec1-992e-4512-b266-bd4f5ee07620',
  })
  declare key: string;
}

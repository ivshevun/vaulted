import { ApiProperty } from '@nestjs/swagger';
import { RegisterDto as BaseRegisterDto } from '@app/common';

export class RegisterDto extends BaseRegisterDto {
  @ApiProperty({ description: 'name', example: 'John Smith' })
  declare name: string;

  @ApiProperty({ description: 'email', example: 'john.smith@gmail.com' })
  declare email: string;

  @ApiProperty({ description: 'password', example: 'password' })
  declare password: string;
}

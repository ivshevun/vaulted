import { ApiProperty } from '@nestjs/swagger';
import { LoginDto as BaseLoginDto } from '@app/common';

export class LoginDto extends BaseLoginDto {
  @ApiProperty({ description: 'email', example: 'john.smith@gmail.com' })
  declare email: string;

  @ApiProperty({ description: 'password', example: 'password' })
  declare password: string;
}

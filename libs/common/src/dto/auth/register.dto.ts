import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ description: 'name', example: 'John Smith' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'email', example: 'john.smith@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'password', example: 'password' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

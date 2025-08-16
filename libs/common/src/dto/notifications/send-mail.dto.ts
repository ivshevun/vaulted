import { IsNotEmpty, IsString } from 'class-validator';
import { EmailType } from '@app/common';

export class SendMailDto {
  @IsNotEmpty()
  @IsString()
  to: string;

  @IsNotEmpty()
  @IsString()
  emailType: EmailType;
}

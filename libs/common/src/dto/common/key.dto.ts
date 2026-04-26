import { IsNotEmpty, IsString } from 'class-validator';

export class KeyDto {
  @IsString()
  @IsNotEmpty()
  key: string;
}

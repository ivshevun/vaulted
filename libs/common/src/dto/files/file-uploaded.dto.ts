import { IsNotEmpty, IsString } from 'class-validator';

export class FileUploadedDto {
  @IsString()
  @IsNotEmpty()
  key: string;
}

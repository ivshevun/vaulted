import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ConfirmUploadDto,
  ConfirmUploadPayload,
  GetUploadDataDto,
  GetUploadDataPayload,
  JwtGuard,
  UserDto,
} from '@app/common';
import { CurrentUser } from '../decorators';
import { firstValueFrom } from 'rxjs';
import { ConfirmUploadDocs, GetUploadDataDocs } from './docs';

@UseGuards(JwtGuard)
@Controller('files')
export class FilesController {
  constructor(@Inject('files') private readonly filesClient: ClientProxy) {}

  @GetUploadDataDocs()
  @Get('upload-data')
  async getUploadData(
    @Query() dto: GetUploadDataDto,
    @CurrentUser() user: UserDto,
  ) {
    const payload: GetUploadDataPayload = {
      ...dto,
      userId: user.id,
    };
    return await firstValueFrom(
      this.filesClient.send<string>('get-upload-data', payload),
    );
  }

  @ConfirmUploadDocs()
  @Post('confirm-upload')
  async confirmUpload(
    @Body() dto: ConfirmUploadDto,
    @CurrentUser() user: UserDto,
  ) {
    const payload: ConfirmUploadPayload = {
      ...dto,
      userId: user.id,
    };

    return await firstValueFrom(
      this.filesClient.send<string>('confirm-upload', payload),
    );
  }
}

import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  GetUploadDataDto,
  GetUploadDataPayload,
  JwtGuard,
  UserDto,
} from '@app/common';
import { CurrentUser } from '../decorators';
import { firstValueFrom } from 'rxjs';
import { GetUploadDataDocs } from './docs';

@Controller('files')
export class FilesController {
  constructor(@Inject('files') private readonly filesClient: ClientProxy) {}

  @GetUploadDataDocs()
  @UseGuards(JwtGuard)
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
}

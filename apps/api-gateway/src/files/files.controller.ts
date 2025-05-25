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
  GetReadUrlDto,
  GetUploadDataDto,
  GetUploadDataPayload,
  JwtGuard,
  UserDto,
} from '@app/common';
import { CurrentUser } from '../decorators';
import { firstValueFrom } from 'rxjs';
import { ConfirmUploadDocs, GetReadUrlDocs, GetUploadDataDocs } from './docs';
import { File } from '@prisma/client';

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
      this.filesClient.send<{ url: string; key: string }>(
        'get-upload-data',
        payload,
      ),
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
      this.filesClient.send<File>('confirm-upload', payload),
    );
  }

  @GetReadUrlDocs()
  @Get('read-url')
  async getReadUrl(@Query() dto: GetReadUrlDto) {
    const url = await firstValueFrom(
      this.filesClient.send<string>('get-read-url', dto),
    );

    return { url };
  }
}

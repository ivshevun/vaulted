import {
  ConfirmUploadDto,
  ConfirmUploadPayload,
  GetUploadDataDto,
  GetUploadDataPayload,
  JwtGuard,
  KeyDto,
  UserDto,
} from '@app/common';
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
import { firstValueFrom } from 'rxjs';
import { CurrentUser } from '../decorators';
import { ConfirmUploadDocs, GetReadUrlDocs, GetUploadDataDocs } from './docs';

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
    try {
      return await firstValueFrom(
        this.filesClient.send<{ url: string; key: string }>(
          'get-upload-data',
          payload,
        ),
      );
    } catch (error) {
      console.log('error in upload-data', error);
    }
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

    try {
      return await firstValueFrom(
        this.filesClient.send<boolean>('confirm-upload', payload),
      );
    } catch (error) {
      console.log('error in confirmUpload', error);
    }
  }

  @GetReadUrlDocs()
  @Get('read-url')
  async getReadUrl(@Query() dto: KeyDto) {
    const url = await firstValueFrom(
      this.filesClient.send<string>('get-read-url', dto),
    );

    return { url };
  }
}

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
import { catchError, firstValueFrom, timeout } from 'rxjs';
import { CurrentUser } from '../decorators';
import { ConfirmUploadDocs, GetReadUrlDocs, GetUploadDataDocs } from './docs';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@UseGuards(JwtGuard)
@Controller('files')
export class FilesController {
  constructor(
    @Inject('files') private readonly filesClient: ClientProxy,
    @InjectPinoLogger() private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(FilesController.name);
  }

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
      this.filesClient
        .send<{ url: string; key: string }>('get-upload-data', payload)
        .pipe(
          timeout(5000),
          catchError((err: unknown) => {
            this.logger.error(
              {
                err,
                layer: 'gateway',
                target: 'files',
                action: 'get-upload-data',
                userId: user.id,
              },
              'Files service request failed',
            );

            throw err;
          }),
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
      this.filesClient.send<boolean>('confirm-upload', payload).pipe(
        timeout(5000),
        catchError((err: unknown) => {
          this.logger.error(
            {
              err,
              layer: 'gateway',
              target: 'files',
              action: 'confirm-upload',
              userId: user.id,
            },
            'Files service request failed',
          );

          throw err;
        }),
      ),
    );
  }

  @GetReadUrlDocs()
  @Get('read-url')
  async getReadUrl(@Query() dto: KeyDto, @CurrentUser() user: UserDto) {
    const url = await firstValueFrom(
      this.filesClient.send<string>('get-read-url', dto).pipe(
        timeout(5000),
        catchError((err: unknown) => {
          this.logger.error(
            {
              err,
              layer: 'gateway',
              target: 'files',
              action: 'get-read-url',
              userId: user.id,
              key: dto.key,
            },
            'Files service request failed',
          );

          throw err;
        }),
      ),
    );

    return { url };
  }
}

import {
  FileUploadedDto,
  FileUploadedPayload,
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
import { CurrentUser } from '../../decorators';
import { ConfirmUploadDocs, GetReadUrlDocs, GetUploadDataDocs } from './docs';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { RMQ_EXCHANGE } from '@app/common/constants';

@UseGuards(JwtGuard)
@Controller('files')
export class FilesController {
  constructor(
    @Inject('files') private readonly filesClient: ClientProxy,
    @Inject(RMQ_EXCHANGE) private readonly eventBus: ClientProxy,
    @InjectPinoLogger()
    private readonly logger: PinoLogger,
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
      this.eventBus
        .send<{ url: string; key: string }>('file.get-upload-data', payload)
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
  confirmUpload(@Body() dto: FileUploadedDto, @CurrentUser() user: UserDto) {
    const payload: FileUploadedPayload = {
      key: dto.key,
      userId: user.id,
    };

    this.eventBus.emit('file.uploaded', payload);

    return { key: dto.key };
  }

  @GetReadUrlDocs()
  @Get('read-url')
  async getReadUrl(@Query() dto: KeyDto, @CurrentUser() user: UserDto) {
    const url = await firstValueFrom(
      this.eventBus.send<string>('file.get-read-url', dto).pipe(
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

import { Inject, Injectable } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { KeyPayload } from '@app/common';
import { ClientProxy } from '@nestjs/microservices';
import Nodeclam from 'clamscan';
import { Readable } from 'stream';
import { type StreamingBlobPayloadOutputTypes } from '@smithy/types';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AntivirusService {
  private readonly s3: S3Client;
  private readonly bucketName: string;

  constructor(
    @Inject('files') private readonly filesClient: ClientProxy,
    private readonly configService: ConfigService,
  ) {
    this.s3 = new S3Client({
      region: configService.get<string>('AWS_REGION')!,
      credentials: {
        accessKeyId: configService.get<string>('AWS_ACCESS_ID')!,
        secretAccessKey: configService.get<string>('AWS_SECRET_ACCESS_KEY')!,
      },
    });

    this.bucketName = configService.get<string>('AWS_S3_BUCKET_NAME')!;
  }

  async scan({ key }: KeyPayload) {
    const fileStreamBlob = await firstValueFrom(
      this.filesClient.send<StreamingBlobPayloadOutputTypes>(
        'get-file-stream',
        { key },
      ),
    );

    const fileStream = fileStreamBlob as Readable;

    const clamScan = await new Nodeclam().init({
      removeInfected: true,
      clamdscan: {
        host: 'clamav',
        port: 3310,
        timeout: 60000,
      },
    });

    const { isInfected } = await clamScan.scanStream(fileStream);

    return { isInfected };
  }
}

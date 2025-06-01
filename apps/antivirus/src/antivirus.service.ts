import { Inject, Injectable } from '@nestjs/common';
import { KeyPayload } from '@app/common';
import { ClientProxy } from '@nestjs/microservices';
import Nodeclam from 'clamscan';
import { Readable } from 'stream';
import { type StreamingBlobPayloadOutputTypes } from '@smithy/types';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AntivirusService {
  constructor(@Inject('files') private readonly filesClient: ClientProxy) {}

  async scan({ key }: KeyPayload) {
    const fileStream = await this.getFileStream(key);

    const clamScan = await this.initClamScan();

    const { isInfected } = await clamScan.scanStream(fileStream);

    if (isInfected) {
      this.filesClient.emit('on-infected', { key });
    }
  }

  private async getFileStream(key: string) {
    const fileStreamBlob = await firstValueFrom(
      this.filesClient.send<StreamingBlobPayloadOutputTypes>(
        'get-file-stream',
        { key },
      ),
    );

    return fileStreamBlob as Readable;
  }

  private async initClamScan() {
    return await new Nodeclam().init({
      removeInfected: true,
      clamdscan: {
        host: 'clamav',
        port: 3310,
        timeout: 60000,
      },
    });
  }
}

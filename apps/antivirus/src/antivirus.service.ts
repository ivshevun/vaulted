import { KeyPayload } from '@app/common';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import Nodeclam from 'clamscan';
import { Readable } from 'stream';
import { getFileStream } from './utils';

@Injectable()
export class AntivirusService {
  constructor(
    @Inject('files') private readonly filesClient: ClientProxy,
    private readonly configService: ConfigService,
  ) {}

  async scan({ key }: KeyPayload) {
    const fileStream = await this.getFileStream(key);

    const clamScan = await this.initClamScan();

    const { isInfected } = await clamScan.scanStream(fileStream);

    if (isInfected) {
      this.filesClient.emit('on-infected', { key });
    }
  }

  private async getFileStream(key: string) {
    const fileStream = await getFileStream(this.configService, key);

    return fileStream as Readable;
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

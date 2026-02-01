import { createS3Client, KeyPayload } from '@app/common';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import Nodeclam from 'clamscan';
import { Readable } from 'stream';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class AntivirusService {
  constructor(
    @Inject('files') private readonly filesClient: ClientProxy,
    private readonly configService: ConfigService,
    @InjectPinoLogger() private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AntivirusService.name);
  }

  async scan({ key }: KeyPayload): Promise<boolean> {
    this.logger.info({ key }, 'Starting virus scan');

    try {
      const fileStream = await this.getFileStream(key);

      const clamScan = await this.initClamScan();

      const { isInfected } = await clamScan.scanStream(fileStream);

      this.logger.info({ key, isInfected }, 'Virus scan finished');

      return isInfected;
    } catch (err: unknown) {
      this.logger.error({ key, err }, 'Virus scan failed');

      throw err;
    }
  }

  private async getFileStream(key: string): Promise<Readable> {
    const bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');

    const s3 = createS3Client(this.configService);

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    try {
      const fileObject = await s3.send(command);

      if (!fileObject.Body) {
        this.logger.warn({ key, bucket: bucketName }, 'S3 object has no body');

        throw new NotFoundException(`File not found: ${key}`);
      }

      return fileObject.Body as Readable;
    } catch (err: unknown) {
      this.logger.error(
        {
          key,
          bucket: bucketName,
          err,
        },
        'Failed to fetch file from S3',
      );

      throw err;
    }
  }

  private async initClamScan() {
    try {
      return await new Nodeclam().init({
        removeInfected: true,
        clamdscan: {
          host: 'clamav',
          port: 3310,
          timeout: 60000,
        },
      });
    } catch (err: unknown) {
      this.logger.error({ err }, 'Failed to initialize ClamAV');

      throw err;
    }
  }
}

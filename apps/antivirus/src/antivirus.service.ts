import { createS3Client, FileUploadedPayload } from '@app/common';
import { ANTIVIRUS_MAX_RETRIES } from './antivirus.constants';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Nodeclam from 'clamscan';
import { Readable } from 'stream';
import { GetObjectCommand, NoSuchKey } from '@aws-sdk/client-s3';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import {
  FILE_SCAN_CLEAR,
  FILE_SCAN_FAILED,
  FILE_SCAN_INFECTED,
  FILE_SCAN_STARTED,
  RMQ_EXCHANGE,
} from '@app/common/constants';
import { ClientProxy } from '@nestjs/microservices';
import { S3FileNotFoundError } from './antivirus.errors';

@Injectable()
export class AntivirusService {
  constructor(
    private readonly configService: ConfigService,
    @Inject(RMQ_EXCHANGE) private readonly eventBus: ClientProxy,
    @InjectPinoLogger() private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AntivirusService.name);
  }

  async scan({ key }: FileUploadedPayload, retryCount = 0): Promise<void> {
    if (retryCount >= ANTIVIRUS_MAX_RETRIES) {
      this.logger.warn(
        { key, retryCount },
        'Max retries exhausted, marking scan as failed',
      );
      this.eventBus.emit(FILE_SCAN_FAILED, { key });
      return;
    }

    this.logger.info({ key }, 'Starting virus scan');

    try {
      const fileStream = await this.getFileStream(key);
      this.eventBus.emit(FILE_SCAN_STARTED, { key });

      const clamScan = await this.initClamScan();

      const { isInfected } = await clamScan.scanStream(fileStream);

      this.logger.info({ key, isInfected }, 'Virus scan finished');

      if (isInfected) {
        this.eventBus.emit(FILE_SCAN_INFECTED, { key });
        return;
      }

      this.eventBus.emit(FILE_SCAN_CLEAR, { key });
    } catch (err: unknown) {
      if (err instanceof S3FileNotFoundError) {
        this.logger.warn(
          { key },
          'File not found in S3, marking scan as failed',
        );
        this.eventBus.emit(FILE_SCAN_FAILED, { key });
        return;
      }

      this.logger.error({ key, err }, 'Virus scan failed');
      throw err;
    }
  }

  private async getFileStream(key: string): Promise<Readable> {
    const bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');
    const s3 = createS3Client(this.configService);
    const command = new GetObjectCommand({ Bucket: bucketName, Key: key });

    try {
      const fileObject = await s3.send(command);

      if (!fileObject.Body) {
        throw new S3FileNotFoundError(`S3 object has no body: ${key}`);
      }

      return fileObject.Body as Readable;
    } catch (err: unknown) {
      if (err instanceof NoSuchKey) {
        throw new S3FileNotFoundError(`File not found in S3: ${key}`);
      }

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

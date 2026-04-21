import {
  createS3Client,
  FileUploadedPayload,
  GetFileStatusPayload,
  GetUploadDataPayload,
  KeyDto,
  KeyPayload,
} from '@app/common';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  NotFound,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { v4 as uuid } from 'uuid';
import { generateSlug } from './utils';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { FILE_UPLOADED, RMQ_EXCHANGE } from '@app/common/constants';
import { FileStatus } from '@prisma/files-client';
import { FilesRepository } from './files.repository';

@Injectable()
export class FilesService {
  private readonly s3: S3Client;
  private readonly s3Presigner: S3Client;
  private readonly bucketName: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly filesRepository: FilesRepository,
    @Inject(RMQ_EXCHANGE) private readonly eventBus: ClientProxy,
    @InjectPinoLogger() private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(FilesService.name);
    this.s3 = createS3Client(configService);
    this.s3Presigner = createS3Client(configService, 'AWS_S3_PUBLIC_ENDPOINT');
    this.bucketName = configService.get<string>('AWS_S3_BUCKET_NAME')!;
  }

  async getUploadData({
    filename,
    contentType,
    userId,
    fileSize,
  }: GetUploadDataPayload) {
    this.logger.info(
      { userId, filename, contentType },
      'Generating upload URL',
    );

    const key = uuid();
    const slug = generateSlug(filename);

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
        ContentLength: fileSize,
      });

      const url = await getSignedUrl(this.s3Presigner, command, {
        expiresIn: 60 * 5,
      });

      await this.filesRepository.createFile({
        key,
        slug,
        filename,
        contentType,
        userId,
        size: fileSize,
      });

      this.logger.info({ key, userId }, 'Upload URL generated');

      return { url, key };
    } catch (err: unknown) {
      this.logger.error(
        { err, userId, filename },
        'Failed to generate upload URL',
      );

      throw err;
    }
  }

  async getReadUrl({ key, userId }: KeyDto & { userId?: string }) {
    this.logger.info({ key, userId }, 'Generating download URL');

    try {
      await this.isObjectExistsOrThrow({ key });

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Presigner, command, {
        expiresIn: 60 * 5,
      });

      this.logger.info({ key, userId }, 'Download URL generated');

      return url;
    } catch (err: unknown) {
      this.logger.error(
        { key, userId, err },
        'Failed to generate download URL',
      );

      throw err;
    }
  }

  async onInfected({ key }: KeyPayload) {
    this.logger.info({ key }, 'Deleting infected file');

    try {
      await this.s3.send(
        new DeleteObjectCommand({ Bucket: this.bucketName, Key: key }),
      );

      await this.filesRepository.deleteFile(key);

      this.logger.info({ key }, 'Infected file deleted');
    } catch (err: unknown) {
      this.logger.error({ key, err }, 'Failed to delete infected file');

      throw err;
    }
  }

  async onScanFailed({ key }: KeyPayload) {
    try {
      return await this.filesRepository.updateFile(key, {
        status: FileStatus.FAILED,
      });
    } catch (err: unknown) {
      this.logger.error({ key, err }, 'Failed to update file status to FAILED');

      throw err;
    }
  }

  async onScanStarted({ key }: KeyPayload) {
    try {
      return await this.filesRepository.updateFile(key, {
        status: FileStatus.SCANNING,
      });
    } catch (err: unknown) {
      this.logger.error(
        { key, err },
        'Failed to update file status to SCANNING',
      );

      throw err;
    }
  }

  async onClearFile({ key }: KeyPayload) {
    try {
      return await this.filesRepository.updateFile(key, {
        status: FileStatus.CLEAN,
        scanned: true,
      });
    } catch (err: unknown) {
      this.logger.error({ key, err }, 'Failed to mark file as clean');

      throw err;
    }
  }

  async onScanSkipped({ key }: KeyPayload) {
    try {
      return await this.filesRepository.updateFile(key, {
        status: FileStatus.CLEAN,
        scanned: false,
      });
    } catch (err: unknown) {
      this.logger.error({ key, err }, 'Failed to mark scan as skipped');

      throw err;
    }
  }

  async getFileStatus({ key, userId }: GetFileStatusPayload) {
    const file = await this.filesRepository.findFile({ key, userId });

    if (!file) {
      throw new RpcException({
        message: 'File not found',
        status: HttpStatus.NOT_FOUND,
      });
    }

    return { status: file.status };
  }

  async confirmUpload({ key, userId }: FileUploadedPayload) {
    const file = await this.filesRepository.findFile({
      key,
      userId,
      status: FileStatus.PENDING,
    });

    if (!file) {
      throw new RpcException({
        message: 'File not found',
        status: HttpStatus.NOT_FOUND,
      });
    }

    try {
      await this.s3.send(
        new HeadObjectCommand({ Bucket: this.bucketName, Key: key }),
      );
    } catch (err: unknown) {
      if (err instanceof NotFound) {
        await this.filesRepository.updateFile(key, {
          status: FileStatus.FAILED,
        });

        throw new RpcException({
          message: 'File not uploaded to S3',
          status: HttpStatus.BAD_REQUEST,
        });
      }

      throw err;
    }

    this.eventBus.emit(FILE_UPLOADED, {
      key,
      userId,
      fileSize: file.size ?? undefined,
    });

    return { key };
  }

  private async isObjectExistsOrThrow({ key }: KeyPayload) {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3.send(command);

      return true;
    } catch (err: unknown) {
      this.logger.warn({ key, err }, 'File not found in S3');

      throw new RpcException({
        message: 'File not found',
        status: HttpStatus.NOT_FOUND,
      });
    }
  }
}

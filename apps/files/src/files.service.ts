import {
  ConfirmUploadPayload,
  createS3Client,
  GetUploadDataPayload,
  KeyDto,
  KeyPayload,
} from '@app/common';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { CreateFileType } from './types';
import { getFileSize } from './utils';
import { PrismaService } from './prisma';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class FilesService {
  private readonly s3: S3Client;
  private readonly bucketName: string;

  constructor(
    @Inject('antivirus') private readonly antivirusClient: ClientProxy,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    @InjectPinoLogger() private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(FilesService.name);
    this.s3 = createS3Client(configService);

    this.bucketName = configService.get<string>('AWS_S3_BUCKET_NAME')!;
  }

  async getUploadData({ filename, contentType, userId }: GetUploadDataPayload) {
    this.logger.info(
      { userId, filename, contentType },
      'Generating upload URL',
    );

    const key = `${userId}/${filename}-${uuid()}`;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
      });

      const url = await getSignedUrl(this.s3, command, {
        expiresIn: 60 * 5,
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

  async confirmUpload(payload: ConfirmUploadPayload) {
    const { key, userId } = payload;

    this.logger.info({ key, userId }, 'Confirming file upload');

    try {
      await this.isObjectExistsOrThrow({ key });

      this.logger.debug({ key }, 'Sending file to antivirus service');

      const isInfected = await firstValueFrom<boolean>(
        this.antivirusClient.send('scan', { key }),
      );

      if (isInfected) {
        this.logger.warn({ key, userId }, 'File infected, deleting');

        await this.onInfected({ key });

        return false;
      }

      const fileSize = await getFileSize(this.s3, this.bucketName, key);

      await this.onClearFile({
        ...payload,
        size: fileSize,
      });

      this.logger.info({ key, userId, fileSize }, 'File accepted and saved');

      return true;
    } catch (err: unknown) {
      this.logger.error({ key, userId, err }, 'Upload confirmation failed');

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

      const url = await getSignedUrl(this.s3, command, {
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
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3.send(command);

      this.logger.info({ key }, 'Infected file deleted');
    } catch (err: unknown) {
      this.logger.error({ key, err }, 'Failed to delete infected file');

      throw err;
    }
  }

  async onClearFile(file: CreateFileType) {
    this.logger.info(
      {
        key: file.key,
        userId: file.userId,
        size: file.size,
      },
      'Saving file metadata',
    );

    try {
      return await this.prismaService.file.create({
        data: file,
      });
    } catch (err: unknown) {
      this.logger.error(
        {
          key: file.key,
          userId: file.userId,
          err,
        },
        'Failed to save file record',
      );

      throw err;
    }
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

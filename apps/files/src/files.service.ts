import {
  ConfirmUploadPayload,
  createS3Client,
  GetUploadDataPayload,
  KeyDto,
  KeyPayload,
  PrismaService,
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
import { v4 as uuid } from 'uuid';
import { getFileSize } from './utils';

@Injectable()
export class FilesService {
  private readonly s3: S3Client;
  private readonly bucketName: string;

  constructor(
    @Inject('antivirus') private readonly antivirusClient: ClientProxy,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {
    this.s3 = createS3Client(configService);

    this.bucketName = configService.get<string>('AWS_S3_BUCKET_NAME')!;
  }

  async getUploadData({ filename, contentType, userId }: GetUploadDataPayload) {
    const awsKey = `${userId}/${filename}-${uuid()}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: awsKey,
      ContentType: contentType,
    });

    const url = await getSignedUrl(this.s3, command, { expiresIn: 60 * 5 });

    return { url, key: awsKey };
  }

  async confirmUpload(payload: ConfirmUploadPayload) {
    await this.isObjectExistsOrThrow({ key: payload.key });

    this.antivirusClient.emit('scan', { key: payload.key });

    const fileSize = await getFileSize(this.s3, this.bucketName, payload.key);

    return await this.prismaService.file.create({
      data: {
        ...payload,
        size: fileSize,
      },
    });
  }

  async getReadUrl({ key }: KeyDto) {
    await this.isObjectExistsOrThrow({ key });

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return getSignedUrl(this.s3, command, {
      expiresIn: 60 * 5,
    });
  }

  async onInfected({ key }: KeyPayload) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    await this.s3.send(command);

    await this.prismaService.file.delete({
      where: {
        key: key,
      },
    });

    // TODO: notify user that his file was infected and was deleted
  }

  private async isObjectExistsOrThrow({ key }: KeyPayload) {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3.send(command);

      return true;
    } catch {
      throw new RpcException({
        message: 'File not found',
        status: HttpStatus.NOT_FOUND,
      });
    }
  }
}

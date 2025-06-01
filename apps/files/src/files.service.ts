import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  ConfirmUploadPayload,
  GetUploadDataPayload,
  KeyDto,
  KeyPayload,
  PrismaService,
} from '@app/common';
import { v4 as uuid } from 'uuid';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { Prisma } from '@prisma/client';

@Injectable()
export class FilesService {
  private readonly s3: S3Client;
  private readonly bucketName: string;

  constructor(
    @Inject('antivirus') private readonly antivirusClient: ClientProxy,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
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
    this.antivirusClient.emit('scan', { key: payload.key });

    return await this.prismaService.file.create({
      data: payload,
    });
  }

  async getReadUrl({ key }: KeyDto) {
    await this.isFileExistsOrThrow({ key });

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return getSignedUrl(this.s3, command, {
      expiresIn: 60 * 5,
    });
  }

  async getFileStream({ key }: KeyPayload) {
    await this.isFileExistsOrThrow({ key });

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const fileObject = await this.s3.send(command);
    return fileObject.Body;
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

  private async isFileExistsOrThrow(filter: Prisma.FileWhereInput) {
    const isFileExists = await this.prismaService.file.findFirst({
      where: filter,
    });

    if (!isFileExists) {
      throw new RpcException({
        message: 'File not found',
        status: HttpStatus.NOT_FOUND,
      });
    }

    return true;
  }
}

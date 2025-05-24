import { Injectable } from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  ConfirmUploadPayload,
  GetUploadDataPayload,
  PrismaService,
} from '@app/common';
import { v4 as uuid } from 'uuid';

@Injectable()
export class FilesService {
  private readonly s3: S3Client;
  private readonly bucketName: string;

  constructor(
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

  async confirmUpload(dto: ConfirmUploadPayload) {
    return await this.prismaService.file.create({
      data: dto,
    });
  }
}

import { HttpStatus, Injectable } from '@nestjs/common';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { PrismaService, ScanPayload } from '@app/common';
import { RpcException } from '@nestjs/microservices';
import Nodeclam from 'clamscan';
import { Readable } from 'stream';

@Injectable()
export class AntivirusService {
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

  async scan({ key }: ScanPayload): Promise<any> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const fileObject = await this.s3.send(command);
    const fileStream = fileObject.Body as Readable;

    if (!fileStream) {
      throw new RpcException({
        message: 'File not found',
        status: HttpStatus.NOT_FOUND,
      });
    }

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

import { S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

export function createS3Client(configService: ConfigService) {
  console.log({ region: configService.get<string>('AWS_REGION')! });

  return new S3Client({
    region: configService.get<string>('AWS_REGION')!,
    credentials: {
      accessKeyId: configService.get<string>('AWS_ACCESS_ID')!,
      secretAccessKey: configService.get<string>('AWS_SECRET_ACCESS_KEY')!,
    },
  });
}

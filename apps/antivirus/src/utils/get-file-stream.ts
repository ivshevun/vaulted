import { createS3Client } from '@app/common';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

export async function getFileStream(configService: ConfigService, key: string) {
  const bucketName = configService.get<string>('AWS_S3_BUCKET_NAME');

  const s3 = createS3Client(configService);

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const fileObject = await s3.send(command);

  return fileObject.Body;
}

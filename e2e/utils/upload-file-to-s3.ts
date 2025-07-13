import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { v4 as uuid } from 'uuid';

export async function uploadFileToS3(
  configService: ConfigService,
  userId: string,
) {
  console.log('upload started!');

  // create s3 client
  console.log({ region: configService.get<string>('AWS_REGION')! });
  const s3 = new S3Client({
    region: configService.get<string>('AWS_REGION')!,
    credentials: {
      accessKeyId: configService.get<string>('AWS_ACCESS_ID')!,
      secretAccessKey: configService.get<string>('AWS_SECRET_ACCESS_KEY')!,
    },
  });
  const bucketName = configService.get<string>('AWS_S3_BUCKET_NAME');
  console.log({ bucketName });

  // generate aws fileKey
  const fileKey = `${userId}/${uuid()}`;

  // upload file to aws using s3 put command
  const filePath = path.resolve(__dirname, '../fixtures/avatar.png');
  const file = await fs.readFile(filePath);
  console.log({ file });

  const command = new PutObjectCommand({
    Key: fileKey,
    Bucket: bucketName,
    Body: file,
  });

  await s3.send(command);

  console.log({ correctKey: fileKey });
  return fileKey;
}

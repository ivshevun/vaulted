import { createS3Client } from '@app/common';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export async function uploadFileToS3(
  configService: ConfigService,
  key: string,
  isInfected = false,
) {
  const s3 = createS3Client(configService);
  const bucketName = configService.get<string>('AWS_S3_BUCKET_NAME');

  const filePath = path.resolve(
    __dirname,
    isInfected ? '../fixtures/eicar.txt' : '../fixtures/avatar.png',
  );
  const file = await fs.readFile(filePath);

  await s3.send(
    new PutObjectCommand({ Key: key, Bucket: bucketName, Body: file }),
  );
}

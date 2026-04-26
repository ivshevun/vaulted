import { PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { createS3Client } from './create-s3-client';

export async function uploadFileToS3(key: string, isInfected = false) {
  const s3 = createS3Client();
  const filePath = path.resolve(
    __dirname,
    isInfected ? '../fixtures/eicar.txt' : '../fixtures/avatar.png',
  );
  const file = await fs.readFile(filePath);

  await s3.send(
    new PutObjectCommand({
      Key: key,
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Body: file,
    }),
  );
}

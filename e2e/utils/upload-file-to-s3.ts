import { createS3Client } from '@app/common';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { v4 as uuid } from 'uuid';

export async function uploadFileToS3(
  configService: ConfigService,
  userId: string,
  isInfected = false,
) {
  const s3 = createS3Client(configService);
  const bucketName = configService.get<string>('AWS_S3_BUCKET_NAME');

  // generate aws fileKey
  const fileKey = `${userId}/${uuid()}`;

  const normalFilePath = '../fixtures/avatar.png';
  const infectedFilePath = '../fixtures/eicar.txt';

  const currentFilePath = isInfected ? infectedFilePath : normalFilePath;

  // upload file to aws using s3 put command
  const filePath = path.resolve(__dirname, currentFilePath);
  const file = await fs.readFile(filePath);

  const command = new PutObjectCommand({
    Key: fileKey,
    Bucket: bucketName,
    Body: file,
  });

  await s3.send(command);

  return fileKey;
}

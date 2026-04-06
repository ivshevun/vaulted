import { createS3Client } from '@app/common';
import { DeleteObjectsCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

export async function clearS3Bucket(configService: ConfigService) {
  const s3 = createS3Client(configService);
  const bucketName = configService.get<string>('AWS_S3_BUCKET_NAME')!;

  const { Contents } = await s3.send(
    new ListObjectsV2Command({ Bucket: bucketName }),
  );

  if (!Contents?.length) return;

  await s3.send(
    new DeleteObjectsCommand({
      Bucket: bucketName,
      Delete: {
        Objects: Contents.map(({ Key }) => ({ Key })),
      },
    }),
  );
}

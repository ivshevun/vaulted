import { DeleteObjectsCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { createS3Client } from './create-s3-client';

export async function clearS3Bucket() {
  const s3 = createS3Client();
  const bucketName = process.env.AWS_S3_BUCKET_NAME!;

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

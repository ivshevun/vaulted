import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';

export async function getFileSize(
  s3: S3Client,
  bucketName: string,
  key: string,
) {
  const command = new HeadObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const response = await s3.send(command);

  return response.ContentLength || 0;
}

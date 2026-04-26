import { S3Client } from '@aws-sdk/client-s3';

export function createS3Client() {
  const endpoint = process.env.AWS_S3_ENDPOINT;

  return new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    ...(endpoint && { endpoint, forcePathStyle: true }),
  });
}

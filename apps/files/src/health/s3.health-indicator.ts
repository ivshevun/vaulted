import { Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { createS3Client } from '@app/common';

@Injectable()
export class S3HealthIndicator {
  private readonly s3: S3Client;
  private readonly bucketName: string;

  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    configService: ConfigService,
  ) {
    this.s3 = createS3Client(configService);
    this.bucketName = configService.get<string>('AWS_S3_BUCKET_NAME')!;
  }

  async isHealthy(key: string) {
    const indicator = this.healthIndicatorService.check(key);
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucketName }));
      return indicator.up();
    } catch {
      return indicator.down();
    }
  }
}

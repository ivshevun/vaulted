import amqplib from 'amqplib';
import { ConfigService } from '@nestjs/config';
import { FileUploadedPayload } from '@app/common';
import { ANTIVIRUS_QUEUE, FILE_UPLOADED } from '@app/common/constants';

export async function publishAntivirusMessage(
  configService: ConfigService,
  payload: FileUploadedPayload,
  retryCount: number,
): Promise<void> {
  const url = configService.get<string>('RABBITMQ_URL')!;
  const connection = await amqplib.connect(url);
  const channel = await connection.createChannel();

  channel.sendToQueue(
    ANTIVIRUS_QUEUE,
    Buffer.from(JSON.stringify({ pattern: FILE_UPLOADED, data: payload })),
    { headers: { 'x-death': [{ count: retryCount }] } },
  );

  await channel.close();
  await connection.close();
}

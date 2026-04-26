import amqplib from 'amqplib';
import { FileUploadedPayload } from '@app/common';
import { ANTIVIRUS_QUEUE, FILE_UPLOADED } from '@app/common/constants';

// TODO: move to integration tests — bypasses HTTP, tests internal retry/DLX mechanism
export async function publishAntivirusMessage(
  payload: FileUploadedPayload,
  retryCount: number,
): Promise<void> {
  const connection = await amqplib.connect(process.env.RABBITMQ_URL!);
  const channel = await connection.createChannel();

  channel.sendToQueue(
    ANTIVIRUS_QUEUE,
    Buffer.from(JSON.stringify({ pattern: FILE_UPLOADED, data: payload })),
    { headers: { 'x-death': [{ count: retryCount }] } },
  );

  await channel.close();
  await connection.close();
}

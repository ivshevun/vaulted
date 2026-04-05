import { pinoConfig } from '@app/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from 'nestjs-pino';
import amqplib from 'amqplib';
import { AntivirusDlxSetupService } from '@apps/antivirus/src/antivirus-dlx-setup.service';

jest.mock('amqplib', () => ({ connect: jest.fn() }));

describe('AntivirusDlxSetupService', () => {
  let service: AntivirusDlxSetupService;
  let mockChannel: Record<string, jest.Mock>;
  let mockConnection: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockChannel = {
      assertExchange: jest.fn().mockResolvedValue(undefined),
      assertQueue: jest.fn().mockResolvedValue(undefined),
      bindQueue: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
    };

    mockConnection = {
      createChannel: jest.fn().mockResolvedValue(mockChannel),
      close: jest.fn().mockResolvedValue(undefined),
    };

    (amqplib.connect as jest.Mock).mockResolvedValue(mockConnection);

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        await ConfigModule.forRoot({ isGlobal: true }),
        LoggerModule.forRoot(pinoConfig),
      ],
      providers: [AntivirusDlxSetupService],
    }).compile();

    service = module.get<AntivirusDlxSetupService>(AntivirusDlxSetupService);
  });

  describe('onApplicationBootstrap', () => {
    it('should assert antivirus_dlx as a direct durable exchange', async () => {
      await service.onApplicationBootstrap();

      expect(mockChannel.assertExchange).toHaveBeenCalledWith(
        'antivirus_dlx',
        'direct',
        { durable: true },
      );
    });

    it('should assert antivirus_retry_queue with TTL and dead-letter back to main exchange', async () => {
      await service.onApplicationBootstrap();

      expect(mockChannel.assertQueue).toHaveBeenCalledWith(
        'antivirus_retry_queue',
        {
          durable: true,
          arguments: {
            'x-message-ttl': 30_000,
            'x-dead-letter-exchange': 'vaulted.events',
            'x-dead-letter-routing-key': 'file.uploaded',
          },
        },
      );
    });

    it('should bind antivirus_retry_queue to antivirus_dlx with routing key file.uploaded', async () => {
      await service.onApplicationBootstrap();

      expect(mockChannel.bindQueue).toHaveBeenCalledWith(
        'antivirus_retry_queue',
        'antivirus_dlx',
        'file.uploaded',
      );
    });

    it('should close the channel and connection after setup', async () => {
      await service.onApplicationBootstrap();

      expect(mockChannel.close).toHaveBeenCalled();
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('should connect using the RABBITMQ_URL from config', async () => {
      await service.onApplicationBootstrap();

      expect(amqplib.connect).toHaveBeenCalledWith(expect.any(String));
    });
  });
});

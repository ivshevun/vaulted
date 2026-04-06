import { pinoConfig } from '@app/common';
import { GetObjectCommand, NoSuchKey, S3Client } from '@aws-sdk/client-s3';
import { ConfigModule } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { AwsClientStub, mockClient } from 'aws-sdk-client-mock';
import * as matchers from 'aws-sdk-client-mock-jest';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { AntivirusService } from '../../src/antivirus.service';
import { LoggerModule } from 'nestjs-pino';
import { makeFileUploadedPayload } from '@app/common-tests';
import {
  FILE_SCAN_CLEAR,
  FILE_SCAN_FAILED,
  FILE_SCAN_INFECTED,
  FILE_SCAN_STARTED,
  RMQ_EXCHANGE,
} from '@app/common/constants';
import { Readable } from 'stream';
import { sdkStreamMixin } from '@smithy/util-stream';

const mockScanStream = jest.fn();

jest.mock('clamscan', () => {
  return jest.fn().mockImplementation(() => ({
    init: jest.fn().mockResolvedValue({
      scanStream: mockScanStream,
    }),
  }));
});

describe('AntivirusService', () => {
  let service: AntivirusService;
  let filesProxyMock: DeepMockProxy<ClientProxy>;
  let s3Mock: AwsClientStub<S3Client>;

  beforeEach(async () => {
    mockScanStream.mockClear();
    filesProxyMock = mockDeep();
    s3Mock = mockClient(S3Client);

    expect.extend(matchers);

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        await ConfigModule.forRoot({ isGlobal: true }),
        LoggerModule.forRoot(pinoConfig),
      ],
      providers: [
        AntivirusService,
        {
          provide: RMQ_EXCHANGE,
          useValue: filesProxyMock,
        },
      ],
    }).compile();

    s3Mock.on(GetObjectCommand).resolves({
      Body: sdkStreamMixin(Readable.from([''])),
    });

    service = module.get<AntivirusService>(AntivirusService);
  });

  describe('scan', () => {
    describe('when max retries are exhausted', () => {
      it('should emit FILE_SCAN_FAILED and not scan', async () => {
        const payload = makeFileUploadedPayload();

        await service.scan(payload, 5);

        expect(filesProxyMock.emit).toHaveBeenCalledWith(FILE_SCAN_FAILED, {
          key: payload.key,
        });
        expect(mockScanStream).not.toHaveBeenCalled();
      });
    });

    describe('when scan file is clear', () => {
      beforeEach(() => {
        mockScanStream.mockResolvedValue({
          isInfected: false,
        });
      });

      it('should emit file.scan.started before scanning', async () => {
        const payload = makeFileUploadedPayload();

        await service.scan(payload);

        expect(filesProxyMock.emit).toHaveBeenCalledWith(FILE_SCAN_STARTED, {
          key: payload.key,
        });
      });

      it('should notify that file is clear', async () => {
        const payload = makeFileUploadedPayload();

        await service.scan(payload);

        expect(filesProxyMock.emit).toHaveBeenCalledWith(FILE_SCAN_CLEAR, {
          key: payload.key,
        });
      });
    });
    describe('when file is infected', () => {
      beforeEach(() => {
        mockScanStream.mockResolvedValue({
          isInfected: true,
        });
      });

      it('should emit file.scan.started before scanning', async () => {
        const payload = makeFileUploadedPayload();

        await service.scan(payload);

        expect(filesProxyMock.emit).toHaveBeenCalledWith(FILE_SCAN_STARTED, {
          key: payload.key,
        });
      });

      it('should notify that file is infected', async () => {
        const payload = makeFileUploadedPayload();

        await service.scan(payload);

        expect(filesProxyMock.emit).toHaveBeenCalledWith(FILE_SCAN_INFECTED, {
          key: payload.key,
        });
      });
    });
    describe('when S3 file is not found', () => {
      it('should emit FILE_SCAN_FAILED when S3 throws NoSuchKey', async () => {
        const payload = makeFileUploadedPayload();
        s3Mock
          .on(GetObjectCommand)
          .rejects(new NoSuchKey({ message: 'NoSuchKey', $metadata: {} }));

        await service.scan(payload);

        expect(filesProxyMock.emit).toHaveBeenCalledWith(FILE_SCAN_FAILED, {
          key: payload.key,
        });
      });

      it('should not rethrow when S3 throws NoSuchKey', async () => {
        s3Mock
          .on(GetObjectCommand)
          .rejects(new NoSuchKey({ message: 'NoSuchKey', $metadata: {} }));

        await expect(
          service.scan(makeFileUploadedPayload()),
        ).resolves.not.toThrow();
      });

      it('should not emit FILE_SCAN_STARTED when S3 throws NoSuchKey', async () => {
        s3Mock
          .on(GetObjectCommand)
          .rejects(new NoSuchKey({ message: 'NoSuchKey', $metadata: {} }));

        await service.scan(makeFileUploadedPayload());

        expect(filesProxyMock.emit).not.toHaveBeenCalledWith(
          FILE_SCAN_STARTED,
          expect.anything(),
        );
      });

      it('should emit FILE_SCAN_FAILED when S3 body is missing', async () => {
        const payload = makeFileUploadedPayload();
        s3Mock.on(GetObjectCommand).resolves({});

        await service.scan(payload);

        expect(filesProxyMock.emit).toHaveBeenCalledWith(FILE_SCAN_FAILED, {
          key: payload.key,
        });
      });

      it('should not rethrow when S3 body is missing', async () => {
        s3Mock.on(GetObjectCommand).resolves({});

        await expect(
          service.scan(makeFileUploadedPayload()),
        ).resolves.not.toThrow();
      });

      it('should not emit FILE_SCAN_STARTED when S3 body is missing', async () => {
        s3Mock.on(GetObjectCommand).resolves({});

        await service.scan(makeFileUploadedPayload());

        expect(filesProxyMock.emit).not.toHaveBeenCalledWith(
          FILE_SCAN_STARTED,
          expect.anything(),
        );
      });
    });

    describe('when S3 has a transient error', () => {
      const s3TransientError = new Error('S3 unavailable');

      beforeEach(() => {
        s3Mock.on(GetObjectCommand).rejects(s3TransientError);
      });

      it('should rethrow the error', async () => {
        await expect(service.scan(makeFileUploadedPayload())).rejects.toThrow(
          s3TransientError,
        );
      });

      it('should not emit FILE_SCAN_FAILED', async () => {
        await service.scan(makeFileUploadedPayload()).catch(() => {});

        expect(filesProxyMock.emit).not.toHaveBeenCalledWith(
          FILE_SCAN_FAILED,
          expect.anything(),
        );
      });

      it('should not emit FILE_SCAN_STARTED', async () => {
        await service.scan(makeFileUploadedPayload()).catch(() => {});

        expect(filesProxyMock.emit).not.toHaveBeenCalledWith(
          FILE_SCAN_STARTED,
          expect.anything(),
        );
      });
    });
    describe('when ClamAV throws', () => {
      const clamAVErrorMessage = 'ClamAV crashed';

      beforeEach(() => {
        mockScanStream.mockRejectedValue(new Error(clamAVErrorMessage));
      });

      it('should rethrow the error', async () => {
        await expect(service.scan(makeFileUploadedPayload())).rejects.toThrow(
          clamAVErrorMessage,
        );
      });

      it('should emit file.scan.started but not a result event', async () => {
        const payload = makeFileUploadedPayload();

        await service.scan(payload).catch(() => {});

        expect(filesProxyMock.emit).toHaveBeenCalledWith(FILE_SCAN_STARTED, {
          key: payload.key,
        });
        expect(filesProxyMock.emit).not.toHaveBeenCalledWith(
          FILE_SCAN_CLEAR,
          expect.anything(),
        );
        expect(filesProxyMock.emit).not.toHaveBeenCalledWith(
          FILE_SCAN_INFECTED,
          expect.anything(),
        );
        expect(filesProxyMock.emit).not.toHaveBeenCalledWith(
          FILE_SCAN_FAILED,
          expect.anything(),
        );
      });
    });
  });
});

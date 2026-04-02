import { pinoConfig } from '@app/common';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
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
  FILE_SCAN_INFECTED,
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
    describe('when scan file is clear', () => {
      beforeEach(() => {
        mockScanStream.mockResolvedValue({
          isInfected: false,
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

      it('should notify that file is infected', async () => {
        const payload = makeFileUploadedPayload();

        await service.scan(payload);

        expect(filesProxyMock.emit).toHaveBeenCalledWith(FILE_SCAN_INFECTED, {
          key: payload.key,
        });
      });
    });
    describe('when s3 download fails', () => {
      const s3UnavailableMessage = 'S3 unavailable';

      beforeEach(() => {
        s3Mock.on(GetObjectCommand).rejects(new Error(s3UnavailableMessage));
      });
      it('should rethrow the error', async () => {
        const payload = makeFileUploadedPayload();
        await expect(service.scan(payload)).rejects.toThrow(
          s3UnavailableMessage,
        );
      });
      it('should emit nothing', async () => {
        const payload = makeFileUploadedPayload();

        await service.scan(payload).catch(() => {});

        expect(filesProxyMock.emit).not.toHaveBeenCalled();
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

      it('should emit nothing', async () => {
        await service.scan(makeFileUploadedPayload()).catch(() => {});

        expect(filesProxyMock.emit).not.toHaveBeenCalled();
      });
    });
  });
});

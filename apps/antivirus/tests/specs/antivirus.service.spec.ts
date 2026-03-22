import { pinoConfig } from '@app/common';
import { S3Client } from '@aws-sdk/client-s3';
import { ConfigModule } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { AwsClientStub, mockClient } from 'aws-sdk-client-mock';
import * as matchers from 'aws-sdk-client-mock-jest';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { AntivirusService } from '../../src/antivirus.service';
import { LoggerModule } from 'nestjs-pino';

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
          provide: 'files',
          useValue: filesProxyMock,
        },
      ],
    }).compile();

    service = module.get<AntivirusService>(AntivirusService);
  });

  describe('when file is clean', () => {});

  describe('when file is infected', () => {});
});

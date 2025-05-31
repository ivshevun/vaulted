import { AntivirusService } from './antivirus.service';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { ClientProxy } from '@nestjs/microservices';
import { Readable } from 'stream';
import { sdkStreamMixin } from '@smithy/util-stream';
import { of } from 'rxjs';
import { KeyPayload } from '@app/common';

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

  beforeEach(async () => {
    filesProxyMock = mockDeep();

    const module: TestingModule = await Test.createTestingModule({
      imports: [await ConfigModule.forRoot({ isGlobal: true })],
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

  describe('scan', () => {
    const payload: KeyPayload = {
      key: 'file-key',
    };

    beforeEach(() => {
      const mockUrl = 'image-url';
      const stream = new Readable();
      stream.push(mockUrl);
      stream.push(null);

      const sdkStream = sdkStreamMixin(stream);
      filesProxyMock.send.mockReturnValue(of(sdkStream));
    });

    it('should return true if file is infected', async () => {
      mockScanStream.mockResolvedValue({ isInfected: true });

      const result = await service.scan(payload);

      expect(result.isInfected).toBeTruthy();
    });
    it('should return false if file is not infected', async () => {
      mockScanStream.mockResolvedValue({ isInfected: false });

      const result = await service.scan(payload);

      expect(result.isInfected).toBeFalsy();
    });

    it('should call filesClient.send with "get-file-stream" and key passed', async () => {
      await service.scan(payload);

      expect(filesProxyMock.send).toHaveBeenCalledWith(
        'get-file-stream',
        payload,
      );
    });
  });
});

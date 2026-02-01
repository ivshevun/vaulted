import {
  ConfirmUploadPayload,
  GetUploadDataPayload,
  pinoConfig,
} from '@app/common';
import {
  DeleteObjectCommand,
  HeadObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigModule } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { AwsClientStub, mockClient } from 'aws-sdk-client-mock';
import * as matchers from 'aws-sdk-client-mock-jest';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { of } from 'rxjs';
import { FilesService } from './files.service';
import { PrismaService } from './prisma';
import { LoggerModule } from 'nestjs-pino';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

describe('FilesService', () => {
  let service: FilesService;
  let prismaServiceMock: DeepMockProxy<PrismaService>;
  let s3Mock: AwsClientStub<S3Client>;
  let antivirusProxyMock: DeepMockProxy<ClientProxy>;

  const mockFile = {
    id: 'id',
    key: 'file-key',
    filename: 'avatar.png',
    contentType: 'image/png',
    size: 123,
    userId: 'user-id',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prismaServiceMock = mockDeep();
    antivirusProxyMock = mockDeep();
    s3Mock = mockClient(S3Client);

    expect.extend(matchers);

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        await ConfigModule.forRoot({ isGlobal: true }),
        LoggerModule.forRoot(pinoConfig),
      ],
      providers: [
        FilesService,
        { provide: PrismaService, useValue: prismaServiceMock },
        { provide: 'antivirus', useValue: antivirusProxyMock },
      ],
    }).compile();

    antivirusProxyMock.send.mockReturnValue(of(false));

    service = module.get<FilesService>(FilesService);
  });

  describe('getUploadData', () => {
    it('should return signed upload URL with a key', async () => {
      const mockUrl = 'https://mock-s3-url.com/upload';
      (getSignedUrl as jest.Mock).mockResolvedValue(mockUrl);

      const payload: GetUploadDataPayload = {
        filename: 'avatar.png',
        contentType: 'image/png',
        userId: 'ee3030fe-503b-474c-aa3e-3837aeb6e0ed',
      };

      const result = await service.getUploadData(payload);

      expect(result.url).toBeDefined();
      expect(result.key).toBeDefined();
      expect(getSignedUrl).toHaveBeenCalled();
    });
  });

  describe('confirmUpload', () => {
    const payload: ConfirmUploadPayload = {
      key: 'ee3030fe-503b-474c-aa3e-3837aeb6e0ed/avatar.png-8bac9ec1-992e-4512-b266-bd4f5ee07620',
      filename: 'avatar.png',
      contentType: 'image/png',
      userId: 'ee3030fe-503b-474c-aa3e-3837aeb6e0ed',
    };

    it('should throw a 404 if object is not in the bucket', async () => {
      s3Mock.on(HeadObjectCommand).rejects(new Error('File not found'));

      await expect(service.confirmUpload(payload)).rejects.toThrow(
        'File not found',
      );
    });

    it('should send a request for scanning a file', async () => {
      s3Mock.on(HeadObjectCommand).resolves({
        ContentLength: 1000,
      });

      await service.confirmUpload(payload);

      expect(antivirusProxyMock.send).toHaveBeenCalledWith('scan', {
        key: payload.key,
      });
    });

    it('should call prismaService.file.create', async () => {
      s3Mock.on(HeadObjectCommand).resolves({
        ContentLength: 1000,
      });

      await service.confirmUpload(payload);

      expect(prismaServiceMock.file.create).toHaveBeenCalled();
    });

    it('should get fileSize by calling s3.HeadObjectCommand', async () => {
      s3Mock.on(HeadObjectCommand).resolves({
        ContentLength: 1000,
      });

      await service.confirmUpload(payload);

      expect(
        s3Mock.commandCalls(HeadObjectCommand).length,
      ).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getReadUrl', () => {
    it('should return signed upload url for reading purposes', async () => {
      const mockUrl = 'https://mock-s3-url.com';
      (getSignedUrl as jest.Mock).mockResolvedValue(mockUrl);

      prismaServiceMock.file.findFirst.mockResolvedValue(mockFile);

      const payload = {
        key: 'ee3030fe-503b-474c-aa3e-3837aeb6e0ed/avatar.png-8bac9ec1-992e-4512-b266-bd4f5ee07620',
      };

      const url = await service.getReadUrl(payload);

      expect(url).toBe(mockUrl);
    });

    it('should return a 404 rpc exception if file is not found', async () => {
      s3Mock.on(HeadObjectCommand).rejects(new Error('File not found'));

      const payload = {
        key: 'ee3030fe-503b-474c-aa3e-3837aeb6e0ed/avatar.png-8bac9ec1-992e-4512-b266-bd4f5ee07620',
      };

      await expect(service.getReadUrl(payload)).rejects.toThrow(
        'File not found',
      );
    });
  });

  describe('onInfected', () => {
    it('should call s3.send with DeleteObjectCommand', async () => {
      await service.onInfected({ key: 'file-key' });

      expect(s3Mock).toHaveReceivedCommand(DeleteObjectCommand);
    });
    it.todo(
      'should call notificationsClient.send with "notify-infected" and correct payload',
    );
  });

  describe('onClearFile', () => {
    it('should call prisma.file.create', async () => {
      await service.onClearFile(mockFile);

      expect(prismaServiceMock.file.create).toHaveBeenCalled();
    });
  });
});

import { pinoConfig } from '@app/common';
import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { HttpStatus } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { AwsClientStub, mockClient } from 'aws-sdk-client-mock';
import * as matchers from 'aws-sdk-client-mock-jest';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { LoggerModule } from 'nestjs-pino';
import { FilesService } from '../../src/files.service';
import { FilesRepository } from '../../src/files.repository';
import { makeGetUploadDataPayload } from '@apps/files/tests/utils';
import { makeFileUploadedPayload } from '@app/common-tests';
import { File, FileStatus } from '@prisma/files-client';
import { FILE_UPLOADED, RMQ_EXCHANGE } from '@app/common/constants';
import { KeyPayload } from '@app/common';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

describe('FilesService', () => {
  let service: FilesService;
  let filesRepositoryMock: DeepMockProxy<FilesRepository>;
  let eventBusMock: DeepMockProxy<ClientProxy>;
  let s3Mock: AwsClientStub<S3Client>;

  beforeEach(async () => {
    filesRepositoryMock = mockDeep();
    eventBusMock = mockDeep();
    s3Mock = mockClient(S3Client);

    expect.extend(matchers);

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        await ConfigModule.forRoot({ isGlobal: true }),
        LoggerModule.forRoot(pinoConfig),
      ],
      providers: [
        FilesService,
        { provide: FilesRepository, useValue: filesRepositoryMock },
        { provide: RMQ_EXCHANGE, useValue: eventBusMock },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
  });

  describe('getUploadData', () => {
    const payload = makeGetUploadDataPayload();

    describe('when presigner succeeds', () => {
      const mockUrl = 'https://mock-s3-url.com/upload';

      beforeEach(() => {
        (getSignedUrl as jest.Mock).mockResolvedValue(mockUrl);
      });

      it('should return a signed upload URL', async () => {
        const result = await service.getUploadData(payload);

        expect(result.url).toBe(mockUrl);
      });

      it('should return a key', async () => {
        const result = await service.getUploadData(payload);

        expect(result.key).toBeDefined();
      });

      it('should use PutObjectCommand', async () => {
        await service.getUploadData(payload);

        expect(getSignedUrl).toHaveBeenCalledWith(
          expect.anything(),
          expect.any(PutObjectCommand),
          expect.anything(),
        );
      });
    });

    describe('when presigner fails', () => {
      const presignerError = new Error('Presigner unavailable');

      beforeEach(() => {
        (getSignedUrl as jest.Mock).mockRejectedValue(presignerError);
      });

      it('should rethrow the error', async () => {
        await expect(service.getUploadData(payload)).rejects.toThrow(
          presignerError,
        );
      });
    });
  });

  describe('getReadUrl', () => {
    const payload = makeFileUploadedPayload();

    describe('when file exists in S3', () => {
      const mockUrl = 'https://mock-s3-url.com/read';

      beforeEach(() => {
        s3Mock.on(HeadObjectCommand).resolves({});
        (getSignedUrl as jest.Mock).mockResolvedValue(mockUrl);
      });

      it('should return a signed read URL', async () => {
        const result = await service.getReadUrl(payload);

        expect(result).toBe(mockUrl);
      });
    });

    describe('when file does not exist in S3', () => {
      beforeEach(() => {
        s3Mock.on(HeadObjectCommand).rejects(new Error('NoSuchKey'));
      });

      it('should throw an RpcException with NOT_FOUND status', async () => {
        await expect(service.getReadUrl(payload)).rejects.toThrow(RpcException);
      });

      it('should include NOT_FOUND status in the exception', async () => {
        await expect(service.getReadUrl(payload)).rejects.toMatchObject(
          new RpcException({
            message: 'File not found',
            status: HttpStatus.NOT_FOUND,
          }),
        );
      });
    });
  });

  describe('onInfected', () => {
    const payload = { key: 'infected-file-key' };

    describe('when S3 delete succeeds', () => {
      beforeEach(() => {
        s3Mock.on(DeleteObjectCommand).resolves({});
      });

      it('should delete the file from S3', async () => {
        await service.onInfected(payload);

        expect(s3Mock).toHaveReceivedCommandWith(DeleteObjectCommand, {
          Key: payload.key,
        });
      });

      it('should delete the file record from DB', async () => {
        await service.onInfected(payload);

        expect(filesRepositoryMock.deleteFile).toHaveBeenCalledWith(
          payload.key,
        );
      });
    });

    describe('when S3 delete fails', () => {
      const s3Error = new Error('S3 unavailable');

      beforeEach(() => {
        s3Mock.on(DeleteObjectCommand).rejects(s3Error);
      });

      it('should rethrow the error', async () => {
        await expect(service.onInfected(payload)).rejects.toThrow(s3Error);
      });

      it('should not delete the DB record', async () => {
        await service.onInfected(payload).catch(() => {});

        expect(filesRepositoryMock.deleteFile).not.toHaveBeenCalled();
      });
    });
  });

  describe('onClearFile', () => {
    const payload = makeFileUploadedPayload();
    const fileSize = 2048;
    const mockFileRecord: File = {
      id: 'file-id',
      key: payload.key,
      filename: 'avatar.png',
      contentType: 'image/png',
      userId: payload.userId,
      size: fileSize,
      status: FileStatus.CLEAN,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    describe('when S3 and database succeed', () => {
      beforeEach(() => {
        s3Mock.on(HeadObjectCommand).resolves({ ContentLength: fileSize });
        filesRepositoryMock.updateFile.mockResolvedValue(mockFileRecord);
      });

      it('should update the file record with size from S3 and CLEAN status', async () => {
        await service.onClearFile(payload);

        expect(filesRepositoryMock.updateFile).toHaveBeenCalledWith(
          payload.key,
          { status: FileStatus.CLEAN, size: fileSize },
        );
      });

      it('should return the updated file record', async () => {
        const result = await service.onClearFile(payload);

        expect(result).toBe(mockFileRecord);
      });
    });

    describe('when S3 HeadObject fails', () => {
      const s3Error = new Error('S3 unavailable');

      beforeEach(() => {
        s3Mock.on(HeadObjectCommand).rejects(s3Error);
      });

      it('should rethrow the error', async () => {
        await expect(service.onClearFile(payload)).rejects.toThrow(s3Error);
      });

      it('should not save anything to the database', async () => {
        await service.onClearFile(payload).catch(() => {});

        expect(filesRepositoryMock.updateFile).not.toHaveBeenCalled();
      });
    });

    describe('when database update fails', () => {
      const dbError = new Error('DB connection lost');

      beforeEach(() => {
        s3Mock.on(HeadObjectCommand).resolves({ ContentLength: fileSize });
        filesRepositoryMock.updateFile.mockRejectedValue(dbError);
      });

      it('should rethrow the error', async () => {
        await expect(service.onClearFile(payload)).rejects.toThrow(dbError);
      });
    });
  });

  describe('onScanFailed', () => {
    const payload: KeyPayload = { key: 'user-id/file-uuid' };

    describe('when database update succeeds', () => {
      beforeEach(() => {
        filesRepositoryMock.updateFile.mockResolvedValue({} as File);
      });

      it('should update the file status to FAILED', async () => {
        await service.onScanFailed(payload);

        expect(filesRepositoryMock.updateFile).toHaveBeenCalledWith(
          payload.key,
          { status: FileStatus.FAILED },
        );
      });
    });

    describe('when database update fails', () => {
      const dbError = new Error('DB connection lost');

      beforeEach(() => {
        filesRepositoryMock.updateFile.mockRejectedValue(dbError);
      });

      it('should rethrow the error', async () => {
        await expect(service.onScanFailed(payload)).rejects.toThrow(dbError);
      });
    });
  });

  describe('onScanStarted', () => {
    const payload: KeyPayload = { key: 'user-id/file-uuid' };

    describe('when database update succeeds', () => {
      beforeEach(() => {
        filesRepositoryMock.updateFile.mockResolvedValue({} as File);
      });

      it('should update the file status to SCANNING', async () => {
        await service.onScanStarted(payload);

        expect(filesRepositoryMock.updateFile).toHaveBeenCalledWith(
          payload.key,
          { status: FileStatus.SCANNING },
        );
      });
    });

    describe('when database update fails', () => {
      const dbError = new Error('DB connection lost');

      beforeEach(() => {
        filesRepositoryMock.updateFile.mockRejectedValue(dbError);
      });

      it('should rethrow the error', async () => {
        await expect(service.onScanStarted(payload)).rejects.toThrow(dbError);
      });
    });
  });

  describe('confirmUpload', () => {
    const payload = makeFileUploadedPayload();
    const mockPendingFile: File = {
      id: 'file-id',
      key: payload.key,
      filename: 'avatar.png',
      contentType: 'image/png',
      userId: payload.userId,
      size: null,
      status: FileStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    describe('when no PENDING record exists in DB', () => {
      beforeEach(() => {
        filesRepositoryMock.findFile.mockResolvedValue(null);
      });

      it('should throw an RpcException with NOT_FOUND status', async () => {
        await expect(service.confirmUpload(payload)).rejects.toMatchObject(
          new RpcException({
            message: 'File not found',
            status: HttpStatus.NOT_FOUND,
          }),
        );
      });
    });

    describe('when PENDING record exists but HeadObject fails', () => {
      const s3Error = new Error('NoSuchKey');

      beforeEach(() => {
        filesRepositoryMock.findFile.mockResolvedValue(mockPendingFile);
        s3Mock.on(HeadObjectCommand).rejects(s3Error);
      });

      it('should update file status to FAILED', async () => {
        await service.confirmUpload(payload).catch(() => {});

        expect(filesRepositoryMock.updateFile).toHaveBeenCalledWith(
          payload.key,
          { status: FileStatus.FAILED },
        );
      });

      it('should not emit file.uploaded', async () => {
        await service.confirmUpload(payload).catch(() => {});

        expect(eventBusMock.emit).not.toHaveBeenCalled();
      });
    });

    describe('when PENDING record exists and file is in S3', () => {
      beforeEach(() => {
        filesRepositoryMock.findFile.mockResolvedValue(mockPendingFile);
        s3Mock.on(HeadObjectCommand).resolves({});
      });

      it('should emit file.uploaded with key and userId', async () => {
        await service.confirmUpload(payload);

        expect(eventBusMock.emit).toHaveBeenCalledWith(FILE_UPLOADED, {
          key: payload.key,
          userId: payload.userId,
        });
      });

      it('should return the key', async () => {
        const result = await service.confirmUpload(payload);

        expect(result).toEqual({ key: payload.key });
      });
    });
  });
});

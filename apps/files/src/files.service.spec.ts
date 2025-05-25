import { FilesService } from './files.service';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  ConfirmUploadPayload,
  GetUploadDataPayload,
  PrismaService,
} from '@app/common';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

describe('FilesService', () => {
  let service: FilesService;
  let prismaServiceMock: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prismaServiceMock = mockDeep();

    const module: TestingModule = await Test.createTestingModule({
      imports: [await ConfigModule.forRoot({ isGlobal: true })],
      providers: [
        FilesService,
        { provide: PrismaService, useValue: prismaServiceMock },
      ],
    }).compile();

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
    it('should call prismaService.file.create', async () => {
      const dto: ConfirmUploadPayload = {
        key: 'ee3030fe-503b-474c-aa3e-3837aeb6e0ed/avatar.png-8bac9ec1-992e-4512-b266-bd4f5ee07620',
        filename: 'avatar.png',
        contentType: 'image/png',
        userId: 'ee3030fe-503b-474c-aa3e-3837aeb6e0ed',
        size: 123,
      };
      await service.confirmUpload(dto);

      expect(prismaServiceMock.file.create).toHaveBeenCalled();
    });
  });

  describe('getReadUrl', () => {
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
      prismaServiceMock.file.findFirst.mockResolvedValue(null);

      const payload = {
        key: 'ee3030fe-503b-474c-aa3e-3837aeb6e0ed/avatar.png-8bac9ec1-992e-4512-b266-bd4f5ee07620',
      };

      await expect(service.getReadUrl(payload)).rejects.toThrow(
        'File not found',
      );
    });
  });
});

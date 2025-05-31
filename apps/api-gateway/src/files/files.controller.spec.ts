import { Test, TestingModule } from '@nestjs/testing';
import { FilesController } from './files.controller';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import {
  ConfirmUploadDto,
  ConfirmUploadPayload,
  GetUploadDataDto,
  GetUploadDataPayload,
  KeyDto,
  UserDto,
} from '@app/common';
import { of } from 'rxjs';
import { File } from '@prisma/client';
import { HttpStatus } from '@nestjs/common';

describe('FilesController', () => {
  let controller: FilesController;
  let filesProxyMock: DeepMockProxy<ClientProxy>;
  let authProxyMock: DeepMockProxy<ClientProxy>;
  let mockResponse: { url: string; key: string };
  let userMock: UserDto;

  beforeEach(async () => {
    userMock = {
      id: '397f028b-d419-4f3c-a50f-a4dc54c2e77d',
      email: 'test@gmail.com',
    };

    filesProxyMock = mockDeep<ClientProxy>();
    authProxyMock = mockDeep<ClientProxy>();

    authProxyMock.send.mockReturnValue(
      of({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }),
    );

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [
        { provide: 'files', useValue: filesProxyMock },
        { provide: 'auth', useValue: authProxyMock },
      ],
    }).compile();

    controller = module.get<FilesController>(FilesController);
  });

  describe('upload-data', () => {
    let dto: GetUploadDataDto;
    let payload: GetUploadDataPayload;

    beforeEach(() => {
      dto = {
        filename: 'avatar.png',
        contentType: 'image/png',
      };

      payload = {
        ...dto,
        userId: userMock.id,
      };

      mockResponse = {
        url: 'https://mock-s3-url.com/upload',
        key: 'file-key',
      };
      filesProxyMock.send.mockReturnValue(of(mockResponse));
    });

    it('should call filesClient.send with "get-upload-data" and dto', async () => {
      await controller.getUploadData(dto, userMock);

      expect(filesProxyMock.send).toHaveBeenCalledWith(
        'get-upload-data',
        payload,
      );
    });
    it('should return uploadUrl with a key', async () => {
      const result = await controller.getUploadData(dto, userMock);

      expect(result).toEqual(mockResponse);
    });
  });

  describe('confirm-upload', () => {
    let dto: ConfirmUploadDto;
    let payload: ConfirmUploadPayload;
    let mockFile: File;

    beforeEach(() => {
      dto = {
        filename: 'avatar.png',
        contentType: 'image/png',
        key: 'file-key',
        size: 123,
      };
      payload = {
        ...dto,
        userId: userMock.id,
      };

      mockFile = {
        id: 'id',
        key: 'file-key',
        filename: 'avatar.png',
        contentType: 'image/png',
        size: 123,
        userId: 'user-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      filesProxyMock.send.mockReturnValue(of(mockFile));
    });

    it('should call filesClient.send with "confirm-upload" and dto', async () => {
      await controller.confirmUpload(dto, userMock);

      expect(filesProxyMock.send).toHaveBeenCalledWith(
        'confirm-upload',
        payload,
      );
    });

    it('should return a created file', async () => {
      const file = await controller.confirmUpload(dto, userMock);

      expect(file).toBe(mockFile);
    });
  });

  describe('get-read-url', () => {
    let dto: KeyDto;
    let mockResponseUrl: string;

    beforeEach(() => {
      dto = {
        key: 'file-key',
      };

      mockResponseUrl = 'https://mock-s3-url.com';
      filesProxyMock.send.mockReturnValue(of(mockResponseUrl));
    });

    it('should call filesClient.send with "get-read-url" and dto', async () => {
      await controller.getReadUrl(dto);

      expect(filesProxyMock.send).toHaveBeenCalledWith('get-read-url', dto);
    });

    it('should return an image url', async () => {
      const result = await controller.getReadUrl(dto);

      expect(result.url).toBe(mockResponseUrl);
    });

    it('should return a 404 if file does not exist', async () => {
      filesProxyMock.send.mockImplementation(() => {
        throw new RpcException({
          message: 'File not found',
          status: HttpStatus.NOT_FOUND,
        });
      });

      await expect(controller.getReadUrl(dto)).rejects.toThrow(
        'File not found',
      );
    });
  });
});

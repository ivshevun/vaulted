import { Test, TestingModule } from '@nestjs/testing';
import { FilesController } from './files.controller';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { ClientProxy } from '@nestjs/microservices';
import { GetUploadDataDto, GetUploadDataPayload, UserDto } from '@app/common';
import { of } from 'rxjs';

describe('FilesController', () => {
  let controller: FilesController;
  let filesProxyMock: DeepMockProxy<ClientProxy>;
  let authProxyMock: DeepMockProxy<ClientProxy>;
  let mockUrl: string;

  beforeEach(async () => {
    mockUrl = 'https://mock-s3-url.com/upload';

    filesProxyMock = mockDeep<ClientProxy>();
    authProxyMock = mockDeep<ClientProxy>();

    filesProxyMock.send.mockReturnValue(of(mockUrl));
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

  describe('Upload', () => {
    const userMock: UserDto = {
      id: '397f028b-d419-4f3c-a50f-a4dc54c2e77d',
      email: 'test@gmail.com',
    };
    const dto: GetUploadDataDto = {
      filename: 'avatar.png',
      contentType: 'image/png',
    };
    const payload: GetUploadDataPayload = {
      ...dto,
      userId: userMock.id,
    };

    it('should call filesClient.send with "get-upload-data" and dto', async () => {
      await controller.getUploadData(dto, userMock);

      expect(filesProxyMock.send).toHaveBeenCalledWith(
        'get-upload-data',
        payload,
      );
    });
    it('should return uploadUrl', async () => {
      const resultUrl = await controller.getUploadData(dto, userMock);
      expect(resultUrl).toEqual(mockUrl);
    });
  });
});

import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { GetUploadDataPayload } from '@app/common';
import { firstValueFrom } from 'rxjs';

describe('FilesController', () => {
  let controller: FilesController;
  let filesServiceMock: DeepMockProxy<FilesService>;

  beforeEach(async () => {
    filesServiceMock = mockDeep<FilesService>();

    const module = await Test.createTestingModule({
      imports: [await ConfigModule.forRoot({ isGlobal: true })],
      controllers: [FilesController],
      providers: [
        {
          provide: FilesService,
          useValue: filesServiceMock,
        },
      ],
    }).compile();

    controller = module.get(FilesController);
  });
  describe('getUploadData', () => {
    const payload: GetUploadDataPayload = {
      filename: 'avatar.png',
      contentType: 'image/png',
      userId: 'ee3030fe-503b-474c-aa3e-3837aeb6e0ed',
    };

    it('should call filesService.getUploadData with correct paylad', async () => {
      await controller.getUploadData(payload);
      expect(filesServiceMock.getUploadData).toHaveBeenCalledWith(payload);
    });

    it('should return the same uploadUrl filesService.getUploadData returns', async () => {
      const mockResponse = {
        url: 'https://mock-s3-url.com/upload',
        key: 'file-key',
      };

      filesServiceMock.getUploadData.mockResolvedValue(mockResponse);

      const data = await firstValueFrom(
        await controller.getUploadData(payload),
      );

      expect(data).toBe(mockResponse);
    });
  });
});

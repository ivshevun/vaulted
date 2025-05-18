import { FilesService } from './files.service';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetUploadDataPayload } from '@app/common';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

describe('FilesService', () => {
  let service: FilesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [await ConfigModule.forRoot({ isGlobal: true })],
      providers: [FilesService],
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
});

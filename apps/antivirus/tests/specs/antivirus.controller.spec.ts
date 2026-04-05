import { Test, TestingModule } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { AntivirusController } from '../../src/antivirus.controller';
import { AntivirusService } from '../../src/antivirus.service';
import { makeFileUploadedPayload } from '@app/common-tests';
import { makeRmqContext } from '../utils';

describe('AntivirusController', () => {
  let controller: AntivirusController;
  let antivirusServiceMock: DeepMockProxy<AntivirusService>;

  beforeEach(async () => {
    antivirusServiceMock = mockDeep<AntivirusService>();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AntivirusController],
      providers: [
        { provide: AntivirusService, useValue: antivirusServiceMock },
      ],
    }).compile();

    controller = module.get<AntivirusController>(AntivirusController);
  });

  describe('scan', () => {
    describe('when x-death header is missing', () => {
      it('should call antivirusService.scan() with retry count 0', async () => {
        const payload = makeFileUploadedPayload();

        await controller.scan(payload, makeRmqContext());

        expect(antivirusServiceMock.scan).toHaveBeenCalledWith(payload, 0);
      });
    });

    describe('when retry count is below the limit', () => {
      it('should call antivirusService.scan() with the extracted count', async () => {
        const payload = makeFileUploadedPayload();

        await controller.scan(payload, makeRmqContext(4));

        expect(antivirusServiceMock.scan).toHaveBeenCalledWith(payload, 4);
      });
    });

    describe('when retry count has reached the limit', () => {
      it('should call antivirusService.scan() with the extracted count', async () => {
        const payload = makeFileUploadedPayload();

        await controller.scan(payload, makeRmqContext(5));

        expect(antivirusServiceMock.scan).toHaveBeenCalledWith(payload, 5);
      });
    });
  });
});

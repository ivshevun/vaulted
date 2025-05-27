import { Test, TestingModule } from '@nestjs/testing';
import { AntivirusController } from './antivirus.controller';
import { AntivirusService } from './antivirus.service';

describe('AntivirusController', () => {
  let antivirusController: AntivirusController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AntivirusController],
      providers: [AntivirusService],
    }).compile();

    antivirusController = app.get<AntivirusController>(AntivirusController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(antivirusController.getHello()).toBe('Hello World!');
    });
  });
});

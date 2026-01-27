import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { ConfigService } from '@nestjs/config';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

describe('NotificationsController', () => {
  let notificationsController: NotificationsController;
  let configServiceMock: DeepMockProxy<ConfigService>;

  beforeEach(async () => {
    const mockResendApiKey = 're_123';

    configServiceMock = mockDeep<ConfigService>();
    configServiceMock.get.mockReturnValue(mockResendApiKey);

    const app: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        NotificationsService,
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    notificationsController = app.get<NotificationsController>(
      NotificationsController,
    );
  });

  describe('root', () => {
    it('should be defined', () => {
      expect(notificationsController).toBeDefined();
    });
  });
});

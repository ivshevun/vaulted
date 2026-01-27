import { AuthService } from './auth.service';
import { Test } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { LoggerModule } from '@app/common';

describe('AuthService', () => {
  let service: AuthService;
  let resMock: Partial<Response>;
  let expectedRefreshToken: string;
  let configServiceMock: DeepMockProxy<ConfigService>;
  let mockDays: string;

  beforeEach(async () => {
    mockDays = '7';
    configServiceMock = mockDeep<ConfigService>();
    configServiceMock.get.mockReturnValue(mockDays);
    resMock = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
      status: jest.fn().mockReturnValue(200),
      send: jest.fn(),
    };
    expectedRefreshToken = 'refresh-token';

    const module = await Test.createTestingModule({
      imports: [await ConfigModule.forRoot({ isGlobal: true }), LoggerModule],
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('addRefreshTokenToResponse', () => {
    it('should call res.cookie with correct params', () => {
      const expectedExpiresIn = new Date();
      expectedExpiresIn.setDate(
        expectedExpiresIn.getDate() + parseInt(mockDays),
      );

      service.addRefreshTokenToResponse(
        resMock as Response,
        expectedRefreshToken,
      );

      expect(resMock.cookie).toHaveBeenCalledWith(
        'refreshToken',
        expectedRefreshToken,
        {
          expires: expect.any(Date) as Date,
          httpOnly: true,
          sameSite: 'lax',
          secure: true,
        },
      );
    });
  });
  describe('removeRefreshTokenFromResponse', () => {
    it('should call res.clearCookie with correct params', () => {
      service.removeRefreshTokenFromResponse(resMock as Response);
      expect(resMock.clearCookie).toHaveBeenCalledWith('refreshToken');
    });
  });
});

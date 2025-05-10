import { AuthController } from './auth.controller';
import { ClientProxy } from '@nestjs/microservices';
import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { ConfigModule } from '@nestjs/config';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { LoginDto, RegisterDto, RequestWithCookies, Tokens } from '@app/common';
import { Response } from 'express';
import { of } from 'rxjs';

describe('AuthController (API Gateway)', () => {
  let service: AuthService;
  let controller: AuthController;
  let clientProxyMock: DeepMockProxy<ClientProxy>;
  let expectedTokens: Tokens;
  let resMock: Partial<Response>;
  let reqMock: Partial<RequestWithCookies>;
  let authServiceMock: DeepMockProxy<AuthService>;

  beforeEach(async () => {
    expectedTokens = {
      accessToken: 'accessToken',
      refreshToken: 'refreshToken',
    };

    clientProxyMock = mockDeep<ClientProxy>();
    authServiceMock = mockDeep<AuthService>();

    clientProxyMock.send.mockReturnValue(of(expectedTokens));

    resMock = {
      cookie: jest.fn(),
      status: jest.fn().mockReturnValue(200),
      send: jest.fn(),
    };

    reqMock = {
      cookies: {
        refreshToken: expectedTokens.refreshToken,
      },
    };

    const module = await Test.createTestingModule({
      imports: [await ConfigModule.forRoot({ isGlobal: true })],
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
        { provide: 'auth', useValue: clientProxyMock },
      ],
    }).compile();

    controller = module.get(AuthController);
    service = module.get(AuthService);
  });

  describe('Register', () => {
    const dto: RegisterDto = {
      name: 'john',
      email: 'john@gmail.com',
      password: '123456',
    };

    it('should call authClient.send with "register" and dto', async () => {
      await controller.register(dto, resMock as Response);
      expect(clientProxyMock.send).toHaveBeenCalledWith('register', dto);
    });

    it('should return return accessToken', async () => {
      const result = await controller.register(dto, resMock as Response);
      expect(result).toEqual({ accessToken: expectedTokens.accessToken });
    });

    it('should call authService.addRefreshTokenToResponse', async () => {
      await controller.register(dto, resMock as Response);
      expect(service.addRefreshTokenToResponse).toHaveBeenCalledWith(
        resMock as Response,
        expectedTokens.refreshToken,
      );
    });
  });

  describe('Login', () => {
    const dto: LoginDto = {
      email: 'john@gmail.com',
      password: '123456',
    };

    it('should call authClient.send with "login" and dto', async () => {
      await controller.login(dto, resMock as Response);
      expect(clientProxyMock.send).toHaveBeenCalledWith('login', dto);
    });

    it('should return accessToken', async () => {
      const { accessToken } = await controller.login(dto, resMock as Response);
      expect(accessToken).toEqual(accessToken);
    });

    it('should call authService.addRefreshTokenToResponse', async () => {
      await controller.login(dto, resMock as Response);
      expect(service.addRefreshTokenToResponse).toHaveBeenCalledWith(
        resMock as Response,
        expectedTokens.refreshToken,
      );
    });
  });

  describe('Refresh', () => {
    it('should call authClient.send with refreshToken from cookies', async () => {
      await controller.refresh(
        reqMock as RequestWithCookies,
        resMock as Response,
      );
      expect(clientProxyMock.send).toHaveBeenCalledWith('refresh', {
        refreshToken: expectedTokens.refreshToken,
      });
    });

    it('should return accessToken', async () => {
      const result = await controller.refresh(
        reqMock as RequestWithCookies,
        resMock as Response,
      );
      expect(result).toEqual({ accessToken: expectedTokens.accessToken });
    });

    it('should call authService.addRefreshTokenToResponse', async () => {
      await controller.refresh(
        reqMock as RequestWithCookies,
        resMock as Response,
      );
      expect(service.addRefreshTokenToResponse).toHaveBeenCalledWith(
        resMock as Response,
        expectedTokens.refreshToken,
      );
    });
  });
});

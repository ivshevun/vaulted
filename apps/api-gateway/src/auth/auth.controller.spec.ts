import { AuthController } from './auth.controller';
import { ClientProxy } from '@nestjs/microservices';
import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { ConfigModule } from '@nestjs/config';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { LoginDto, RegisterDto, RequestWithCookies, Tokens } from '@app/common';
import { Response } from 'express';
import { of } from 'rxjs';

describe('AuthController', () => {
  let controller: AuthController;
  let clientProxyMock: DeepMockProxy<ClientProxy>;

  let expectedTokens: Tokens;
  let reqCookiesMock: Partial<RequestWithCookies>;

  const res: Partial<Response> = {
    cookie: jest.fn().mockReturnThis(),
    status: jest.fn().mockImplementation().mockReturnValue(200),
    send: jest.fn().mockReturnThis(),
  } as unknown as Response;

  beforeEach(async () => {
    expectedTokens = {
      accessToken: 'accessToken',
      refreshToken: 'refreshToken',
    };

    reqCookiesMock = {
      cookies: {
        refreshToken: expectedTokens.refreshToken,
      },
    } as unknown as RequestWithCookies;

    clientProxyMock = mockDeep<ClientProxy>();
    clientProxyMock.send.mockReturnValue(of(expectedTokens));

    const module = await Test.createTestingModule({
      imports: [
        await ConfigModule.forRoot({
          isGlobal: true,
        }),
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: 'auth',
          useValue: clientProxyMock,
        },
      ],
    }).compile();

    controller = module.get(AuthController);
  });

  describe('Register', () => {
    let registerDto: RegisterDto;

    beforeEach(() => {
      registerDto = {
        name: 'john',
        email: 'john@gmail.com',
        password: '123456',
      };
    });

    it('should call authClient.register', async () => {
      await controller.register(registerDto, res as Response);

      expect(clientProxyMock.send).toHaveBeenCalledWith(
        'register',
        registerDto,
      );
    });
    it('should return the same accessToken authClient.register returns', async () => {
      const receivedToken = await controller.register(
        registerDto,
        res as Response,
      );

      expect(receivedToken).toEqual({
        accessToken: expectedTokens.accessToken,
      });
    });
  });
  describe('Login', () => {
    let loginDto: LoginDto;

    beforeEach(() => {
      loginDto = {
        email: 'john@gmail.com',
        password: '123456',
      };

      reqCookiesMock.cookies = {
        refreshToken: expectedTokens.refreshToken,
      };
    });

    it('should call authClient.login', async () => {
      await controller.login(loginDto, res as Response);

      expect(clientProxyMock.send).toHaveBeenCalledWith('login', loginDto);
    });
    it('should return the same accessToken authClient.login returns', async () => {
      const receivedToken = await controller.login(loginDto, res as Response);

      expect(receivedToken).toEqual({
        accessToken: expectedTokens.accessToken,
      });
    });
  });
  describe('Refresh', () => {
    it('should call authClient.refresh with the provided refresh token ', async () => {
      await controller.refresh(
        reqCookiesMock as RequestWithCookies,
        res as Response,
      );

      expect(clientProxyMock.send).toHaveBeenCalledWith('refresh', {
        refreshToken: expectedTokens.refreshToken,
      });
    });
    it('should return the same accessToken authClient.refresh returns', async () => {
      const { accessToken } = await controller.refresh(
        reqCookiesMock as RequestWithCookies,
        res as Response,
      );

      expect(accessToken).toBe(expectedTokens.accessToken);
    });
  });
});

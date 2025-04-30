import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { UsersService } from './users';
import { TokenService } from './token';
import { PrismaService } from '@app/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto';
import { Response } from 'express';
import { RequestWithCookies } from '@app/common/interfaces';

describe('UsersController', () => {
  let controller: AuthController;
  let usersServiceMock: DeepMockProxy<UsersService>;
  let tokenServiceMock: DeepMockProxy<TokenService>;
  let prismaServiceMock: DeepMockProxy<PrismaService>;
  let authServiceMock: DeepMockProxy<AuthService>;

  let reqCookiesMock: DeepMockProxy<RequestWithCookies>;

  const expectedTokens = {
    accessToken: 'accessToken',
    refreshToken: 'refreshToken',
  };

  const res: Partial<Response> = {
    cookie: jest.fn().mockReturnThis(),
    status: jest.fn().mockImplementation().mockReturnValue(200),
    send: jest.fn().mockReturnThis(),
  } as unknown as Response;

  beforeEach(async () => {
    usersServiceMock = mockDeep<UsersService>();
    tokenServiceMock = mockDeep<TokenService>();
    prismaServiceMock = mockDeep<PrismaService>();
    authServiceMock = mockDeep<AuthService>();

    reqCookiesMock = mockDeep<RequestWithCookies>();

    authServiceMock.register.mockResolvedValue(expectedTokens);
    tokenServiceMock.signTokens.mockReturnValue(expectedTokens);
    authServiceMock.login.mockResolvedValue(expectedTokens);

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        await ConfigModule.forRoot({
          isGlobal: true,
        }),
        JwtModule.register({}),
      ],
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: UsersService, useValue: usersServiceMock },
        { provide: TokenService, useValue: tokenServiceMock },
        { provide: PrismaService, useValue: prismaServiceMock },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('Register', () => {
    const registerDto: RegisterDto = {
      name: 'john',
      email: 'john@gmail.com',
      password: '123456',
    };

    it('should call authService.register', async () => {
      await controller.register(registerDto, res as Response);
      expect(authServiceMock.register).toHaveBeenCalledWith(registerDto);
    });
    it('should return the same accessToken authService.register returns', async () => {
      const controllerResult = await controller.register(
        registerDto,
        res as Response,
      );
      expect(controllerResult.accessToken).toEqual(expectedTokens.accessToken);
    });
  });

  describe('Login', () => {
    const loginDto: LoginDto = {
      email: 'john@gmail.com',
      password: '123456',
    };
    it('should call authService.login ', async () => {
      await controller.login(loginDto, res as Response);
      expect(authServiceMock.login).toHaveBeenCalledWith(loginDto);
    });
    it('should return the same accessToken authService.login returns', async () => {
      const { accessToken } = await controller.login(loginDto, res as Response);
      expect(accessToken).toBe(expectedTokens.accessToken);
    });
  });

  describe('Refresh', () => {
    beforeEach(() => {
      authServiceMock.refresh.mockResolvedValue(expectedTokens);
      reqCookiesMock.cookies = {
        refreshToken: expectedTokens.refreshToken,
      };
    });

    it('should call authService.refresh with the provided refresh token ', async () => {
      await controller.refresh(reqCookiesMock, res as Response);

      expect(authServiceMock.refresh).toHaveBeenCalledWith(
        expectedTokens.refreshToken,
      );
    });
    it('should return the same accessToken authService.refresh returns', async () => {
      const { accessToken } = await controller.refresh(
        reqCookiesMock,
        res as Response,
      );

      expect(accessToken).toBe(expectedTokens.accessToken);
    });
  });
});

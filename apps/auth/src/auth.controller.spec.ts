import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { UsersService } from './users';
import { TokenService } from './token';
import { LoginPayload, PrismaService, RegisterPayload } from '@app/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { firstValueFrom } from 'rxjs';

describe('AuthController', () => {
  let controller: AuthController;
  let usersServiceMock: DeepMockProxy<UsersService>;
  let tokenServiceMock: DeepMockProxy<TokenService>;
  let prismaServiceMock: DeepMockProxy<PrismaService>;
  let authServiceMock: DeepMockProxy<AuthService>;

  const expectedTokens = {
    accessToken: 'accessToken',
    refreshToken: 'refreshToken',
  };

  beforeEach(async () => {
    usersServiceMock = mockDeep<UsersService>();
    tokenServiceMock = mockDeep<TokenService>();
    prismaServiceMock = mockDeep<PrismaService>();
    authServiceMock = mockDeep<AuthService>();

    authServiceMock.register.mockResolvedValue(expectedTokens);
    tokenServiceMock.signTokens.mockReturnValue(expectedTokens);
    authServiceMock.login.mockResolvedValue(expectedTokens);

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        await ConfigModule.forRoot({ isGlobal: true }),
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
    const registerDto: RegisterPayload = {
      name: 'john',
      email: 'john@gmail.com',
      password: '123456',
    };

    it('should call authService.register', async () => {
      await controller.register(registerDto);

      expect(authServiceMock.register).toHaveBeenCalledWith(registerDto);
    });

    it('should return accessToken from authService.register', async () => {
      const { accessToken } = await firstValueFrom(
        await controller.register(registerDto),
      );

      expect(accessToken).toBe(expectedTokens.accessToken);
    });
  });

  describe('Login', () => {
    const loginPayload: LoginPayload = {
      email: 'john@gmail.com',
      password: '123456',
    };

    it('should call authService.login', async () => {
      await controller.login(loginPayload);

      expect(authServiceMock.login).toHaveBeenCalledWith(loginPayload);
    });

    it('should return accessToken from authService.login', async () => {
      const { accessToken } = await firstValueFrom(
        await controller.login(loginPayload),
      );

      expect(accessToken).toBe(expectedTokens.accessToken);
    });
  });

  describe('Refresh', () => {
    beforeEach(() => {
      authServiceMock.refresh.mockResolvedValue(expectedTokens);
    });

    it('should call authService.refresh with refreshToken', async () => {
      await controller.refresh({ refreshToken: expectedTokens.refreshToken });

      expect(authServiceMock.refresh).toHaveBeenCalledWith(
        expectedTokens.refreshToken,
      );
    });

    it('should return accessToken from authService.refresh', async () => {
      const { accessToken } = await controller.refresh({
        refreshToken: expectedTokens.refreshToken,
      });

      expect(accessToken).toBe(expectedTokens.accessToken);
    });
  });
});

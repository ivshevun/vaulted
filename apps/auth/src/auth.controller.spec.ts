import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { UsersService } from './users';
import { TokenService } from './token';
import { PrismaService } from '@app/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto';
import { Response } from 'express';

describe('UsersController', () => {
  let controller: AuthController;
  let usersServiceMock: DeepMockProxy<UsersService>;
  let tokenServiceMock: DeepMockProxy<TokenService>;
  let prismaServiceMock: DeepMockProxy<PrismaService>;
  let authServiceMock: DeepMockProxy<AuthService>;

  const tokens = {
    accessToken: 'accessToken',
    refreshToken: 'refreshToken',
  };

  beforeEach(async () => {
    usersServiceMock = mockDeep<UsersService>();
    tokenServiceMock = mockDeep<TokenService>();
    prismaServiceMock = mockDeep<PrismaService>();
    authServiceMock = mockDeep<AuthService>();

    authServiceMock.register.mockResolvedValue(tokens);

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
    const res: Partial<Response> = {
      cookie: jest.fn().mockReturnThis(),
      status: jest.fn().mockImplementation().mockReturnValue(200),
      send: jest.fn().mockReturnThis(),
    } as unknown as Response;

    const registerDto: RegisterDto = {
      name: 'john',
      email: 'john@gmail.com',
      password: '123456',
    };

    it('should call authService.register', async () => {
      await controller.register(registerDto, res as Response);
      expect(authServiceMock.register).toHaveBeenCalledWith(registerDto);
    });
    it('should return the same authService.register returns', async () => {
      const controllerResult = await controller.register(
        registerDto,
        res as Response,
      );
      expect(controllerResult.accessToken).toEqual(tokens.accessToken);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from './users';
import { TokenService } from './token';
import { PrismaService, UserDto } from '@app/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { LoginDto, RegisterDto } from './dto';
import { v4 as uuid } from 'uuid';
import { User } from '@prisma/client';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let usersServiceMock: DeepMockProxy<UsersService>;
  let tokenServiceMock: DeepMockProxy<TokenService>;
  let prismaServiceMock: DeepMockProxy<PrismaService>;

  const registerDto: RegisterDto = {
    name: 'john',
    email: 'john@gmail.com',
    password: '123456',
  };
  const user: User = {
    ...registerDto,
    id: uuid(),
    createdAt: new Date(),
    updatedAt: new Date(),
    password:
      '$argon2id$v=19$m=65536,t=3,p=4$FxjENYPL4/hh7lduLnH0xQ$DC7fmLxWf3tKUXnq2mMfwPfJg61I2uSUKDOO3qglPNQ',
  };
  const expectedTokens = {
    accessToken: 'accessToken',
    refreshToken: 'refreshToken',
  };

  beforeEach(async () => {
    usersServiceMock = mockDeep<UsersService>();
    tokenServiceMock = mockDeep<TokenService>();
    prismaServiceMock = mockDeep<PrismaService>();

    tokenServiceMock.signTokens.mockReturnValue(expectedTokens);

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        await ConfigModule.forRoot({
          isGlobal: true,
        }),
        JwtModule.register({}),
      ],
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersServiceMock },
        { provide: TokenService, useValue: tokenServiceMock },
        { provide: PrismaService, useValue: prismaServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('Register', () => {
    it('should create a user and return JWT tokens', async () => {
      usersServiceMock.findByEmail.mockResolvedValue(null);
      usersServiceMock.create.mockResolvedValue(user);

      const accessToken = await service.register(registerDto);

      expect(usersServiceMock.create).toHaveBeenCalledWith(registerDto);
      expect(usersServiceMock.findByEmail).toHaveBeenCalledWith(
        registerDto.email,
      );
      expect(tokenServiceMock.signTokens).toHaveBeenCalledWith(
        new UserDto(user),
      );
      expect(accessToken).toBeDefined();
    });
    it('should throw a conflict exception if user already exists', async () => {
      usersServiceMock.findByEmail.mockResolvedValue(user);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('Login', () => {
    const loginDto: LoginDto = {
      email: registerDto.email,
      password: registerDto.password,
    };

    it('should successfully login and return access token', async () => {
      usersServiceMock.findByEmail.mockResolvedValue(user);

      const tokens = await service.login(loginDto);

      expect(tokens).toEqual(expectedTokens);
    });
    it('should throw an unauthorized exception if user is not found', async () => {
      usersServiceMock.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
    it('should throw an unauthorized exception if user password is not valid', async () => {
      const invalidPasswordDto: LoginDto = {
        email: loginDto.email,
        password: 'incorrect_password',
      };

      usersServiceMock.findByEmail.mockResolvedValue(user);

      await expect(service.login(invalidPasswordDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('Refresh', () => {
    it('should return accessToken if refreshToken is valid', async () => {
      tokenServiceMock.verifyToken.mockResolvedValue(new UserDto(user));

      const accessToken = await service.refresh(expectedTokens.refreshToken);

      expect(accessToken).toBeDefined();
    });
    it('should throw an unauthorized exception if refresh token is not set', async () => {
      await expect(service.refresh(null)).rejects.toThrow(
        UnauthorizedException,
      );
    });
    it('should throw an unauthorized exception if refresh token is invalid', async () => {
      tokenServiceMock.verifyToken.mockImplementation(() => {
        throw new UnauthorizedException('Invalid refresh token');
      });

      await expect(service.refresh('invalid-refresh')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});

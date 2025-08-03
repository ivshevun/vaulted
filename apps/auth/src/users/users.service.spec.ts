import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { RegisterDto } from '@app/common';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/auth-client';
import { v4 as uuidv4 } from 'uuid';
import argon from 'argon2';
import { PrismaService } from '../prisma';

describe('UsersService', () => {
  let service: UsersService;
  let prismaMock: DeepMockProxy<PrismaClient>;

  const registerDto: RegisterDto = {
    name: 'test-name',
    email: 'test@test.com',
    password: 'password',
  };
  const fakeHash =
    '$argon2id$v=19$m=65536,t=3,p=4$ucx3x7I+UzUZOXjA/+/k1Q$05X84kD4nm7mdKo22fsrRIyUfSHfxT6AXQ9ZB+TlDFM';
  const userMockWithHashedPassword = {
    ...registerDto,
    id: uuidv4(),
    createdAt: new Date(),
    updatedAt: new Date(),
    password: fakeHash,
    files: [],
  };

  beforeEach(async () => {
    prismaMock = mockDeep<PrismaClient>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('create', () => {
    it('should create a user with a hashed password', async () => {
      prismaMock.user.create.mockResolvedValue(userMockWithHashedPassword);

      const argonSpy = jest
        .spyOn(argon, 'hash')
        .mockImplementation(async () => Promise.resolve(fakeHash));

      await service.create(registerDto);

      const prismaCalledData = expect.objectContaining({
        name: registerDto.name,
        email: registerDto.email,
        password: fakeHash,
      }) as RegisterDto;

      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: prismaCalledData,
      });
      expect(argonSpy).toHaveBeenCalled();
    });
  });

  describe('findByEmail', () => {
    it('should find a user by an email', async () => {
      prismaMock.user.findUnique.mockResolvedValue(userMockWithHashedPassword);

      const user = await service.findByEmail(registerDto.email);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: {
          email: registerDto.email,
        },
      });
      expect(user).toEqual(userMockWithHashedPassword);
    });
    it('should return null if there is no user with provided email', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const user = await service.findByEmail('randomemail@test.com');

      expect(user).toBeNull();
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '@app/common';
import { RegisterDto } from '../dto';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import argon from 'argon2';

describe('UsersService', () => {
  let service: UsersService;

  const registerDto: RegisterDto = {
    name: 'test-name',
    email: 'test@test.com',
    password: 'password',
  };
  const userMock = {
    id: uuidv4(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...registerDto,
  };
  let prismaMock: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    prismaMock = mockDeep<PrismaClient>();
    prismaMock.user.create.mockResolvedValue(userMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should create user with a hashed password', async () => {
    const fakeHash =
      '$argon2id$v=19$m=65536,t=3,p=4$ucx3x7I+UzUZOXjA/+/k1Q$05X84kD4nm7mdKo22fsrRIyUfSHfxT6AXQ9ZB+TlDFM';
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

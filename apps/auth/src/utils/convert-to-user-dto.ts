import { User } from '@prisma/auth-client';
import { UserDto } from '@app/common';

export function convertToUserDto(user: User): UserDto {
  return {
    id: user.id,
    email: user.email,
  };
}

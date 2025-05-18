import { Request } from 'express';
import { UserDto } from '@app/common';

export interface RequestWithUser extends Request {
  user: UserDto;
}

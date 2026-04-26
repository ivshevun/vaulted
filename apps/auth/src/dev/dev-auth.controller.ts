import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AUTH_DEV_GET_USER } from '@app/common/constants';
import { DevAuthService } from './dev-auth.service';

@Controller()
export class DevAuthController {
  constructor(private readonly devAuthService: DevAuthService) {}

  @MessagePattern(AUTH_DEV_GET_USER)
  getUser(@Payload() { email }: { email: string }) {
    return this.devAuthService.findByEmail(email);
  }
}

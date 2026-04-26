import { Module } from '@nestjs/common';
import { UsersModule } from '@apps/auth/src/users/src/users.module';
import { DevAuthController } from './dev-auth.controller';
import { DevAuthService } from './dev-auth.service';

@Module({
  imports: [UsersModule],
  controllers: [DevAuthController],
  providers: [DevAuthService],
})
export class DevAuthModule {}

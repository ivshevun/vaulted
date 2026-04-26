import { Module } from '@nestjs/common';
import { DevAuthModule } from './auth/dev-auth.module';
import { DevFilesModule } from './files/dev-files.module';

@Module({
  imports: [DevAuthModule, DevFilesModule],
})
export class DevModule {}

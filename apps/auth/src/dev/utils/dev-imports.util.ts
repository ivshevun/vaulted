import { isDevEnv } from '@app/common';
import { DevAuthModule } from '../dev-auth.module';

export function devImports(env: string | undefined) {
  return isDevEnv(env) ? [DevAuthModule] : [];
}

import { isDevEnv } from '@app/common';
import { DevModule } from '../dev.module';

export function devImports(env: string | undefined) {
  return isDevEnv(env) ? [DevModule] : [];
}

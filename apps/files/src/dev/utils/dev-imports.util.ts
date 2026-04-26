import { isDevEnv } from '@app/common';
import { DevFilesModule } from '../dev-files.module';

export function devImports(env: string | undefined) {
  return isDevEnv(env) ? [DevFilesModule] : [];
}

import { RmqContext } from '@nestjs/microservices';

export const makeRmqContext = (xDeathCount?: number): RmqContext => {
  const headers =
    xDeathCount !== undefined ? { 'x-death': [{ count: xDeathCount }] } : {};

  return {
    getMessage: () => ({ properties: { headers } }),
  } as unknown as RmqContext;
};

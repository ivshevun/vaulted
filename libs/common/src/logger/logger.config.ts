import { Params } from 'nestjs-pino';

export const pinoConfig: Params = {
  pinoHttp: {
    transport:
      process.env.NODE_ENV !== 'production'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              singleLine: true,
              translateTime: 'SYS:yyyy-MM-dd HH:mm:ss',
            },
          }
        : undefined,
  },
};

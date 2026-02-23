import { Params } from 'nestjs-pino';

export const pinoConfig: Params = {
  pinoHttp: {
    timestamp: () =>
      `,"time":"${new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kiev' })}"`,
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

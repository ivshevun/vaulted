import { Params } from 'nestjs-pino';

export const pinoConfig: Params = {
  pinoHttp: {
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    transport:
      process.env.NODE_ENV !== 'production'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              singleLine: true,
              translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
              messageFormat:
                '{req.method} {req.url} {res.statusCode} - {responseTime}ms | {msg}',
              ignore: 'pid,hostname,req,res',
            },
          }
        : undefined,
  },
};

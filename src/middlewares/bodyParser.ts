import { Request, Response, NextFunction, Middleware } from '../app';

export function jsonBodyParser(): Middleware {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (
      req.method === 'POST' ||
      req.method === 'PUT' ||
      req.method === 'PATCH'
    ) {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          req.body = JSON.parse(body || '{}');
          next();
        } catch (error) {
          next(error);
        }
      });
    } else {
      next();
    }
  };
}

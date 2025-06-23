import { Request, Response, NextFunction, Middleware } from '../app';

export function jsonBodyParser(): Middleware {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (
      !['POST', 'PUT', 'PATCH'].includes(req.method!) ||
      req.headers['content-length'] === '0'
    ) {
      return next();
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        req.body = body ? JSON.parse(body) : '{}';
        next();
      } catch (error) {
        next(error);
      }
    });

    req.on('error', (err) => {
      next(err);
    });
  };
}

import { Middleware, RouteHandler } from './app';

interface RouterRoute {
  method: string;
  path: string;
  handlers: (Middleware | RouteHandler)[];
}

export class Router {
  private routes: RouterRoute[] = [];
  private middlewares: Middleware[] = [];

  use(path: string | Middleware, handler?: Middleware) {
    if (typeof path === 'string' && handler) {
      this.middlewares.push((req, res, next) => {
        const urlPath = new URL(req.url || '/', `http://${req.headers.host}`)
          .pathname;
        if (urlPath.startsWith(path)) {
          handler(req, res, next);
        } else {
          next();
        }
      });
    } else if (typeof path === 'function') {
      this.middlewares.push(path as Middleware);
    }
  }

  get(path: string, ...handlers: (Middleware | RouteHandler)[]): void {
    this.routes.push({ method: 'GET', path, handlers });
  }

  post(path: string, ...handlers: (Middleware | RouteHandler)[]): void {
    this.routes.push({ method: 'POST', path, handlers });
  }

  put(path: string, ...handlers: (Middleware | RouteHandler)[]): void {
    this.routes.push({ method: 'PUT', path, handlers });
  }

  delete(path: string, ...handlers: (Middleware | RouteHandler)[]): void {
    this.routes.push({ method: 'DELETE', path, handlers });
  }

  getRoutesAndMiddlewares(): {
    routes: RouterRoute[];
    middlewares: Middleware[];
  } {
    return { routes: this.routes, middlewares: this.middlewares };
  }
}

export function createRouter(): Router {
  return new Router();
}

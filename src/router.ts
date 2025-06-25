import { Middleware, Route, RouteHandler } from './types';
import { pathToRegex } from './utils/path-utils';

export class Router {
  private routes: Route[] = [];
  private middlewares: Middleware[] = [];

  use(path: string | Middleware, handler?: Middleware): void {
    if (typeof path === 'string' && handler) {
      this.middlewares.push((_req, _res, next) => {
        next();
      });
    } else if (typeof path === 'function') {
      this.middlewares.push(path as Middleware);
    }
  }

  private addRoute(
    method: string,
    path: string,
    handlers: (Middleware | RouteHandler)[]
  ): void {
    const { regex, paramNames } = pathToRegex(path);
    this.routes.push({
      method,
      path: regex,
      originalPath: path,
      handlers,
      paramNames: paramNames || [],
    });
  }

  get(path: string, ...handlers: (Middleware | RouteHandler)[]): void {
    this.addRoute('GET', path, handlers);
  }

  post(path: string, ...handlers: (Middleware | RouteHandler)[]): void {
    this.addRoute('POST', path, handlers);
  }

  put(path: string, ...handlers: (Middleware | RouteHandler)[]): void {
    this.addRoute('PUT', path, handlers);
  }

  delete(path: string, ...handlers: (Middleware | RouteHandler)[]): void {
    this.addRoute('DELETE', path, handlers);
  }

  getRoutesAndMiddlewares(): {
    routes: Route[];
    middlewares: Middleware[];
  } {
    return { routes: this.routes, middlewares: this.middlewares };
  }
}

export function createRouter(): Router {
  return new Router();
}

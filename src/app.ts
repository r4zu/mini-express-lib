import http, { IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';

export type Request = IncomingMessage & {
  params?: Record<string, string>;
  query?: Record<string, string | string[]>;
  body?: any;
};
export type Response = ServerResponse & {
  json: (data: any) => void;
  send: (data: string | object) => void;
  status: (code: number) => Response;
};
export type NextFunction = (err?: any) => void | Promise<void>;
export type Middleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => void | Promise<void>;
export type RouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => void | Promise<void>;
export type ErrorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

interface Route {
  method: string;
  path: string | RegExp;
  handlers: (Middleware | RouteHandler)[];
}

export class Application {
  private routes: Route[] = [];
  private middlewares: Middleware[] = [];
  private errorHandlers: ErrorMiddleware[] = [];
  private server: http.Server;

  constructor() {
    this.server = http.createServer(this.handleRequest.bind(this));
  }

  use(path: string | Middleware, handler?: Middleware): void {
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

  listen(port: number, callback?: () => void): void {
    this.server.listen(port, callback);
  }

  setErrorHandler(handler: ErrorMiddleware): void {
    this.errorHandlers.push(handler);
  }

  private handleRequest(req: IncomingMessage, res: ServerResponse): void {
    const enhancedReq = req as Request;
    const enhancedRes = res as Response;

    this.enhanceResponse(enhancedRes);

    const urlPath = new URL(req.url || '/', `http://${req.headers.host}`)
      .pathname;
    const method = req.method?.toUpperCase();

    let matchedRoute: Route | undefined;
    let routeParams: Record<string, string> = {};

    for (const route of this.routes) {
      if (route.method === method) {
        const pathRegex = this.pathToRegex(route.path);
        const match = urlPath.match(pathRegex);
        if (match) {
          matchedRoute = route;
          routeParams = this.extractParams(route.path, match);
          break;
        }
      }
    }

    enhancedReq.params = routeParams;
    enhancedReq.query = this.parseQueryParams(req.url || '');

    const handlerStack: (Middleware | RouteHandler)[] = [
      ...this.middlewares,
      ...(matchedRoute ? matchedRoute.handlers : []),
    ];

    let index = 0;

    const processNext: NextFunction = async (err?: any) => {
      if (err) {
        return this.runErrorHandlers(err, enhancedReq, enhancedRes);
      }

      if (enhancedRes.headersSent) {
        return;
      }

      if (index < handlerStack.length) {
        const currentHandler = handlerStack[index++];
        try {
          await Promise.resolve(
            currentHandler(enhancedReq, enhancedRes, processNext)
          );
        } catch (handlerErr) {
          processNext(handlerErr);
        }
      } else {
        if (!enhancedRes.headersSent) {
          enhancedRes.writeHead(404, { 'content-type': 'text/plain' });
          enhancedRes.end('Not Found');
        }
      }
    };

    Promise.resolve(processNext()).catch((err: any) => {
      this.runErrorHandlers(err, enhancedReq, enhancedRes);
    });
  }

  private runErrorHandlers(err: any, req: Request, res: Response): void {
    let errorIndex = 0;
    const nextErrorMiddleware: NextFunction = (errorFromHandler?: any) => {
      if (errorFromHandler) {
        err = errorFromHandler;
      }
      if (errorIndex < this.errorHandlers.length) {
        const errorHandler = this.errorHandlers[errorIndex++];
        try {
          Promise.resolve(
            errorHandler(err, req, res, nextErrorMiddleware)
          ).catch((innerErr) => {
            console.log('Error within error handler:', innerErr);
            nextErrorMiddleware(innerErr);
          });
        } catch (syncErr) {
          console.error('Synchronous error within error handler:', syncErr);
          nextErrorMiddleware(syncErr);
        }
      } else {
        if (!res.headersSent) {
          res.writeHead(500, { 'content-type': 'text/plain' });
          res.end(`Internal Server Error: ${err?.message || 'Unknown error'}`);
          console.error(`Final Fallback Error: ${err?.stack || err}`);
        }
      }
    };
    nextErrorMiddleware(err);
  }

  private enhanceResponse(res: Response): void {
    res.json = (data: any) => {
      if (!res.headersSent) {
        res.writeHead(200, { 'content-type': 'application/json' });
      }
      res.end(JSON.stringify(data));
    };

    res.send = (data: string | object) => {
      if (!res.headersSent) {
        if (typeof data === 'object') {
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end(JSON.stringify(data));
        } else {
          res.writeHead(200, { 'content-type': 'text/html' });
          res.end(data);
        }
      }
    };

    res.status = (code: number) => {
      res.statusCode = code;
      return res;
    };
  }

  private pathToRegex(path: string | RegExp): RegExp {
    if (path instanceof RegExp) {
      return path;
    }
    const paramNames: string[] = [];
    const regexPath = path.replace(/:([a-zA-Z0-9_]+)/g, (match, paramName) => {
      paramNames.push(paramName);
      return '([^/]+)';
    });
    (this as any)._currentParamNames = paramNames;
    return new RegExp(`^${regexPath}/?$`);
  }

  private extractParams(
    path: string | RegExp,
    match: RegExpMatchArray
  ): Record<string, string> {
    const params: Record<string, string> = {};
    if (path instanceof RegExp) {
      return params;
    }
    const paramNames = (this as any)._currentParamNames || [];
    for (let i = 0; i < paramNames.length && i + 1 < match.length; i++) {
      params[paramNames[i]] = match[i + 1];
    }
    return params;
  }

  private parseQueryParams(url: string): Record<string, string | string[]> {
    const queryParams: Record<string, string | string[]> = {};
    const urlObj = new URL(url, 'http://example.com');
    urlObj.searchParams.forEach((value, key) => {
      if (queryParams[key]) {
        if (Array.isArray(queryParams[key])) {
          (queryParams[key] as string[]).push(value);
        } else {
          queryParams[key] = [queryParams[key] as string, value];
        }
      } else {
        queryParams[key] = value;
      }
    });
    return queryParams;
  }
}

export function createApplication(): Application {
  return new Application();
}

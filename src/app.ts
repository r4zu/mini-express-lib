import http, { IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';

import {
  ErrorMiddleware,
  Middleware,
  Request,
  Route,
  RouteHandler,
  NextFunction,
} from './types';
import { enhanceResponse } from './http-context';
import {
  extractParams,
  parseQueryParams,
  pathToRegex,
} from './utils/path-utils';
import {
  runErrorMiddlewareStack,
  runMiddlewareStack,
} from './middleware-runner';
import { Router } from './router';

export class Application {
  private routes: Route[] = [];
  private middlewares: Middleware[] = [];
  private errorHandlers: ErrorMiddleware[] = [];
  private server: http.Server;

  constructor() {
    this.server = http.createServer(this.handleRequest.bind(this));
  }

  use(arg1: string | Middleware | Router, arg2?: Middleware | Router): void {
    if (typeof arg1 === 'string') {
      const pathPrefix =
        arg1.endsWith('/') && arg1.length > 1 ? arg1.slice(0, -1) : arg1;

      if (typeof arg2 === 'function') {
        this.middlewares.push((req, res, next) => {
          const urlPath = new URL(req.url || '/', `http://${req.headers.host}`)
            .pathname;
          if (
            urlPath.startsWith(pathPrefix) ||
            (pathPrefix === '/' && urlPath === '/')
          ) {
            (arg2 as Middleware)(req, res, next);
          } else {
            next();
          }
        });
      } else if (arg2 instanceof Router) {
        const router = arg2;
        const { routes, middlewares } = router.getRoutesAndMiddlewares();

        middlewares.forEach((middleware) => {
          this.middlewares.push((req, res, next) => {
            const urlPath = new URL(
              req.url || '/',
              `http://${req.headers.host}`
            ).pathname;
            if (
              urlPath.startsWith(pathPrefix) ||
              (pathPrefix === '/' && urlPath === '/')
            ) {
              const originalUrl = req.url;
              const originalBaseUrl = (req as any).baseUrl || '';

              (req as any).baseUrl =
                originalBaseUrl === '/'
                  ? pathPrefix
                  : `${originalBaseUrl}${pathPrefix}`;
              req.url = urlPath.substring(pathPrefix.length) || '/';
              if (!req.url.startsWith('/')) req.url = '/' + req.url;

              return Promise.resolve(
                middleware(req, res, async (err?: any) => {
                  req.url = originalUrl;
                  (req as any).baseUrl = originalBaseUrl;
                  await next(err);
                })
              );
            } else {
              next();
            }
          });
        });

        routes.forEach((route) => {
          let routerPathSource = route.path.source;

          if (routerPathSource === '^\\/?$') {
            routerPathSource = '';
          } else {
            if (routerPathSource.startsWith('^'))
              routerPathSource = routerPathSource.slice(1);
            if (routerPathSource.endsWith('\\/?$'))
              routerPathSource = routerPathSource.slice(0, -4);
            else if (routerPathSource.endsWith('$'))
              routerPathSource = routerPathSource.slice(0, -1);
            if (routerPathSource.startsWith('\\/'))
              routerPathSource = routerPathSource.slice(2);
          }

          const normalizedPathPrefix = pathPrefix === '/' ? '' : pathPrefix;

          const finalCombinedPath = `${normalizedPathPrefix}${
            routerPathSource ? '/' + routerPathSource : ''
          }`;
          const finalRegex = pathToRegex(finalCombinedPath).regex;

          this.addRoute(
            route.method,
            finalRegex,
            route.handlers,
            route.paramNames
          );
        });
      }
    } else if (typeof arg1 === 'function') {
      this.middlewares.push(arg1 as Middleware);
    }
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

  listen(port: number, callback?: () => void): void {
    this.server.listen(port, callback);
  }

  setErrorHandler(handler: ErrorMiddleware): void {
    this.errorHandlers.push(handler);
  }

  private addRoute(
    method: string,
    path: string | RegExp,
    handlers: (Middleware | RouteHandler)[],
    paramNames?: string[]
  ): void {
    let finalPath: RegExp;
    let finalParamNames: string[];

    if (typeof path === 'string') {
      const { regex, paramNames: computedParamNames } = pathToRegex(path);
      finalPath = regex;
      finalParamNames = computedParamNames;
    } else {
      finalPath = path;
      finalParamNames = paramNames || [];
    }

    this.routes.push({
      method,
      path: finalPath,
      originalPath: typeof path === 'string' ? path : undefined,
      handlers,
      paramNames: finalParamNames || [],
    });
  }

  private handleRequest(rawReq: IncomingMessage, rawRes: ServerResponse): void {
    const req = rawReq as Request;
    const res = enhanceResponse(rawRes);

    const urlPath = new URL(req.url || '/', `http://${req.headers.host}`)
      .pathname;
    const method = req.method?.toUpperCase();

    let matchedRoute: Route | undefined;
    let routeParams: Record<string, string> = {};

    for (const route of this.routes) {
      if (route.method === method) {
        const match = urlPath.match(route.path);

        if (match) {
          matchedRoute = route;
          routeParams = extractParams(route.paramNames, match);
          break;
        }
      }
    }

    req.params = routeParams;
    req.query = parseQueryParams(req.url || '');

    const handlerStack: (Middleware | RouteHandler)[] = [
      ...this.middlewares,
      ...(matchedRoute ? matchedRoute.handlers : []),
    ];

    const handleError = (err: any) => {
      runErrorMiddlewareStack(this.errorHandlers, err, req, res);
    };

    runMiddlewareStack(handlerStack, req, res, handleError).catch((err) => {
      handleError(err);
    });
  }
}

export function createApplication(): Application {
  return new Application();
}

export {
  Request,
  Response,
  NextFunction,
  Middleware,
  RouteHandler,
  ErrorMiddleware,
} from './types';

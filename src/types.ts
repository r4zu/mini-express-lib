import http, { IncomingMessage, ServerResponse } from 'http';

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

export type NextFunction = (err?: any) => Promise<void>;

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

export interface Route {
  method: string;
  path: RegExp;
  originalPath?: string;
  handlers: (Middleware | RouteHandler)[];
  paramNames: string[];
}

export interface RouterRoute {
  method: string;
  path: string;
  handlers: (Middleware | RouteHandler)[];
}

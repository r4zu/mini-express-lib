import {
  ErrorMiddleware,
  Middleware,
  NextFunction,
  Request,
  Response,
  RouteHandler,
} from './types';

/**
 * Executes a stack of middlewares and route handlers sequentially.
 * Handles both synchronous and asynchronous functions.
 * Propagates errors to the next function in the stack.
 *
 * @param stack The array of middleware/handler functions to execute.
 * @param req The enhanced Request object.
 * @param res The enhanced Response object.
 * @param onError Callback to handle final errors if the stack finishes or an error occurs.
 * @returns A Promise that resolves when the stack finishes or an error is handled.
 */
export function runMiddlewareStack(
  stack: (Middleware | RouteHandler)[],
  req: Request,
  res: Response,
  onError: (err: any) => void
): Promise<void> {
  let index = 0;

  const next: NextFunction = async (err?: any) => {
    if (err) {
      return onError(err);
    }

    if (res.headersSent) {
      return;
    }

    if (index < stack.length) {
      const currentHandler = stack[index++];
      try {
        await Promise.resolve(currentHandler(req, res, next));
      } catch (handlerErr) {
        return next(handlerErr);
      }
    } else {
      if (!res.headersSent) {
        res.writeHead(404, { 'content-type': 'text/plain' });
        res.end('Not Found');
      }
    }
  };

  return Promise.resolve(next());
}

/**
 * Executes a stack of error middlewares.
 * @param errorHandlers The array of error middleware functions.
 * @param err The error object.
 * @param req The enhanced Request object.
 * @param res The enhanced Response object.
 */
export function runErrorMiddlewareStack(
  errorHandlers: ErrorMiddleware[],
  err: any,
  req: Request,
  res: Response
): void {
  let errorIndex = 0;

  const nextErrorMiddleware: NextFunction = async (errorFromHandler?: any) => {
    if (errorFromHandler) {
      err = errorFromHandler;
    }

    if (errorIndex < errorHandlers.length) {
      const errorHandler = errorHandlers[errorIndex++];
      try {
        Promise.resolve(errorHandler(err, req, res, nextErrorMiddleware)).catch(
          (innerErr) => {
            console.error('Error within error handler (async):', innerErr);
            nextErrorMiddleware(innerErr);
          }
        );
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

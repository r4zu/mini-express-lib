import { ServerResponse } from 'http';
import { Response } from './types';

/**
 * Enhances the native Node.js ServerResponse object with Express-like methods.
 * @param res The raw Node.js ServerResponse object.
 * @returns The enhanced Response object.
 */
export function enhanceResponse(res: ServerResponse): Response {
  const enhancedRes = res as Response;

  enhancedRes.json = (data: any) => {
    if (!res.headersSent) {
      enhancedRes.writeHead(enhancedRes.statusCode || 200, {
        'content-type': 'application/json',
      });
    }
    enhancedRes.end(JSON.stringify(data));
  };

  enhancedRes.send = (data: string | object) => {
    if (!enhancedRes.headersSent) {
      if (typeof data === 'object') {
        enhancedRes.writeHead(enhancedRes.statusCode || 200, {
          'content-type': 'application/json',
        });
        enhancedRes.end(JSON.stringify(data));
      } else {
        enhancedRes.writeHead(enhancedRes.statusCode || 200, {
          'content-type': 'text/html',
        });
        enhancedRes.end(data);
      }
    }
  };

  enhancedRes.status = (code: number) => {
    enhancedRes.statusCode = code;
    return enhancedRes;
  };

  return enhancedRes;
}

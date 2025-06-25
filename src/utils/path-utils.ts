/**
 * Converts an Express-style path string into a RegExp for matching.
 * Extracts parameter names in the process.
 * Handles optional parameters (e.g., /users/:id?) and wildcards (*).
 *
 * @param path The path string (e.g., "/users/:id", "/files/*", "/posts/:slug?").
 * @returns A tuple containing the RegExp and an array of parameter names.
 */
export function pathToRegex(path: string | RegExp): {
  regex: RegExp;
  paramNames: string[];
} {
  if (path instanceof RegExp) {
    return { regex: path, paramNames: [] };
  }

  const paramNames: string[] = [];
  let regexPath = path
    .replace(/[-[\]{}()+?.,\\^$|#\s]/g, '\\$&')
    .replace(/\*/g, '(.*)')
    .replace(/:([a-zA-Z0-9_]+)(\?)?/g, (_match, paramName, optional) => {
      paramNames.push(paramName);
      return optional ? '(?:\\/([^\\/]+?))?' : '\\/([^\\/]+?)';
    });

  if (path === '/') {
    return { regex: new RegExp('^\\/?$'), paramNames };
  }

  regexPath = `^${regexPath}(?:\\/)?$`;

  return { regex: new RegExp(regexPath), paramNames };
}

/**
 * Extracts parameter values from a URL path match.
 *
 * @param routePath The original route path string (e.g., "/users/:id").
 * @param match The RegExpMatchArray result from matching the URL against the route regex.
 * @returns An object with parameter names as keys and their values.
 */
export function extractParams(
  paramNames: string[],
  match: RegExpMatchArray
): Record<string, string> {
  const params: Record<string, string> = {};
  for (let i = 0; i < paramNames.length && i + 1 < match.length; i++) {
    if (match[i + 1] !== undefined) {
      params[paramNames[i]] = match[i + 1];
    }
  }
  return params;
}

/**
 * Parses query parameters from a URL string.
 *
 * @param url The full URL string.
 * @returns An object containing query parameters.
 */
export function parseQueryParams(
  url: string
): Record<string, string | string[]> {
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

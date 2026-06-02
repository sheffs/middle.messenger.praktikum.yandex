import {
  APIError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ServerError,
  NetworkError,
  TimeoutError,
} from './errors';

export enum Method {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
}

type RequestData = object | FormData;

interface RequestOptions {
  method?: Method;
  data?: RequestData;
  timeout?: number;
  headers?: Record<string, string>;
}

const BASE_URL = 'https://ya-praktikum.tech/api/v2';

function buildQuery(data: object): string {
  return Object.entries(data)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v as unknown))}`)
    .join('&');
}

function parseReason(responseText: string): string {
  try {
    return (JSON.parse(responseText) as { reason?: string }).reason ?? responseText;
  } catch {
    return responseText;
  }
}

export default class HTTPTransport {
  private readonly _prefix: string;

  constructor(prefix: string) {
    this._prefix = prefix;
  }

  public get<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return this._request<T>(path, { ...options, method: Method.GET });
  }

  public post<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return this._request<T>(path, { ...options, method: Method.POST });
  }

  public put<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return this._request<T>(path, { ...options, method: Method.PUT });
  }

  public delete<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return this._request<T>(path, { ...options, method: Method.DELETE });
  }

  private _request<T>(path: string, options: RequestOptions): Promise<T> {
    const { method = Method.GET, data, timeout = 10000, headers = {} } = options;
    const isFormData = data instanceof FormData;
    const isGet = method === Method.GET;

    let url = `${BASE_URL}${this._prefix}${path}`;
    if (isGet && data && !isFormData) {
      url += `?${buildQuery(data)}`;
    }

    return new Promise<T>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.withCredentials = true;
      xhr.timeout = timeout;

      if (!isFormData) {
        xhr.setRequestHeader('Content-Type', 'application/json');
      }
      for (const [key, value] of Object.entries(headers)) {
        xhr.setRequestHeader(key, value);
      }

      xhr.onload = (): void => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText) as T);
          } catch {
            resolve(xhr.responseText as unknown as T);
          }
          return;
        }

        const message = parseReason(xhr.responseText);

        if (xhr.status === 401) { reject(new UnauthorizedError(message)); }
        else if (xhr.status === 403) { reject(new ForbiddenError(message)); }
        else if (xhr.status === 404) { reject(new NotFoundError(message)); }
        else if (xhr.status >= 500) { reject(new ServerError(message)); }
        else { reject(new APIError(xhr.status, message)); }
      };

      xhr.onerror = (): void => reject(new NetworkError());
      xhr.ontimeout = (): void => reject(new TimeoutError());

      if (isGet || !data) {
        xhr.send();
      } else if (isFormData) {
        xhr.send(data);
      } else {
        xhr.send(JSON.stringify(data));
      }
    });
  }
}

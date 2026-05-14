export enum Method {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
}

type RequestData = Record<string, unknown> | FormData;

interface RequestOptions {
  method?: Method;
  data?: RequestData;
  timeout?: number;
  headers?: Record<string, string>;
}

const BASE_URL = 'https://ya-praktikum.tech/api/v2';

function buildQuery(data: Record<string, unknown>): string {
  return Object.entries(data)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
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
      url += `?${buildQuery(data as Record<string, unknown>)}`;
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
        } else {
          try {
            reject(JSON.parse(xhr.responseText) as unknown);
          } catch {
            reject({ reason: xhr.responseText });
          }
        }
      };

      xhr.onerror = (): void => reject({ reason: 'Network error' });
      xhr.ontimeout = (): void => reject({ reason: 'Request timeout' });

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

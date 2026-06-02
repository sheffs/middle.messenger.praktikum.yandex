import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import HTTPTransport, { Method } from './HTTPTransport';

interface MockXHR {
  open: ReturnType<typeof vi.fn>;
  send: ReturnType<typeof vi.fn>;
  setRequestHeader: ReturnType<typeof vi.fn>;
  onload: (() => void) | null;
  onerror: (() => void) | null;
  ontimeout: (() => void) | null;
  status: number;
  responseText: string;
  withCredentials: boolean;
  timeout: number;
}

function makeMockXHR(): MockXHR {
  return {
    open: vi.fn(),
    send: vi.fn(),
    setRequestHeader: vi.fn(),
    onload: null,
    onerror: null,
    ontimeout: null,
    status: 200,
    responseText: '{}',
    withCredentials: false,
    timeout: 0,
  };
}

describe('HTTPTransport', () => {
  let mockXHR: MockXHR;

  beforeEach(() => {
    mockXHR = makeMockXHR();
    vi.stubGlobal('XMLHttpRequest', vi.fn(function() { return mockXHR; }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('GET-запрос открывается с правильным методом', async () => {
    const http = new HTTPTransport('/test');
    const promise = http.get<unknown>('/path');
    mockXHR.status = 200;
    mockXHR.responseText = '{"ok":true}';
    mockXHR.onload?.();
    await promise;
    expect(mockXHR.open).toHaveBeenCalledWith(Method.GET, expect.stringContaining('/test/path'));
  });

  it('GET с data добавляет query-string', async () => {
    const http = new HTTPTransport('/q');
    const promise = http.get<unknown>('/search', { data: { query: 'hello' } });
    mockXHR.status = 200;
    mockXHR.responseText = '[]';
    mockXHR.onload?.();
    await promise;
    const url = (mockXHR.open as ReturnType<typeof vi.fn>).mock.calls[0][1] as string;
    expect(url).toContain('query=hello');
  });

  it('POST-запрос отправляет JSON-тело', async () => {
    const http = new HTTPTransport('/auth');
    const promise = http.post<unknown>('/signin', { data: { login: 'user', password: 'pass' } });
    mockXHR.status = 200;
    mockXHR.responseText = '{"id":1}';
    mockXHR.onload?.();
    await promise;
    expect(mockXHR.send).toHaveBeenCalledWith(JSON.stringify({ login: 'user', password: 'pass' }));
  });

  it('отклоняет промис с UnauthorizedError при статусе 401', async () => {
    const http = new HTTPTransport('/api');
    const promise = http.get<unknown>('/fail');
    mockXHR.status = 401;
    mockXHR.responseText = '{"reason":"Unauthorised"}';
    mockXHR.onload?.();
    await expect(promise).rejects.toMatchObject({ name: 'UnauthorizedError', status: 401, message: 'Unauthorised' });
  });

  it('отклоняет промис с NetworkError при сетевой ошибке', async () => {
    const http = new HTTPTransport('/api');
    const promise = http.get<unknown>('/err');
    mockXHR.onerror?.();
    await expect(promise).rejects.toMatchObject({ name: 'NetworkError' });
  });

  it('отклоняет промис с TimeoutError по таймауту', async () => {
    const http = new HTTPTransport('/api');
    const promise = http.get<unknown>('/slow');
    mockXHR.ontimeout?.();
    await expect(promise).rejects.toMatchObject({ name: 'TimeoutError' });
  });

  it('устанавливает withCredentials = true', async () => {
    const http = new HTTPTransport('/api');
    const promise = http.get<unknown>('/me');
    mockXHR.status = 200;
    mockXHR.responseText = '{}';
    mockXHR.onload?.();
    await promise;
    expect(mockXHR.withCredentials).toBe(true);
  });
});

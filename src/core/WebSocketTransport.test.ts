import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import WebSocketTransport from './WebSocketTransport';

/** Минимальный мок WebSocket для проверки логики транспорта без сети. */
class MockWebSocket {
  static readonly OPEN = 1;
  static readonly CLOSED = 3;
  static last: MockWebSocket | null = null;

  public readyState = MockWebSocket.OPEN;
  public sent: string[] = [];
  public url: string;
  private _listeners: Record<string, ((e: unknown) => void)[]> = {};

  constructor(url: string) {
    this.url = url;
    MockWebSocket.last = this;
  }

  addEventListener(type: string, cb: (e: unknown) => void): void {
    (this._listeners[type] ??= []).push(cb);
  }

  dispatch(type: string, event: unknown): void {
    this._listeners[type]?.forEach((cb) => cb(event));
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {
    this.readyState = MockWebSocket.CLOSED;
  }
}

describe('WebSocketTransport', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('WebSocket', MockWebSocket);
    MockWebSocket.last = null;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('connect открывает сокет по корректному URL', () => {
    const transport = new WebSocketTransport(1, 2, 'token');
    transport.connect();
    expect(MockWebSocket.last?.url).toBe('wss://ya-praktikum.tech/ws/chats/1/2/token');
  });

  it('при открытии запрашивает старые сообщения', () => {
    const transport = new WebSocketTransport(1, 2, 'token');
    transport.connect();
    MockWebSocket.last?.dispatch('open', null);
    expect(MockWebSocket.last?.sent).toContainEqual(JSON.stringify({ content: '0', type: 'get old' }));
  });

  it('sendMessage отправляет фрейм типа message при открытом сокете', () => {
    const transport = new WebSocketTransport(1, 2, 'token');
    transport.connect();
    transport.sendMessage('Привет');
    expect(MockWebSocket.last?.sent).toContainEqual(JSON.stringify({ content: 'Привет', type: 'message' }));
  });

  it('не отправляет сообщение при закрытом сокете', () => {
    const transport = new WebSocketTransport(1, 2, 'token');
    transport.connect();
    MockWebSocket.last!.readyState = MockWebSocket.CLOSED;
    transport.sendMessage('Привет');
    expect(MockWebSocket.last?.sent).toHaveLength(0);
  });

  it('парсит входящие сообщения и вызывает обработчик', () => {
    const transport = new WebSocketTransport(1, 2, 'token');
    const handler = vi.fn();
    transport.on('message', handler);
    transport.connect();
    MockWebSocket.last?.dispatch('message', { data: JSON.stringify({ content: 'hi' }) });
    expect(handler).toHaveBeenCalledWith({ content: 'hi' });
  });

  it('игнорирует не-JSON фреймы без падения', () => {
    const transport = new WebSocketTransport(1, 2, 'token');
    const handler = vi.fn();
    transport.on('message', handler);
    transport.connect();
    expect(() => MockWebSocket.last?.dispatch('message', { data: 'pong' })).not.toThrow();
    expect(handler).not.toHaveBeenCalled();
  });

  it('off отписывает обработчик', () => {
    const transport = new WebSocketTransport(1, 2, 'token');
    const handler = vi.fn();
    transport.on('message', handler);
    transport.off('message', handler);
    transport.connect();
    MockWebSocket.last?.dispatch('message', { data: JSON.stringify({ content: 'hi' }) });
    expect(handler).not.toHaveBeenCalled();
  });

  it('отправляет ping по интервалу после открытия', () => {
    const transport = new WebSocketTransport(1, 2, 'token');
    transport.connect();
    MockWebSocket.last?.dispatch('open', null);
    MockWebSocket.last!.sent = [];
    vi.advanceTimersByTime(30_000);
    expect(MockWebSocket.last?.sent).toContainEqual(JSON.stringify({ type: 'ping' }));
  });

  it('disconnect закрывает сокет и останавливает ping', () => {
    const transport = new WebSocketTransport(1, 2, 'token');
    transport.connect();
    MockWebSocket.last?.dispatch('open', null);
    transport.disconnect();
    expect(transport.isOpen()).toBe(false);
    MockWebSocket.last!.sent = [];
    vi.advanceTimersByTime(60_000);
    expect(MockWebSocket.last?.sent).toHaveLength(0);
  });
});

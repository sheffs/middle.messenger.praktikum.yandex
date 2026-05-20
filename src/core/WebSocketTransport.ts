type MessageHandler = (data: unknown) => void;

interface WSMessage {
  content: string;
  type: 'message' | 'get old';
}

export interface MessageAttachment {
  kind: 'image' | 'video';
  src: string;
  name: string;
}

export interface ChatMessage {
  id: number;
  user_id: number;
  chat_id: number;
  type: string;
  time: string;
  content: string;
  is_read: boolean;
  attachment?: MessageAttachment;
}

const WS_BASE = 'wss://ya-praktikum.tech/ws/chats';
const PING_INTERVAL_MS = 30_000;

export default class WebSocketTransport {
  private _ws: WebSocket | null = null;
  private _pingTimer: ReturnType<typeof setInterval> | null = null;
  private _handlers: Map<string, MessageHandler[]> = new Map();

  private readonly _userId: number;
  private readonly _chatId: number;
  private readonly _token: string;

  constructor(userId: number, chatId: number, token: string) {
    this._userId = userId;
    this._chatId = chatId;
    this._token = token;
  }

  public connect(): void {
    const url = `${WS_BASE}/${this._userId}/${this._chatId}/${this._token}`;
    this._ws = new WebSocket(url);

    this._ws.addEventListener('open', () => {
      this._startPing();
      this._emit('open', null);
      this.getOldMessages();
    });

    this._ws.addEventListener('message', (e: MessageEvent<string>) => {
      try {
        const data: unknown = JSON.parse(e.data);
        this._emit('message', data);
      } catch {
        /* non-JSON frame, ignore */
      }
    });

    this._ws.addEventListener('close', (e: CloseEvent) => {
      this._stopPing();
      this._emit('close', { wasClean: e.wasClean, code: e.code });
    });

    this._ws.addEventListener('error', () => {
      this._emit('error', { reason: 'WebSocket error' });
    });
  }

  public sendMessage(content: string): void {
    this._send({ content, type: 'message' });
  }

  public getOldMessages(from = 0): void {
    this._send({ content: String(from), type: 'get old' });
  }

  public disconnect(): void {
    this._stopPing();
    this._ws?.close();
    this._ws = null;
  }

  public isOpen(): boolean {
    return this._ws?.readyState === WebSocket.OPEN;
  }

  public on(event: string, handler: MessageHandler): void {
    const list = this._handlers.get(event) ?? [];
    this._handlers.set(event, [...list, handler]);
  }

  public off(event: string, handler: MessageHandler): void {
    const list = this._handlers.get(event) ?? [];
    this._handlers.set(event, list.filter((h) => h !== handler));
  }

  private _send(data: WSMessage): void {
    if (this._ws?.readyState !== WebSocket.OPEN) {return;}
    this._ws.send(JSON.stringify(data));
  }

  private _emit(event: string, data: unknown): void {
    this._handlers.get(event)?.forEach((h) => h(data));
  }

  private _startPing(): void {
    this._pingTimer = setInterval(() => {
      if (this._ws?.readyState === WebSocket.OPEN) {
        this._ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, PING_INTERVAL_MS);
  }

  private _stopPing(): void {
    if (this._pingTimer !== null) {
      clearInterval(this._pingTimer);
      this._pingTimer = null;
    }
  }
}

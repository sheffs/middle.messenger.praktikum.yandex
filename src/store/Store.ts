import type { User, Chat } from '../types';

export interface AppState {
  user: User | null;
  chats: Chat[];
  activeChat: number | null;
  isLoading: boolean;
  error: string | null;
}

type Subscriber = (state: AppState) => void;

const INITIAL_STATE: AppState = {
  user: null,
  chats: [],
  activeChat: null,
  isLoading: false,
  error: null,
};

export default class Store {
  private static _instance: Store;
  private _state: AppState = { ...INITIAL_STATE };
  private _subscribers: Set<Subscriber> = new Set();

  private constructor() {}

  public static getInstance(): Store {
    if (!Store._instance) {
      Store._instance = new Store();
    }
    return Store._instance;
  }

  public getState(): Readonly<AppState> {
    return this._state;
  }

  public setState(partial: Partial<AppState>): void {
    this._state = { ...this._state, ...partial };
    this._notify();
  }

  public subscribe(cb: Subscriber): () => void {
    this._subscribers.add(cb);
    return (): void => { this._subscribers.delete(cb); };
  }

  private _notify(): void {
    this._subscribers.forEach((cb) => cb(this._state));
  }
}

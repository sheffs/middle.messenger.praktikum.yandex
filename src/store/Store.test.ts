import { describe, it, expect, vi } from 'vitest';
import Store from './Store';

describe('Store', () => {
  it('является синглтоном', () => {
    expect(Store.getInstance()).toBe(Store.getInstance());
  });

  it('setState частично обновляет состояние', () => {
    const store = Store.getInstance();
    store.setState({ isLoading: true });
    expect(store.getState().isLoading).toBe(true);
    store.setState({ error: 'boom' });
    expect(store.getState().error).toBe('boom');
    expect(store.getState().isLoading).toBe(true);
  });

  it('уведомляет подписчиков при изменении состояния', () => {
    const store = Store.getInstance();
    const cb = vi.fn();
    store.subscribe(cb);
    store.setState({ activeChat: 42 });
    expect(cb).toHaveBeenCalledWith(expect.objectContaining({ activeChat: 42 }));
  });

  it('отписка прекращает уведомления', () => {
    const store = Store.getInstance();
    const cb = vi.fn();
    const unsubscribe = store.subscribe(cb);
    unsubscribe();
    store.setState({ activeChat: 7 });
    expect(cb).not.toHaveBeenCalled();
  });
});

import { describe, it, expect, vi } from 'vitest';
import EventBus from './EventBus';

describe('EventBus', () => {
  it('вызывает подписанный обработчик', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on('test', handler);
    bus.emit('test', 1, 2);
    expect(handler).toHaveBeenCalledWith(1, 2);
  });

  it('вызывает нескольких подписчиков', () => {
    const bus = new EventBus();
    const h1 = vi.fn();
    const h2 = vi.fn();
    bus.on('test', h1);
    bus.on('test', h2);
    bus.emit('test');
    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);
  });

  it('отписывает конкретный обработчик', () => {
    const bus = new EventBus();
    const h1 = vi.fn();
    const h2 = vi.fn();
    bus.on('test', h1);
    bus.on('test', h2);
    bus.off('test', h1);
    bus.emit('test');
    expect(h1).not.toHaveBeenCalled();
    expect(h2).toHaveBeenCalledTimes(1);
  });

  it('бросает ошибку при emit несуществующего события', () => {
    const bus = new EventBus();
    expect(() => bus.emit('unknown')).toThrow();
  });

  it('бросает ошибку при off несуществующего события', () => {
    const bus = new EventBus();
    expect(() => bus.off('unknown', vi.fn())).toThrow();
  });

  it('не вызывает обработчик после отписки', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on('ev', handler);
    bus.off('ev', handler);
    bus.emit('ev');
    expect(handler).not.toHaveBeenCalled();
  });
});

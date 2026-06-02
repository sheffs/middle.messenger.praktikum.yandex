import { describe, it, expect, beforeEach } from 'vitest';
import { Stack, Queue } from './structures';

// ─── Stack ───────────────────────────────────────────────────────────────────

describe('Stack', () => {
  let stack: Stack<number>;

  beforeEach(() => {
    stack = new Stack<number>();
  });

  it('starts empty', () => {
    expect(stack.isEmpty()).toBe(true);
    expect(stack.size).toBe(0);
  });

  it('push increases size', () => {
    stack.push(1);
    stack.push(2);
    expect(stack.size).toBe(2);
    expect(stack.isEmpty()).toBe(false);
  });

  it('pop returns LIFO order', () => {
    stack.push(1);
    stack.push(2);
    stack.push(3);
    expect(stack.pop()).toBe(3);
    expect(stack.pop()).toBe(2);
    expect(stack.pop()).toBe(1);
  });

  it('pop on empty stack returns undefined', () => {
    expect(stack.pop()).toBeUndefined();
  });

  it('peek returns top without removing', () => {
    stack.push(10);
    stack.push(20);
    expect(stack.peek()).toBe(20);
    expect(stack.size).toBe(2);
  });

  it('peek on empty stack returns undefined', () => {
    expect(stack.peek()).toBeUndefined();
  });

  it('clear empties the stack', () => {
    stack.push(1);
    stack.push(2);
    stack.clear();
    expect(stack.isEmpty()).toBe(true);
    expect(stack.size).toBe(0);
  });
});

// ─── Queue ───────────────────────────────────────────────────────────────────

describe('Queue', () => {
  let queue: Queue<string>;

  beforeEach(() => {
    queue = new Queue<string>();
  });

  it('starts empty', () => {
    expect(queue.isEmpty()).toBe(true);
    expect(queue.size).toBe(0);
  });

  it('enqueue increases size', () => {
    queue.enqueue('a');
    queue.enqueue('b');
    expect(queue.size).toBe(2);
    expect(queue.isEmpty()).toBe(false);
  });

  it('dequeue returns FIFO order', () => {
    queue.enqueue('first');
    queue.enqueue('second');
    queue.enqueue('third');
    expect(queue.dequeue()).toBe('first');
    expect(queue.dequeue()).toBe('second');
    expect(queue.dequeue()).toBe('third');
  });

  it('dequeue on empty queue returns undefined', () => {
    expect(queue.dequeue()).toBeUndefined();
  });

  it('peek returns front without removing', () => {
    queue.enqueue('x');
    queue.enqueue('y');
    expect(queue.peek()).toBe('x');
    expect(queue.size).toBe(2);
  });

  it('peek on empty queue returns undefined', () => {
    expect(queue.peek()).toBeUndefined();
  });

  it('interleaved enqueue/dequeue preserves order', () => {
    queue.enqueue('a');
    queue.enqueue('b');
    expect(queue.dequeue()).toBe('a');
    queue.enqueue('c');
    expect(queue.dequeue()).toBe('b');
    expect(queue.dequeue()).toBe('c');
    expect(queue.isEmpty()).toBe(true);
  });

  it('clear empties the queue', () => {
    queue.enqueue('a');
    queue.enqueue('b');
    queue.clear();
    expect(queue.isEmpty()).toBe(true);
    expect(queue.size).toBe(0);
  });
});

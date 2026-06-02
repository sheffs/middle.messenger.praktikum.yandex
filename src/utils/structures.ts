export class Stack<T> {
  private _items: T[] = [];

  push(item: T): void {
    this._items.push(item);
  }

  pop(): T | undefined {
    return this._items.pop();
  }

  peek(): T | undefined {
    return this._items[this._items.length - 1];
  }

  isEmpty(): boolean {
    return this._items.length === 0;
  }

  get size(): number {
    return this._items.length;
  }

  clear(): void {
    this._items = [];
  }
}

export class Queue<T> {
  private _head: T[] = [];
  private _tail: T[] = [];

  enqueue(item: T): void {
    this._tail.push(item);
  }

  dequeue(): T | undefined {
    if (this._head.length === 0) {
      this._head = this._tail.reverse();
      this._tail = [];
    }
    return this._head.pop();
  }

  peek(): T | undefined {
    if (this._head.length > 0) {
      return this._head[this._head.length - 1];
    }
    return this._tail[0];
  }

  isEmpty(): boolean {
    return this._head.length === 0 && this._tail.length === 0;
  }

  get size(): number {
    return this._head.length + this._tail.length;
  }

  clear(): void {
    this._head = [];
    this._tail = [];
  }
}

type EventCallback = (...args: unknown[]) => void;

export default class EventBus {
  private listeners: Map<string, EventCallback[]> = new Map();

  on(event: string, callback: EventCallback): void {
    const existing = this.listeners.get(event) ?? [];
    this.listeners.set(event, [...existing, callback]);
  }

  off(event: string, callback: EventCallback): void {
    const existing = this.listeners.get(event);
    if (!existing) {
      throw new Error(`No listeners for event: ${event}`);
    }
    this.listeners.set(
      event,
      existing.filter((cb) => cb !== callback),
    );
  }

  emit(event: string, ...args: unknown[]): void {
    const existing = this.listeners.get(event);
    if (!existing) {
      throw new Error(`No listeners for event: ${event}`);
    }
    existing.forEach((cb) => cb(...args));
  }
}

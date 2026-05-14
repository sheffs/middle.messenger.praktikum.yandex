import { describe, it, expect } from 'vitest';
import Block from './Block';

class SimpleBlock extends Block<{ text: string; count?: number }> {
  protected render(): string {
    return '<div class="simple"><span>{{text}}</span></div>';
  }
}

class ParentBlock extends Block<{ title: string }> {
  protected render(): string {
    return '<div class="parent"><h1>{{title}}</h1>{{{ child }}}</div>';
  }
}

describe('Block', () => {
  it('рендерит шаблон с props', () => {
    const block = new SimpleBlock({ text: 'Hello' });
    expect(block.getContent().innerHTML).toContain('Hello');
  });

  it('перерисовывается при setProps', () => {
    const block = new SimpleBlock({ text: 'Hello' });
    block.setProps({ text: 'World' });
    expect(block.getContent().innerHTML).toContain('World');
    expect(block.getContent().innerHTML).not.toContain('Hello');
  });

  it('не перерисовывается при одинаковом значении', () => {
    const block = new SimpleBlock({ text: 'Same' });
    const before = block.getContent().innerHTML;
    block.setProps({ text: 'Same' });
    expect(block.getContent().innerHTML).toBe(before);
  });

  it('getContent возвращает стабильный HTMLElement', () => {
    const block = new SimpleBlock({ text: 'A' });
    const el = block.getContent();
    block.setProps({ text: 'B' });
    expect(block.getContent()).toBe(el);
  });

  it('подставляет дочерний Block через стаб', () => {
    const child = new SimpleBlock({ text: 'child-text' });
    const parent = new ParentBlock({ title: 'Parent' });
    Object.assign(parent['children'], { child });
    parent['_eventBus']['emit'](Block.EVENTS.RENDER);

    expect(parent.getContent().innerHTML).toContain('child-text');
  });

  it('id уникален для каждого экземпляра', () => {
    const a = new SimpleBlock({ text: 'a' });
    const b = new SimpleBlock({ text: 'b' });
    expect(a.id).not.toBe(b.id);
  });

  it('show/hide управляют видимостью', () => {
    const block = new SimpleBlock({ text: 'x' });
    block.hide();
    expect(block.getContent().style.display).toBe('none');
    block.show();
    expect(block.getContent().style.display).toBe('block');
  });
});

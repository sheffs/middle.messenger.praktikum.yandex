import Handlebars from 'handlebars';
import EventBus from './EventBus';

export type BlockEvents = Record<string, (e: Event) => void>;

export interface BlockProps {
  events?: BlockEvents;
  [key: string]: unknown;
}

let idCounter = 0;

export default abstract class Block<P extends BlockProps = BlockProps> {
  static readonly EVENTS = {
    INIT: 'init',
    CDM: 'flow:component-did-mount',
    CDU: 'flow:component-did-update',
    RENDER: 'flow:render',
  } as const;

  readonly id: string;
  protected props: P;
  protected children: Record<string, Block | Block[]>;

  private _element!: HTMLElement;
  private readonly _eventBus: EventBus;

  constructor(propsAndChildren: P = {} as P) {
    this.id = `block-${++idCounter}`;
    this._eventBus = new EventBus();

    const { props, children } = Block._separateChildren(propsAndChildren);
    this.children = children;
    this.props = Block._makeProxy(props as P, () => {
      this._eventBus.emit(Block.EVENTS.CDU);
    });

    this._registerLifecycle();
    this._eventBus.emit(Block.EVENTS.INIT);
  }

  private static _separateChildren<P extends BlockProps>(
    all: P,
  ): { props: P; children: Record<string, Block | Block[]> } {
    const props = {} as P;
    const children: Record<string, Block | Block[]> = {};

    for (const [key, value] of Object.entries(all as Record<string, unknown>)) {
      if (value instanceof Block) {
        children[key] = value;
      } else if (Array.isArray(value) && value.length > 0 && value[0] instanceof Block) {
        children[key] = value as Block[];
      } else {
        (props as BlockProps)[key] = value;
      }
    }

    return { props, children };
  }

  private static _makeProxy<P extends BlockProps>(props: P, onChange: () => void): P {
    return new Proxy(props, {
      set(target, prop: string, value: unknown): boolean {
        const old = (target as BlockProps)[prop];
        (target as BlockProps)[prop] = value;
        if (old !== value) {
          onChange();
        }
        return true;
      },
      deleteProperty(): boolean {
        throw new Error('Deleting props is not allowed');
      },
    });
  }

  private _registerLifecycle(): void {
    this._eventBus.on(Block.EVENTS.INIT, this._init.bind(this));
    this._eventBus.on(Block.EVENTS.CDM, this._componentDidMount.bind(this));
    this._eventBus.on(Block.EVENTS.CDU, this._componentDidUpdate.bind(this));
    this._eventBus.on(Block.EVENTS.RENDER, this._render.bind(this));
  }

  private _init(): void {
    this._element = document.createElement('div');
    this.init();
    this._eventBus.emit(Block.EVENTS.RENDER);
  }

  protected init(): void {}

  private _componentDidMount(): void {
    this.componentDidMount();
    for (const child of this._flatChildren()) {
      child.dispatchComponentDidMount();
    }
  }

  public componentDidMount(): void {}

  public dispatchComponentDidMount(): void {
    this._eventBus.emit(Block.EVENTS.CDM);
  }

  private _componentDidUpdate(): void {
    if (this.componentDidUpdate()) {
      this._eventBus.emit(Block.EVENTS.RENDER);
    }
  }

  public componentDidUpdate(): boolean {
    return true;
  }

  public setProps(nextProps: Partial<P>): void {
    Object.assign(this.props, nextProps);
  }

  get element(): HTMLElement {
    return this._element;
  }

  private _render(): void {
    const fragment = this._compile();
    this._removeEvents();
    this._element.innerHTML = '';
    this._element.appendChild(fragment);
    this._addEvents();
  }

  private _compile(): DocumentFragment {
    const stubs: Record<string, unknown> = {};

    for (const [key, child] of Object.entries(this.children)) {
      if (Array.isArray(child)) {
        stubs[key] = child.map((c) => `<div data-id="${c.id}"></div>`).join('');
      } else {
        stubs[key] = `<div data-id="${child.id}"></div>`;
      }
    }

    const compiled = Handlebars.compile(this.render());
    const html = compiled({ ...this.props, ...stubs });

    const temp = document.createElement('template');
    temp.innerHTML = html;

    for (const child of this._flatChildren()) {
      const stub = temp.content.querySelector(`[data-id="${child.id}"]`);
      stub?.replaceWith(child.getContent());
    }

    return temp.content;
  }

  protected compile(template: string, context: object): string {
    const stubs: Record<string, unknown> = {};

    for (const [key, child] of Object.entries(this.children)) {
      if (Array.isArray(child)) {
        stubs[key] = child.map((c) => `<div data-id="${c.id}"></div>`).join('');
      } else {
        stubs[key] = `<div data-id="${child.id}"></div>`;
      }
    }

    return Handlebars.compile(template)({ ...context, ...stubs });
  }

  protected abstract render(): string;

  public getContent(): HTMLElement {
    return this._element;
  }

  private _addEvents(): void {
    const { events } = this.props;
    if (!events) {return;}
    for (const [name, handler] of Object.entries(events)) {
      this._element.addEventListener(name, handler);
    }
  }

  private _removeEvents(): void {
    const { events } = this.props;
    if (!events) {return;}
    for (const [name, handler] of Object.entries(events)) {
      this._element.removeEventListener(name, handler);
    }
  }

  private _flatChildren(): Block[] {
    return Object.values(this.children).flat() as Block[];
  }

  public show(): void {
    this.getContent().style.display = 'block';
  }

  public hide(): void {
    this.getContent().style.display = 'none';
  }
}

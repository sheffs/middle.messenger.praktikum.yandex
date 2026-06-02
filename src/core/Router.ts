import Block from './Block';
import { Stack } from '../utils/structures';

type RouteFactory = () => Block;

interface RouteConfig {
  path: string;
  factory: RouteFactory;
  /** Если вернёт false — выполнится redirectTo */
  guard?: () => boolean;
  redirectTo?: string;
}

export default class Router {
  private static _instance: Router;
  private _routes: RouteConfig[] = [];
  private _notFoundFactory: RouteFactory | null = null;
  private _rootQuery: string;
  private _currentBlock: Block | null = null;
  private _history: Stack<string> = new Stack();

  private constructor(rootQuery: string) {
    this._rootQuery = rootQuery;
    this._bindPopstate();
    this._bindLinks();
  }

  public static getInstance(rootQuery: string = '#app'): Router {
    if (!Router._instance) {
      Router._instance = new Router(rootQuery);
    }
    return Router._instance;
  }

  private _bindPopstate(): void {
    window.addEventListener('popstate', () => {
      this._handleRoute(window.location.pathname);
    });
  }

  private _bindLinks(): void {
    document.addEventListener('click', (e: MouseEvent) => {
      const target = (e.target as Element).closest('[data-link]');
      if (!target) { return; }
      e.preventDefault();
      const href = target.getAttribute('href');
      if (href) {
        this.navigate(href);
      }
    });
  }

  public addRoute(path: string, factory: RouteFactory, guard?: () => boolean, redirectTo?: string): this {
    this._routes.push({ path, factory, guard, redirectTo });
    return this;
  }

  public setNotFound(factory: RouteFactory): this {
    this._notFoundFactory = factory;
    return this;
  }

  public navigate(path: string): void {
    if (window.location.pathname === path) { return; }
    this._history.push(window.location.pathname);
    window.history.pushState({}, '', path);
    this._handleRoute(path);
  }

  /** Переход назад по собственному стеку истории; при пустом стеке — на fallback */
  public back(fallback = '/'): void {
    const prev = this._history.pop();
    if (prev) {
      window.history.back();
    } else {
      this.navigate(fallback);
    }
  }

  public start(): void {
    this._handleRoute(window.location.pathname);
  }

  private _handleRoute(path: string): void {
    const route = this._routes.find((r) => r.path === path);

    if (!route) {
      this._mount(this._notFoundFactory?.() ?? null);
      return;
    }

    if (route.guard && !route.guard()) {
      this.navigate(route.redirectTo ?? '/');
      return;
    }

    this._mount(route.factory());
  }

  private _mount(block: Block | null): void {
    if (!block) { return; }
    const root = document.querySelector(this._rootQuery);
    if (!root) { return; }

    root.innerHTML = '';
    root.appendChild(block.getContent());
    block.dispatchComponentDidMount();

    this._currentBlock = block;
  }

  public getCurrentBlock(): Block | null {
    return this._currentBlock;
  }
}

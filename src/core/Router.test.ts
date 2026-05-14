import { describe, it, expect, vi, beforeEach } from 'vitest';
import Router from './Router';
import Block from './Block';

class StubBlock extends Block<{ label: string }> {
  protected render(): string {
    return '<div>{{label}}</div>';
  }
}

function makeRouter(): Router {
  // Сбрасываем синглтон между тестами
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (Router as any)._instance = undefined;
  document.body.innerHTML = '<div id="app"></div>';
  return Router.getInstance('#app');
}

describe('Router', () => {
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Router as any)._instance = undefined;
    document.body.innerHTML = '<div id="app"></div>';
    window.history.pushState({}, '', '/');
  });

  it('рендерит страницу по маршруту', () => {
    const router = makeRouter();
    router.addRoute('/', () => new StubBlock({ label: 'home' }));
    router.start();
    expect(document.querySelector('#app')?.innerHTML).toContain('home');
  });

  it('отдаёт 404 при неизвестном маршруте', () => {
    const router = makeRouter();
    router.setNotFound(() => new StubBlock({ label: '404' }));
    window.history.pushState({}, '', '/unknown');
    router.start();
    expect(document.querySelector('#app')?.innerHTML).toContain('404');
  });

  it('navigate переходит на указанный маршрут', () => {
    const router = makeRouter();
    router
      .addRoute('/', () => new StubBlock({ label: 'home' }))
      .addRoute('/about', () => new StubBlock({ label: 'about' }));
    router.start();
    router.navigate('/about');
    expect(document.querySelector('#app')?.innerHTML).toContain('about');
  });

  it('guard блокирует маршрут и выполняет редирект', () => {
    const router = makeRouter();
    router
      .addRoute('/', () => new StubBlock({ label: 'login' }))
      .addRoute('/secret', () => new StubBlock({ label: 'secret' }), () => false, '/');
    router.start();
    router.navigate('/secret');
    expect(document.querySelector('#app')?.innerHTML).toContain('login');
    expect(document.querySelector('#app')?.innerHTML).not.toContain('secret');
  });

  it('guard пропускает маршрут при true', () => {
    const router = makeRouter();
    router.addRoute(
      '/guarded',
      () => new StubBlock({ label: 'guarded' }),
      () => true,
    );
    window.history.pushState({}, '', '/guarded');
    router.start();
    expect(document.querySelector('#app')?.innerHTML).toContain('guarded');
  });

  it('navigate не переходит если уже на этом маршруте', () => {
    const router = makeRouter();
    const factory = vi.fn(() => new StubBlock({ label: 'x' }));
    router.addRoute('/', factory);
    router.start();
    router.navigate('/');
    expect(factory).toHaveBeenCalledTimes(1);
  });
});

import './styles/main.scss';

import Router from './core/Router';
import Store from './store/Store';
import { AuthAPI } from './api/AuthAPI';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/register/RegisterPage';
import { ChatPage } from './pages/chat/ChatPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { ErrorPage } from './pages/error/ErrorPage';

const store = Store.getInstance();
const router = Router.getInstance('#app');

const isAuth = (): boolean => store.getState().user !== null;
const isGuest = (): boolean => store.getState().user === null;

router
  .addRoute('/', () => new LoginPage(), isGuest, '/messenger')
  .addRoute('/sign-up', () => new RegisterPage(), isGuest, '/messenger')
  .addRoute('/messenger', () => new ChatPage(), isAuth, '/')
  .addRoute('/settings', () => new ProfilePage(), isAuth, '/')
  .addRoute('/404', () => new ErrorPage({ code: '404', message: 'Страница не найдена' }))
  .addRoute('/500', () => new ErrorPage({ code: '500', message: 'Произошла ошибка сервера' }))
  .setNotFound(() => new ErrorPage({ code: '404', message: 'Страница не найдена' }));

AuthAPI.getUser()
  .then((user) => {
    store.setState({ user });
  })
  .catch(() => {
    store.setState({ user: null });
  })
  .finally(() => {
    router.start();
  });

import HTTPTransport from '../core/HTTPTransport';
import type { User, SigninData, SignupData } from '../types';

const http = new HTTPTransport('/auth');

export const AuthAPI = {
  signin(data: SigninData): Promise<void> {
    return http.post('/signin', { data });
  },

  signup(data: SignupData): Promise<{ id: number }> {
    return http.post('/signup', { data });
  },

  getUser(): Promise<User> {
    return http.get('/user');
  },

  logout(): Promise<void> {
    return http.post('/logout');
  },
};

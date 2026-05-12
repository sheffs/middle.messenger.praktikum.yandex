import { LocalAuthService } from '../services/LocalAuthService';
import type { User, SigninData, SignupData } from '../types';

// Интерфейс сохранён таким же, как был бы с реальным API —
// в будущем достаточно просто поменять реализацию внутри

export const AuthAPI = {
  signin(data: SigninData): Promise<void> {
    return LocalAuthService.signin(data);
  },

  signup(data: SignupData): Promise<{ id: number }> {
    return LocalAuthService.signup(data);
  },

  getUser(): Promise<User> {
    return LocalAuthService.getUser();
  },

  logout(): Promise<void> {
    return LocalAuthService.logout();
  },
};

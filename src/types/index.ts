export interface User {
  id: number;
  first_name: string;
  second_name: string;
  display_name: string | null;
  login: string;
  email: string;
  phone: string;
  avatar: string | null;
}

export interface LastMessage {
  user: User;
  time: string;
  content: string;
}

// Данные чата из API
interface ChatBase {
  id: number;
  title: string;
  avatar: string | null;
  unread_count: number;
  last_message: LastMessage | null;
}

// Расширение с полями, которые хранятся локально (нет в реальном API)
export interface Chat extends ChatBase {
  is_group?: boolean;
  members?: number[];
}

export interface Message {
  id: number;
  user_id: number;
  chat_id: number;
  type: string;
  time: string;
  content: string;
  is_read: boolean;
  file?: {
    id: number;
    user_id: number;
    path: string;
    filename: string;
    content_type: string;
    content_size: number;
    upload_date: string;
  };
}

export interface SigninData {
  login: string;
  password: string;
}

// Общие поля для форм регистрации и редактирования профиля
interface UserFormBase {
  first_name: string;
  second_name: string;
  login: string;
  email: string;
  phone: string;
}

export interface SignupData extends UserFormBase {
  password: string;
}

export interface UpdateProfileData extends UserFormBase {
  display_name: string;
}

export interface UpdatePasswordData {
  oldPassword: string;
  newPassword: string;
}

export interface APIError {
  reason: string;
}

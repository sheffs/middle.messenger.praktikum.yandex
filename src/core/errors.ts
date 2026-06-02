export class APIError extends Error {
  public readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'APIError';
    this.status = status;
  }
}

export class UnauthorizedError extends APIError {
  constructor(message = 'Необходима авторизация') {
    super(401, message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends APIError {
  constructor(message = 'Доступ запрещён') {
    super(403, message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends APIError {
  constructor(message = 'Ресурс не найден') {
    super(404, message);
    this.name = 'NotFoundError';
  }
}

export class ServerError extends APIError {
  constructor(message = 'Ошибка сервера') {
    super(500, message);
    this.name = 'ServerError';
  }
}

export class NetworkError extends Error {
  constructor() {
    super('Нет подключения к сети');
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor() {
    super('Превышено время ожидания запроса');
    this.name = 'TimeoutError';
  }
}

/**
 * Seed script: создаёт тестовых пользователей, чаты и сообщения.
 * Запуск: node scripts/seed.mjs <login> <password>
 */

import https from 'node:https';
import WebSocket from 'ws';

const BASE_HOST = 'ya-praktikum.tech';
const WS_BASE = 'wss://ya-praktikum.tech/ws/chats';

const [, , LOGIN, PASSWORD] = process.argv;
if (!LOGIN || !PASSWORD) {
  console.error('Usage: node scripts/seed.mjs <login> <password>');
  process.exit(1);
}

// ─── Cookie jar ────────────────────────────────────────────────────────────

class CookieJar {
  constructor() { this._cookies = new Map(); }

  update(setCookieHeaders) {
    if (!setCookieHeaders) return;
    for (const header of setCookieHeaders) {
      const [pair] = header.split(';');
      const idx = pair.indexOf('=');
      if (idx === -1) continue;
      const name = pair.slice(0, idx).trim();
      const value = pair.slice(idx + 1).trim();
      this._cookies.set(name, value);
    }
  }

  toString() {
    return [...this._cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  }

  isEmpty() { return this._cookies.size === 0; }
}

// ─── HTTP helper ────────────────────────────────────────────────────────────

function request(method, path, body, jar) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const cookieStr = jar ? jar.toString() : '';

    const options = {
      hostname: BASE_HOST,
      path: `/api/v2${path}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Origin: 'https://ya-praktikum.tech',
        ...(cookieStr ? { Cookie: cookieStr } : {}),
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (jar && res.headers['set-cookie']) {
          jar.update(res.headers['set-cookie']);
        }
        try {
          resolve({ body: JSON.parse(data), status: res.statusCode });
        } catch {
          resolve({ body: data, status: res.statusCode });
        }
      });
    });

    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// ─── WebSocket helper ───────────────────────────────────────────────────────

function sendWsMessage(userId, chatId, token, cookieJar, message) {
  return new Promise((resolve) => {
    const url = `${WS_BASE}/${userId}/${chatId}/${token}`;
    const ws = new WebSocket(url, {
      headers: {
        Cookie: cookieJar.toString(),
        Origin: 'https://ya-praktikum.tech',
      },
    });
    const timer = setTimeout(() => { ws.terminate(); resolve(false); }, 8000);

    ws.once('open', () => {
      ws.send(JSON.stringify({ content: message, type: 'message' }));
    });

    ws.on('message', (raw) => {
      try {
        const data = JSON.parse(raw.toString());
        if (data.type === 'message' && data.content === message) {
          clearTimeout(timer);
          ws.close();
          resolve(true);
        }
      } catch { /* ignore */ }
    });

    ws.once('error', (err) => {
      clearTimeout(timer);
      process.stdout.write(`[ws error: ${err.message}]`);
      resolve(false);
    });
  });
}

// ─── Auth helper ────────────────────────────────────────────────────────────

async function signIn(login, password) {
  const jar = new CookieJar();
  const res = await request('POST', '/auth/signin', { login, password }, jar);
  if (res.status !== 200) return null;
  if (jar.isEmpty()) return null;
  const meRes = await request('GET', '/auth/user', null, jar);
  if (meRes.status !== 200) return null;
  return { user: meRes.body, jar };
}

async function signUp(data) {
  const jar = new CookieJar();
  await request('POST', '/auth/signup', data, jar);
  return signIn(data.login, data.password);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔐 Вход под основным аккаунтом...');
  const main = await signIn(LOGIN, PASSWORD);
  if (!main) { console.error('❌ Не удалось войти. Проверьте логин и пароль.'); process.exit(1); }
  console.log(`✅ Вошли как ${main.user.first_name} ${main.user.second_name} (id=${main.user.id})`);

  // ─── Тестовые пользователи ────────────────────────────────────────────

  const testAccounts = [
    { first_name: 'Алиса',  second_name: 'Смирнова', login: 'alice_seed01', email: 'alice_seed01@test.ru',  phone: '+79001110001', password: 'TestPass1' },
    { first_name: 'Борис',  second_name: 'Петров',   login: 'boris_seed01', email: 'boris_seed01@test.ru',  phone: '+79001110002', password: 'TestPass1' },
    { first_name: 'Виктор', second_name: 'Козлов',   login: 'viktor_seed01',email: 'viktor_seed01@test.ru', phone: '+79001110003', password: 'TestPass1' },
  ];

  const participants = [main];
  for (const acc of testAccounts) {
    process.stdout.write(`👤 ${acc.login}... `);
    let session = await signIn(acc.login, acc.password);
    if (!session) session = await signUp(acc);
    if (session) {
      participants.push(session);
      console.log(`✅ id=${session.user.id}`);
    } else {
      console.log('⚠️  пропускаю');
    }
  }

  // ─── Сценарии чатов ──────────────────────────────────────────────────

  const scenarios = [
    {
      title: 'Команда разработки',
      memberIdx: [1, 2],
      messages: [
        { from: 0, text: 'Всем привет! Как дела с задачами?' },
        { from: 1, text: 'Привет! Почти готово, осталось покрыть тестами.' },
        { from: 0, text: 'Отлично, не забудь сделать PR до конца дня.' },
        { from: 1, text: 'Сделаю, не переживай.' },
        { from: 2, text: 'Я тоже закончил свою часть!' },
      ],
    },
    {
      title: 'Дизайн & UI',
      memberIdx: [1, 3],
      messages: [
        { from: 1, text: 'Выслал макеты на ревью.' },
        { from: 0, text: 'Видел, выглядит здорово! Кнопки сделай чуть крупнее.' },
        { from: 1, text: 'Понял, исправлю сегодня.' },
        { from: 0, text: 'Жду обновления!' },
      ],
    },
    {
      title: 'Общий чат',
      memberIdx: [1, 2, 3],
      messages: [
        { from: 0, text: 'Ребята, митинг в пятницу в 15:00.' },
        { from: 1, text: 'Окей, буду.' },
        { from: 2, text: 'Я тоже!' },
        { from: 3, text: 'Принял, спасибо.' },
        { from: 0, text: 'Отлично, до пятницы! 🎉' },
      ],
    },
  ];

  for (const scenario of scenarios) {
    process.stdout.write(`\n💬 Создаю чат «${scenario.title}»... `);
    const chatRes = await request('POST', '/chats', { title: scenario.title }, main.jar);
    if (chatRes.status !== 200) {
      console.log(`❌ ${JSON.stringify(chatRes.body)}`);
      continue;
    }
    const chatId = chatRes.body.id;
    console.log(`✅ id=${chatId}`);

    const memberSessions = scenario.memberIdx.map((i) => participants[i]).filter(Boolean);
    if (memberSessions.length > 0) {
      const userIds = memberSessions.map((s) => s.user.id);
      const addRes = await request('PUT', '/chats/users', { users: userIds, chatId }, main.jar);
      console.log(`   👥 Участников добавлено: ${userIds.length} (статус ${addRes.status})`);
    }

    const senders = [main, ...memberSessions];
    process.stdout.write('   💬 Сообщения: ');
    for (const msg of scenario.messages) {
      const sender = senders[msg.from] ?? senders[0];
      const tokRes = await request('POST', `/chats/token/${chatId}`, null, sender.jar);
      if (tokRes.status !== 200) { process.stdout.write('✗'); continue; }
      const saved = await sendWsMessage(sender.user.id, chatId, tokRes.body.token, sender.jar, msg.text);
      process.stdout.write(saved ? '✓' : '?');
    }
    console.log(` (${scenario.messages.length})`);
  }

  console.log('\n🎉 Готово! Обновите страницу — чаты появятся в списке.');
}

main().catch((err) => { console.error('Ошибка:', err.message); process.exit(1); });

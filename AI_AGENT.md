# 🤖 AI Agent Context — v0-test-api + eddytester.com

> Единый справочник для AI-агента. Содержит всю связку: репозитории, инфраструктуру, домены, PM2, Apache, API, тесты и деплой.
>
> **Последнее обновление:** 16 июня 2026

---

## 1. Репозитории (2 шт)

| Репозиторий | Описание | Ветка | Хост на сервере |
|---|---|---|---|
| `overgoer/v0-test-api` | API с багами (учебный стенд) | `main` | `/var/www/v0-test-api/v0-test-api/` |
| `overgoer/eddytester.com` | Лендинг + тесты `/glearning` | `main` | `/var/www/eddytester.com/` |

---

## 2. Инфраструктура (1 сервер)

| Параметр | Значение |
|---|---|
| Хостинг | Timeweb |
| IP | `85.193.81.51` |
| ОС | Ubuntu 22.04.5 LTS |
| Веб-сервер | Apache 2.4.52 (запущен вручную `apachectl -k graceful`, не systemd) |
| SSH | порт **2222** (порт 22 закрыт) |
| Node.js | 18+ |
| PostgreSQL | 14+ (localhost:5432, БД `testdb`) |

### Cloudflare

| Домен | Cloudflare |
|---|---|
| `eddytester.com` | ON (оранжевое облако) — Flexible SSL |
| `www.eddytester.com` | ON |
| `api.eddytester.com` | ON |
| `practicum.eddytester.com` | ON |

Все A-записи → `85.193.81.51`. При изменениях очищать кэш Cloudflare (Purge Cache).

### SSH-доступ

```bash
ssh timeweb  # настроен в ~/.ssh/config (порт 2222, ключ)
```

---

## 3. Домены и прокси

| Домен | Назначение | Куда ведёт |
|---|---|---|
| `eddytester.com` | Главный сайт (лендинг) + прокси на бэкенды | Apache статика + ProxyPass |
| `www.eddytester.com` | Алиас eddytester.com | → eddytester.com |
| `practicum.eddytester.com` | v0-test-api (учебный стенд) | ProxyPass → localhost:3000 |
| `api.eddytester.com` | Free Trial API | ProxyPass → localhost:3001 |

---

## 4. PM2 процессы (4 шт)

| PM2 ID | Имя | Порт | Код на сервере | Репозиторий |
|---|---|---|---|---|
| 1 | `free-trial-api` | 3001 | `/root/free-trial-api/server.js` | `overgoer/free-trial-api` |
| **2** | **`v0-test-api`** | **3000** | **`/var/www/v0-test-api/v0-test-api/server.js`** | **`overgoer/v0-test-api`** |
| 3 | `key-check` | 3456 | `/var/www/eddytester.com/key-check.js` | `overgoer/eddytester.com` |
| 4 | `payment-yookassa` | 3457 | `/var/www/eddytester.com/payment.js` | `overgoer/eddytester.com` |

**Важно:** после деплоя `v0-test-api` — перезапускать `pm2 restart v0-test-api`.

---

## 5. Apache VHosts — сводка всех прокси

### На eddytester.com (HTTP + HTTPS)

Проксируются через Apache (конфиги `eddytester.com.conf` и `eddytester.com-le-ssl.conf`):

| URL на сайте | Куда | Порт | Назначение |
|---|---|---|---|
| `/bugs` | localhost | 3000 | Список багов (статический HTML из docs/bugs.html) |
| `/check-key` (POST) | localhost | 3456 | Проверка API-ключа |
| `/create-payment` (POST) | localhost | 3457 | ЮKassa платежи |
| `/get-progress` (GET) | localhost | 3000 | Прогресс уроков |
| `/save-progress` (POST) | localhost | 3000 | Сохранение прогресса |

### practicum.eddytester.com
Весь трафик → localhost:3000 (v0-test-api).

### api.eddytester.com
Весь трафик → localhost:3001 (free-trial-api).

### .htaccess (в корне eddytester.com)
RewriteRule для статических страниц (см. раздел 6).

**Известная проблема:** конфиги `eddytester.com.conf` и `eddytester.com-le-ssl.conf` в `sites-enabled/` — копии, а не симлинки на `sites-available/`. При изменениях синхронизировать вручную.

---

## 6. Страницы eddytester.com (карта RewriteRule)

| URL | Файл | Описание |
|---|---|---|
| `/` | `page101918416.html` | Главная (лендинг) |
| `/api-practicum` | `page101918416.html` | Ссылка на главную |
| `/consult` | `page101918416.html` | Консультация |
| `/glearning` | `page101922726.html` | **API Практикум — 16 уроков, 5 с тестами** |
| `/designlearning` | `page101922726.html` | Дизайн-практикум (тот же файл) |
| `/test/glearning-test` | `test/glearning-test.html` | Стейджинг /glearning |
| `/test/practicum` | `test/practicum.html` | Стейджинг главной |
| `/api` | `page64392263.html` | Free Trial API |
| `/api_docs` | `page65526529.html` | Документация API |
| `/api_oferta` | `page65082509.html` | Оферта API |
| `/docs2` | `page71604261.html` | Docs v2 |
| `/oferta_api_eddytester` | `page73441323.html` | Оферта |
| `/pers_data_policy` | `page77510526.html` | Политика данных |
| `/test_layout` | `page71319435.html` | Тестовый лейаут |
| `/test_learning_page` | `page79978736.html` | Тест обучения |

---

## 7. API v0-test-api (v1 с багами vs v2 эталон)

### Эндпоинты

| Метод | Путь | v1 багов | v2 |
|---|---|---|---|
| GET | `/api/users` | 4 (Content-Type, security, cache, X-Cache-Info) | ✅ |
| GET | `/api/users?status=` | 3 (case, invalid, comma) | ✅ |
| POST | `/api/users` | 5 (name validation, age 66+, age 16-, age string, 2 passes) | ✅ |
| GET | `/api/users/{id}` | 3 (id-1, string id → 500, not found → 200) | ✅ |
| PATCH | `/api/users/{id}` | 5 (negative age → 500, no id, age string, name, no status) | ✅ |
| DELETE | `/api/users/{id}` | 3 (SELECT instead of DELETE, 200→404, no api_key) | ✅ |
| GET | `/api/passes` | 2 (pagination, date format) | ✅ |
| POST | `/api/passes` | 5 (60h, user_id, duplicates, minor, passcode) | ✅ |
| GET | `/api/passes/user/{id}` | 1 (ignores user_id) | ✅ |
| PATCH | `/api/passes/{id}` | 5 (any status, updated_at, immutable, resurrection, limit) | ✅ |
| DELETE | `/api/passes/{id}` | 3 (200→404, no api_key, active pass) | ✅ |
| POST | `/api/maintenance/run` | — | — |

**Полный список:** `https://eddytester.com/bugs` (42 бага).

### Структура кода v0-test-api

```
server.js                              # Entry point + роутинг
├── src/config/database.js             # pg.Pool, 3 режима подключения
├── src/config/middleware.js            # validateApiKey, rateLimit, cache
├── src/routes/v1/users.js             # БАГИ (users)
├── src/routes/v2/users.js             # Эталон (users)
├── src/routes/v1/passes.js            # БАГИ (screening passes)
├── src/routes/v2/passes.js            # Эталон (screening passes)
├── src/routes/v1/reset.js             # DELETE /v1/api/reset
├── src/routes/v1/credentials.js       # GET /v1/api/credentials
├── src/routes/progress.js             # Progress API (get/save прогресс)
├── src/services/maintenanceService.js # Cron очистки (с багами)
├── src/services/validationService.js  # validateName, validateAge
├── src/services/emailService.js       # Nodemailer
├── db/migrations/                     # SQL миграции
├── docs/bugs.html                     # Визуальный справочник багов
├── docs/bugs.md                       # AI-формат справочника багов
└── tests/                             # Jest тесты
```

### Аутентификация
- Заголовок `X-Fix-Bug: <api_key>` обязателен (иначе 401)
- Валидация: `SELECT FROM api_keys WHERE api_key = $1`
- Если `SKIP_DB=true` — хардкодный allowlist (`test-key-123`, `API_KEY` из env)
- Rate limit: 120/мин глобально, 30/мин на write (POST/PATCH/DELETE)

### Swagger
- `https://practicum.eddytester.com/swagger.html`
- `https://practicum.eddytester.com/swagger.json`

---

## 8. Система тестов (страница `/glearning`)

### Как работает
1. Студент вводит API-ключ в оверлей на `/glearning`
2. Ключ проверяется через `/check-key` (прокси → key-check :3456)
3. После успеха — GET `/get-progress?key=...` загружает тесты
4. JS рендерит чекбоксы с багами в DOM
5. Студент отмечает найденные баги → POST `/save-progress`
6. Сервер сверяет с эталоном (`LESSONS_CONFIG` в `progress.js`)

### 5 уроков с тестами

| Урок | ID | Эндпоинт | Всего багов | Найти нужно |
|---|---|---|---|---|
| l9 | `get-users` | GET /users | 12 | 7 |
| l12 | `get-user` | GET /users/{id} | 7 | 3 |
| l13 | `post-users` | POST /users | 10 | 5 |
| l14 | `patch-user` | PATCH /users/{id} | 10 | 5 |
| l15 | `delete-user` | DELETE /users/{id} | 7 | 3 |
| **Итого** | | | **46** | **23** |

**Важно:** количество багов в тестах (46) **не равно** количеству задокументированных багов в API (42). Тесты могут проверять разные аспекты одного бага или иметь свои тестовые сценарии.

### LESSONS_CONFIG
Правильные ответы для каждого урока заданы в `src/routes/progress.js` (на сервере: `/var/www/v0-test-api/v0-test-api/src/routes/progress.js`).

### База данных (lesson_progress)
```sql
lesson_progress (api_key, lesson_id, selected_bugs[], correct_bugs[], 
                 wrong_bugs[], completed boolean, attempts)
```

### Фронтенд
- Весь код в `page101922726.html` (inline HTML + CSS + JS)
- API-ключ кэшируется в localStorage (`gk_key`)
- MutationObserver отслеживает скрытие оверлея

---

## 9. Деплой — быстрый чеклист

### Перед деплоем
```bash
# 1. Бэкап (теги на сервере)
ssh timeweb "cd /var/www/v0-test-api/v0-test-api && git tag -f backup/YYYY-MM-DD"
ssh timeweb "cd /var/www/eddytester.com && git tag -f backup/YYYY-MM-DD"
```

### v0-test-api
```bash
# 2. Пуш с локальной машины
cd ~/IdeaProjects/v0-test-api
git add .
git commit -m "описание"
git push origin main

# 3. Деплой на сервер
ssh timeweb "cd /var/www/v0-test-api/v0-test-api && git pull origin main && pm2 restart v0-test-api"

# 4. Проверка
curl https://practicum.eddytester.com/health
curl -H "X-Fix-Bug: test-key-123" https://eddytester.com/v1/api/users 2>/dev/null | head -c 200
```

### eddytester.com
```bash
# 2. Пуш с локальной машины
cd ~/IdeaProjects/eddytester.com
git add .
git commit -m "описание"
git push origin main

# 3. Деплой на сервер
ssh timeweb "cd /var/www/eddytester.com && git pull origin main"

# ВНИМАНИЕ: Apache конфиги не деплоятся автоматически!
# Если менялись .htaccess или apache/*.conf — нужно:
#   sudo cp apache/sites-available/*.conf /etc/apache2/sites-available/
#   sudo a2ensite ...
#   sudo apachectl -k graceful
```

### После деплоя
- [ ] ✔ Health check проходит
- [ ] ✔ API отвечает
- [ ] ✔ `/bugs` открывается
- [ ] ✔ `/glearning` работает (тесты загружаются)
- [ ] ✔ Cloudflare очищен (Purge Cache), если менялась статика
- [ ] ✔ Логи чистые (`pm2 logs v0-test-api --lines 20`)

---

## 10. Важные правила

### Что НЕЛЬЗЯ делать
- **❌ Не чинить v1 баги** — они учебные, их десятки. v1 — intentionally buggy.
- **❌ Не менять конфиги Apache напрямую на сервере** — только через репозиторий `apache/` и симлинки.
- **❌ Не коммитить .env файлы** с реальными ключами.
- **❌ Не удалять .html.bak** — это бэкапы Tilda (но можно добавить в .gitignore).
- **❌ Не трогать Telegram ботов** на сервере (alvin-bot, api-practicum-bot и др.).
- **❌ Не трогать Docker контейнеры** (balance_lab, wg-timeweb, searxng, beszel) — они не связаны с сайтом.

### Что нужно помнить
- ✅ **v1 = баги, v2 = эталон.** Студенты ищут баги в v1, сверяясь с v2.
- ✅ **docs/bugs.html** и **docs/bugs.md** — актуальная документация багов. Обновлять при внедрении новых.
- ✅ **42+ бага** в v1, все задокументированы на `https://eddytester.com/bugs`.
- ✅ **Dependabot** в GitHub высылает алерты — игнорировать (учебный проект).
- ✅ `.htaccess` в корне eddytester.com — прокси для Progress API, удалять/менять осторожно.

### Полезные команды

```bash
# Сервер
ssh timeweb                     # вход на сервер
pm2 status                      # список процессов
pm2 logs v0-test-api --lines 20 # логи API

# Локально — v0-test-api
cd ~/IdeaProjects/v0-test-api
npm run dev                     # разработка (SKIP_DB=true)
npm test                        # тесты Jest
npm start                       # production режим

# Локально — eddytester.com
cd ~/IdeaProjects/eddytester.com
# статика, сервер не нужен для разработки

# Проверка API на сервере
curl -H "X-Fix-Bug: test-key-123" https://practicum.eddytester.com/v1/api/users
curl https://practicum.eddytester.com/health
```

---

## 11. Файловая структура на сервере

| Путь | Что |
|---|---|
| `/var/www/eddytester.com/` | Код eddytester.com (лендинг, key-check, payment) |
| `/var/www/v0-test-api/v0-test-api/` | Код v0-test-api |
| `/root/free-trial-api/` | Free Trial API (отдельный репозиторий) |
| `/root/.pm2/logs/` | Логи PM2 |
| `/etc/apache2/sites-available/` | Эталонные конфиги Apache |
| `/etc/apache2/sites-enabled/` | Активные конфиги (симлинки или копии) |

---

## 12. PostgreSQL — студенческая изоляция

Для студентов настроена RLS (Row Level Security):

- Таблицы `users`, `api_keys`, `screening_passes`, `lesson_progress` — с RLS
- Каждый студент видит только свои строки (по `api_key` или `pg_role`)
- Скрипт создания студента: `./add-student.sh <name>` (создаёт SSH-юзера + PG-роль + api_key)
- SSH-туннель на порт 2222 → localhost:5432 для DBeaver

---

*Этот файл должен обновляться при существенных изменениях в архитектуре, инфраструктуре или API.*

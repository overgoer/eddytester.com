# Серверная архитектура eddytester.com

Timeweb (85.193.81.51) — единый сервер, Apache + PM2.
Все DNS A-записи: DNS-only (без Cloudflare proxy).

---

## 1. Лендинг — eddytester.com + www.eddytester.com

Apache статика из `/var/www/eddytester.com/` (Tilda).  
Rewrite rules в `.htaccess` — карта страниц ниже.

**Страницы:**
- `https://eddytester.com/` — главная
- `https://eddytester.com/api-practicum` — главная
- `https://eddytester.com/glearning` — обучение
- `https://eddytester.com/designlearning` — обучение
- `https://eddytester.com/consult` — консультация
- `https://eddytester.com/api` — описание API
- `https://eddytester.com/api_docs` — документация
- `https://eddytester.com/api_oferta` — оферта
- `https://eddytester.com/docs2` — docs v2
- `https://eddytester.com/oferta_api_eddytester` — оферта
- `https://eddytester.com/pers_data_policy` — политика данных
- `https://eddytester.com/test_layout` — тестовый лейаут
- `https://eddytester.com/test_learning_page` — тест обучения

**Прокси на бэкенды (Apache ProxyPass):**
- `https://eddytester.com/bugs` → localhost:3000
- `https://eddytester.com/check-key` (POST) → localhost:3456
- `https://eddytester.com/create-payment` (POST) → localhost:3457
- `https://eddytester.com/get-progress` → localhost:3000
- `https://eddytester.com/save-progress` → localhost:3000

---

## 2. v0-test-api — practicum.eddytester.com

Полный прокси → localhost:3000.  
PM2: `v0-test-api` (id:2), код `/var/www/v0-test-api/v0-test-api/server.js`  
Git на Amsterdam: `/root/v0-test-api`

**Эндпоинты:**
- `https://practicum.eddytester.com/swagger.html` — Swagger UI
- `https://practicum.eddytester.com/swagger.json` — OpenAPI spec
- `https://practicum.eddytester.com/documentation` — docs
- `https://practicum.eddytester.com/health` — health
- `https://practicum.eddytester.com/bugs` — баги
- `https://practicum.eddytester.com/v1/api/...` — API v1
- `https://practicum.eddytester.com/v2/api/...` — API v2

---

## 3. free-trial-api — api.eddytester.com

Полный прокси → localhost:3001.  
PM2: `free-trial-api` (id:1), код `/root/free-trial-api/server.js`  
Git на Amsterdam: `/root/free-trial-api`, репо `overgoer/free-trial-api`

**Эндпоинты:**
- `https://api.eddytester.com/ping` — `{"status":"ok"}`
- `https://api.eddytester.com/docs/v1` — Swagger UI V1
- `https://api.eddytester.com/docs/v2` — Swagger UI V2
- `https://api.eddytester.com/balance-lab` — echo
- `https://api.eddytester.com/free/api/keys` (POST) — trial-ключ
- `https://api.eddytester.com/free/api/users` — CRUD
- `https://api.eddytester.com/free/v1/api/users` — V1
- `https://api.eddytester.com/free/v2/api/users` — V2
- `https://api.eddytester.com/bugs` — баги

---

## 4. Бэкенд-процессы (PM2)

| PM2 имя | id | Порт | Код | Репо |
|---|---|---|---|---|
| free-trial-api | 1 | 3001 | `/root/free-trial-api/server.js` | `overgoer/free-trial-api` |
| v0-test-api | 2 | 3000 | `/var/www/v0-test-api/v0-test-api/server.js` | `overgoer/v0-test-api` |
| key-check | 3 | 3456 | `/var/www/eddytester.com/key-check.js` | `overgoer/eddytester.com` |
| payment-yookassa | 4 | 3457 | `/var/www/eddytester.com/payment.js` | `overgoer/eddytester.com` |

---

## 5. Демо-проекты на Amsterdam

- `/root/food-delivery-api` — Food Delivery API (YouTube контент), репо `overgoer/food-delivery-api`. Не запущен, порт 3003 (план).
- `/root/obsidian-vault` — Obsidian заметки (репо `overgoer/notes`)
- `/root/blog-analysis` — SEO анализ (репо `overgoer/blog-analysis`)
- `/root/api-practicum-bot` — Telegram бот Practicum

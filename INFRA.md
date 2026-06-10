# Сервер: полная инфраструктурная карта

## Сервер

- Хостинг: Timeweb
- IP: 85.193.81.51
- ОС: Ubuntu 22.04.5 LTS
- Веб-сервер: Apache 2.4.52
- SSH: порт 2222 (порт 22 закрыт)
- Сервер запущен вручную (apachectl -k graceful), не через systemd

## Домены и поддомены

| Домен | Назначение | Прокси Cloudflare |
|---|---|---|
| eddytester.com | Главный сайт (лендинг) | ON (оранжевое облако) |
| www.eddytester.com | Алиас главного | ON |
| api.eddytester.com | Free Trial API | ON |
| practicum.eddytester.com | API Practicum (v0-test-api) | ON |

Все A-записи → 85.193.81.51.

## Apache VirtualHosts

### sites-available/ (эталонные конфиги)

| Файл | Статус |
|---|---|
| eddytester.com.conf | HTTP (порт 80) |
| eddytester.com-le-ssl.conf | HTTPS (порт 443, Let's Encrypt) |
| api.eddytester.com.conf | HTTP (порт 80) — прокси на localhost:3001 |
| api.eddytester.com-le-ssl.conf | HTTPS (порт 443) — прокси на localhost:3001 |
| practicum.eddytester.com.conf | HTTP (порт 80) — прокси на localhost:3000 |
| practicum.eddytester.com-le-ssl.conf | HTTPS (порт 443) — прокси на localhost:3000 |

### sites-enabled/ (активные конфиги)

| Файл | Тип | Источник |
|---|---|---|
| 000-default.conf | SYMLINK → ../sites-available/000-default.conf | ✅ |
| api.eddytester.com-le-ssl.conf | SYMLINK → /etc/apache2/sites-available/... | ✅ |
| api.eddytester.com.conf | SYMLINK → ../sites-available/... | ✅ |
| **eddytester.com-le-ssl.conf** | **COPY** (не симлинк) | ❌ дубль |
| eddytester.com-le-ssl.conf.bak.20260606_183915 | COPY (старый бэкап) | ❌ мусор |
| **eddytester.com.conf** | **COPY** (не симлинк) | ❌ дубль |
| practicum.eddytester.com-le-ssl.conf | SYMLINK | ✅ |
| practicum.eddytester.com.conf | SYMLINK | ✅ |

**Проблема:** Два файла eddytester.com (HTTP и HTTPS) — копии, а не симлинки. При изменениях в sites-available/ они не синхронизируются.

## SSL/TLS

- Сертификат: Let's Encrypt (certbot)
- Путь: /etc/letsencrypt/live/eddytester.com/
- Режим Cloudflare: Flexible (Cloudflare → сервер по HTTP)
- ⚠️ HTTPS на сервере (порт 443) — Apache слушает, но сертификат может быть просрочен/битый

## Бэкенд-сервисы (запущены через PM2)

| PM2 ID | Имя | Порт | Назначение |
|---|---|---|---|
| 1 | free-trial-api | 3001 | Free Trial API (генерация 24ч ключей) |
| 2 | v0-test-api | 3000 | API Practicum (учебный стенд с багами) |
| 3 | key-check | 3456 | Проверка ключей API |
| 4 | payment-yookassa | 3457 | Обработка платежей ЮKassa |

## Прокси через Apache

| URL на сайте | Куда идёт | Порт |
|---|---|---|
| /check-key | localhost:3456 | key-check |
| /create-payment | localhost:3457 | payment-yookassa |
| /bugs | localhost:3000 | v0-test-api |
| /get-progress | localhost:3000 | v0-test-api |
| /save-progress | localhost:3000 | v0-test-api |
| api.eddytester.com/ | localhost:3001 | free-trial-api |
| practicum.eddytester.com/ | localhost:3000 | v0-test-api |

## Docker контейнеры (не связаны с сайтом)

| Контейнер | Назначение |
|---|---|
| balance_lab-nginx | Лаборатория балансировки (учебный проект) |
| balance_lab-backend1/2/3 | Бэкенды для лаборатории |
| wg-timeweb | WireGuard VPN |
| searxng | Поисковик (порт 8888) |
| beszel-agent/hub | Мониторинг сервера (порт 8090) |

## Как применять изменения

1. Ветка → main → пуш → GitHub Actions запускает деплой
2. Деплой: `cd /var/www/eddytester.com && git pull origin main`
3. **Важно:** конфиги Apache НЕ деплоятся автоматически. После пуша нужно:
   - Скопировать конфиг из Git на сервер вручную
   - Или настроить CI/CD для копирования

## Что нужно исправить (refactor backlog)

1. [ ] Заменить копии eddytester.com.conf и eddytester.com-le-ssl.conf в sites-enabled/ на симлинки
2. [ ] Удалить мусорный eddytester.com-le-ssl.conf.bak.20260606_183915
3. [ ] Синхронизировать apache/ в Git с сервером
4. [ ] Создать отдельную репу для инфры (overgoer/infrastructure)
5. [ ] Настроить CI/CD для деплоя конфигов Apache
6. [ ] Разобраться с HTTPS — починить Let's Encrypt или перевыпустить
7. [ ] Перевести Apache на systemd (пока запущен через apachectl)

# SESSION_LOG.md — история работы над eddytester.com

> Автоматически обновляется агентом. Не редактировать вручную.

---

## 2026-06-24

### Туториал-тест и стили на /glearning

- Добавлен `'l1': 'tutorial'` в LESSON_MAP — тест в уроке 1 рендерится через renderTest()
- Кастомные testTitle/testSubtitle из LESSONS_CONFIG с fallback на дефолтные
- Подзаголовок теста: 20px жирный (как заголовок), убран muted-цвет
- Обновлён AI_AGENT.md: 6 уроков с тестами (включая tutorial), LESSON_MAP, renderTest

→ Дальше: запись урока 1

---

## 2026-06-17

### Настройка Claude Code + DeepSeek стека

- Обновлен CLAUDE.md: `@AI_AGENT.md`, стек бэкендов
- Создан `scripts/deploy-server.sh` — backup, fetch, checkout, Apache reload, health check
- Обновлен `README.md` — deploy flow, откат, Cloudflare
- Настроена глобальная конфигурация `~/.claude/`

### Рефакторинг BACKLOG.md — единый бэклог

- BACKLOG.md сокращён до ссылки на v0-test-api/BACKLOG.md (раздел «🌐 Сайт»)
- Все задачи сайта теперь в едином бэклоге v0-test-api

→ Дальше: работа над контентом

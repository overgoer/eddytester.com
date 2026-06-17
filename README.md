# eddytester.com

Лендинг API Практикума и курса по тестированию API.

- [CLAUDE.md](./CLAUDE.md) — карта проекта, известные проблемы, бэкенды
- [AI_AGENT.md](./AI_AGENT.md) — полный кросс-репозиторный справочник
- [TESTS.md](./TESTS.md) — все практические тесты курса (5 уроков, 42 бага)
- [INFRA.md](./INFRA.md) — инфраструктура сервера
- [SERVER_MAP.md](./SERVER_MAP.md) — карта доменов, портов и процессов
- [BACKLOG.md](./BACKLOG.md) — бэклог и планы

## 📦 Деплой

```bash
# Быстрый деплой ветки (через Claude Code скилл)
/deploy site <branch>

# Или вручную:
git push origin <branch>
ssh timeweb "bash /var/www/eddytester.com/scripts/deploy-server.sh <branch>"
```

**Флоу:** Ветка → деплой на прод → тест → Ок? → мердж в main.

```bash
# Откат (если что-то пошло не так)
ssh timeweb "cd /var/www/eddytester.com && git checkout main"
```

**Не забыть:** сбросить кэш Cloudflare после деплоя статики. Серверный скрипт: [scripts/deploy-server.sh](./scripts/deploy-server.sh)

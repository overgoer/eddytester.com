#!/bin/bash
set -e

# deploy.sh — деплой eddytester.com на Timeweb-сервер
# Использование:
#   ./deploy.sh                          # деплой (из контекста CI или локально)
#   SSH_KEY=... SERVER_HOST=... ./deploy.sh  # с явными параметрами
#
# Для CI (GitHub Actions) переменные берутся из secrets.
# Для локального запуска читает ~/.ssh/config (хост: timeweb).

SRC="${DEPLOY_SRC:-.}"
DEST="${DEPLOY_DEST:-/var/www/eddytester.com}"
EXCLUDE="${DEPLOY_EXCLUDE:-deploy.sh .git .github docs BACKLOG.md test.html page101918416.html.bak readme.txt .env}"

# Собираем rsync exclude-флаги
EXCLUDE_FLAGS=""
for pat in $EXCLUDE; do
  EXCLUDE_FLAGS="$EXCLUDE_FLAGS --exclude=$pat"
done

deploy_rsync() {
  local ssh_cmd="$1"
  rsync -avz --delete $EXCLUDE_FLAGS \
    -e "$ssh_cmd" \
    "$SRC/" "${SERVER_USER}@${SERVER_HOST}:${DEST}"
}

if [ -n "$SSH_KEY" ] && [ -n "$SERVER_HOST" ] && [ -n "$SERVER_USER" ]; then
  # CI-режим: ключ из переменной → во временный файл
  PORT="${SERVER_PORT:-22}"
  KEY_FILE=$(mktemp)
  echo "$SSH_KEY" > "$KEY_FILE"
  chmod 600 "$KEY_FILE"
  trap "rm -f $KEY_FILE" EXIT
  echo "▶ Deploying via CI to ${SERVER_USER}@${SERVER_HOST}:${PORT} ..."
  SSH_CMD="ssh -p $PORT -i $KEY_FILE -o StrictHostKeyChecking=no"
  deploy_rsync "$SSH_CMD"
elif ssh -o StrictHostKeyChecking=no timeweb echo ok 2>/dev/null; then
  # Локальный режим: через ~/.ssh/config (хост timeweb)
  echo "▶ Deploying via local SSH config (timeweb) ..."
  SRC_DIR="$(dirname "$0")"
  rsync -avz --delete $EXCLUDE_FLAGS \
    -e "ssh -o StrictHostKeyChecking=no" \
    "$SRC_DIR/" "timeweb:${DEST}"
else
  echo "❌ Ничего не работает. Укажи SSH_KEY+SERVER_HOST+SERVER_USER или настрой ~/.ssh/config для хоста timeweb."
  exit 1
fi

echo "✅ Deploy complete: $(date)"

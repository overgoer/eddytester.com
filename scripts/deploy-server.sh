#!/bin/bash
# eddytester.com deploy script — выполняется НА СЕРВЕРЕ timeweb
# Вызов: bash scripts/deploy-server.sh <branch> [--skip-health]
# Размещение: /var/www/eddytester.com/scripts/deploy-server.sh

set -e

BRANCH="${1:-main}"
SKIP_HEALTH="${2:-}"
SITE_DIR="/var/www/eddytester.com"
HEALTH_URL="https://eddytester.com/"

echo "=== Deploy eddytester.com ==="
echo "Branch: $BRANCH"
echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"

cd "$SITE_DIR"

# 1. Бэкап
echo "[1/4] Backup..."
git tag -f "backup/$(date +%Y-%m-%d)" 2>/dev/null || true

# 2. Fetch + checkout
echo "[2/4] Fetch + checkout $BRANCH..."
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

# 3. Apache config (если менялся)
echo "[3/4] Apache config check..."
if git diff --name-only HEAD@{1} HEAD 2>/dev/null | grep -qE "(apache/|\.htaccess)"; then
    sudo cp apache/sites-available/*.conf /etc/apache2/sites-available/ 2>/dev/null || true
    sudo apachectl configtest && sudo apachectl -k graceful
    echo "Apache reloaded"
fi

# 4. Health check
if [ "$SKIP_HEALTH" != "--skip-health" ]; then
    echo "[4/4] Health check..."
    HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' "$HEALTH_URL" 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
        echo "OK: health check $HTTP_CODE"
    else
        echo "FAIL: health check returned $HTTP_CODE"
        exit 1
    fi
fi

echo "=== Deploy complete: $BRANCH ==="

#!/bin/bash
set -e
cd /var/www/eddytester.com
echo "=== Pulling from GitHub ==="
git pull origin main

echo "=== Copying webhook ==="
cp server/yookassa.js /var/www/v0-test-api/v0-test-api/src/routes/yookassa.js

echo "=== Restarting services ==="
pm2 restart payment-yookassa
pm2 restart v0-test-api
echo "=== Deploy done at $(date) ==="

#!/bin/bash
set -e

echo "==> Writing .env file from environment variables..."
cat > /var/www/.env <<EOF
APP_NAME=${APP_NAME:-Expensio}
APP_ENV=production
APP_DEBUG=false
APP_KEY=${APP_KEY}
APP_URL=${APP_URL}

DB_CONNECTION=mysql
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT:-3306}
DB_DATABASE=${DB_DATABASE}
DB_USERNAME=${DB_USERNAME}
DB_PASSWORD=${DB_PASSWORD}

CACHE_DRIVER=file
SESSION_DRIVER=file
QUEUE_CONNECTION=sync

SANCTUM_STATEFUL_DOMAINS=${SANCTUM_STATEFUL_DOMAINS}
FRONTEND_URL=${FRONTEND_URL}

LOG_CHANNEL=stderr
EOF

echo "==> Clearing config cache..."
php artisan config:clear

echo "==> Running migrations..."
php artisan migrate --force

echo "==> Caching config and routes..."
php artisan config:cache
php artisan route:cache

echo "==> Starting Laravel server..."
php artisan serve --host=0.0.0.0 --port=${PORT:-8000}
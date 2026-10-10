#!/bin/sh
set -eu

cd /var/www/html

if [ ! -f .env ]; then
    cp .env.example .env
fi

composer install --no-interaction --prefer-dist --optimize-autoloader

mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs

if [ "${DB_CONNECTION:-sqlite}" = "sqlite" ]; then
    sqlite_database="${DB_DATABASE:-database/database.sqlite}"

    if [ "$sqlite_database" != ":memory:" ]; then
        mkdir -p "$(dirname "$sqlite_database")"
        touch "$sqlite_database"
    fi
fi

if ! grep -q '^APP_KEY=base64:' .env; then
    php artisan key:generate --force
fi

php artisan migrate --force

exec php artisan serve --host=0.0.0.0 --port=8000

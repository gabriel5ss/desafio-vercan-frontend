#!/bin/sh
set -eu

cd /var/www/html

# Remove config cached outside Docker so its values cannot override Compose env vars.
rm -f bootstrap/cache/config.php

if [ ! -f .env ]; then
    cp .env.example .env
fi

composer install --no-interaction --prefer-dist --optimize-autoloader

mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs

if ! grep -q '^APP_KEY=base64:' .env; then
    php artisan key:generate --force
fi

php artisan migrate --force

php artisan db:seed

host_uid="${HOST_UID:-1000}"
host_gid="${HOST_GID:-1000}"

chown -R "$host_uid:$host_gid" .env vendor storage bootstrap/cache

exec gosu "$host_uid:$host_gid" php artisan serve --host=0.0.0.0 --port=8000

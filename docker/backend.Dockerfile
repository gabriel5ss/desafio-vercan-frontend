FROM php:8.5-cli

RUN apt-get update && apt-get install -y --no-install-recommends \
        libicu-dev \
        libonig-dev \
        libsqlite3-dev \
        libzip-dev \
        unzip \
    && docker-php-ext-install -j"$(nproc)" bcmath intl mbstring pdo_sqlite zip \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY --from=laravel /artisan ./artisan
COPY --from=laravel /app ./app
COPY --from=laravel /bootstrap ./bootstrap
COPY --from=laravel /config ./config
COPY --from=laravel /database ./database
COPY --from=laravel /public ./public
COPY --from=laravel /resources ./resources
COPY --from=laravel /routes ./routes
COPY --from=laravel /storage ./storage
COPY --from=laravel /composer.json /composer.lock ./
COPY --from=laravel /.env.example ./.env.example
COPY docker/backend-entrypoint.sh /usr/local/bin/backend-entrypoint

RUN chmod +x /usr/local/bin/backend-entrypoint \
    && composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader

EXPOSE 8000

ENTRYPOINT ["backend-entrypoint"]

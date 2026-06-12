FROM php:8.2-cli

RUN apt-get update && apt-get install -y \
    git curl libpng-dev libonig-dev libxml2-dev \
    libzip-dev zip unzip \
    nodejs npm \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

COPY . .

RUN composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev

RUN npm install && npm run build

# Create .env file from Railway environment variables
RUN echo "APP_NAME=${APP_NAME}" >> .env && \
    echo "APP_ENV=production" >> .env && \
    echo "APP_DEBUG=false" >> .env && \
    echo "APP_KEY=${APP_KEY}" >> .env && \
    echo "APP_URL=${APP_URL}" >> .env && \
    echo "" >> .env && \
    echo "DB_CONNECTION=mysql" >> .env && \
    echo "DB_HOST=${MYSQLHOST}" >> .env && \
    echo "DB_PORT=${MYSQLPORT}" >> .env && \
    echo "DB_DATABASE=${MYSQLDATABASE}" >> .env && \
    echo "DB_USERNAME=${MYSQLUSER}" >> .env && \
    echo "DB_PASSWORD=${MYSQLPASSWORD}" >> .env && \
    echo "" >> .env && \
    echo "CACHE_DRIVER=file" >> .env && \
    echo "SESSION_DRIVER=file" >> .env && \
    echo "QUEUE_CONNECTION=sync" >> .env

RUN php artisan config:clear
RUN php artisan cache:clear

EXPOSE 8000

CMD php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=${PORT:-8000}
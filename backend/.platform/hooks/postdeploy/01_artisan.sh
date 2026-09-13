#!/bin/bash
# Runs after the new app version is live at /var/app/current and the web
# server has been (re)started. EB supplies APP_KEY, DB_*, APP_URL, etc. as
# real process environment variables (Configuration > Environment
# properties) — there is no .env file on the instance, and Laravel doesn't
# need one; env() reads straight from the environment.
#
# Intentionally NOT run here: `php artisan key:generate` (would rotate
# APP_KEY on every deploy, invalidating every existing Sanctum token and
# any encrypted data — APP_KEY must be generated once and set as a fixed
# EB environment property) and `--seed` (would reseed demo accounts into
# the production database on every deploy).
set -e

cd /var/app/current

php artisan migrate --force

php artisan config:cache
php artisan route:cache
php artisan view:cache

# Laravel writes logs, compiled views, and framework cache files here
# regardless of whether the app stores its own files on disk.
chmod -R 775 storage bootstrap/cache || true

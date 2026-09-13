#!/bin/bash
# Runs after the new app version is extracted to /var/app/staging but
# before it goes live. vendor/ is excluded from git (see .gitignore), so
# dependencies must be installed here rather than assumed to be present in
# the deployed source bundle. --no-dev keeps test/dev-only packages
# (PHPUnit, Faker, Pint, ...) out of the production install; the QR
# package's ext-gd requirement is provided by .platform/packages.yaml.
set -e

cd /var/app/staging

composer install --no-dev --optimize-autoloader --no-interaction

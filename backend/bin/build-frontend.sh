#!/bin/bash
# Builds /frontend and copies the static output into public/, so a single
# `eb deploy` from backend/ ships both the API and the SPA. Run this before
# every deploy that includes frontend changes — the PHP EB platform has no
# Node.js, so the build can't happen on the instance the way `composer
# install` does; it has to be done here and shipped as part of the bundle
# (see .ebignore, which lets these gitignored files reach the zip).
#
# VITE_API_URL=/api (same-origin, since the SPA is now served by this same
# Laravel app) overrides frontend/.env's absolute localhost URL, which is
# for local dev only (separate ports, cross-origin).
set -e

script_dir="$(cd "$(dirname "$0")" && pwd)"
backend_dir="$script_dir/.."
frontend_dir="$backend_dir/../frontend"

cd "$frontend_dir"
VITE_API_URL=/api npm run build

cd "$backend_dir"
rm -rf public/assets
cp -r "$frontend_dir/dist/." public/

echo "Frontend built and copied into backend/public. Run 'eb deploy' from backend/ next."

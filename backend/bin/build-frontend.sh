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
#
# MSYS_NO_PATHCONV=1 is required on Git Bash/MSYS2 (Windows): MSYS2
# auto-converts any argument or env var value that looks like a Unix path
# into a Windows path before handing it to a native program — npm (which
# spawns node.exe, a native Windows binary) would otherwise see
# VITE_API_URL silently rewritten from "/api" to something like
# "C:/Program Files/Git/api", which Vite then bakes into the bundle as the
# axios baseURL. The browser then treats "C:" as a URL scheme and every
# API request fails with "Unsupported protocol C:". Harmless no-op on
# real Linux/macOS shells, where this variable doesn't exist.
set -e

script_dir="$(cd "$(dirname "$0")" && pwd)"
backend_dir="$script_dir/.."
frontend_dir="$backend_dir/../frontend"

cd "$frontend_dir"
MSYS_NO_PATHCONV=1 VITE_API_URL=/api npm run build

cd "$backend_dir"

# Remove everything previously copied in by this script, not just
# public/assets — otherwise a file dist/ used to produce (e.g. an icon
# that's since been dropped from frontend/public) lingers here forever.
# Laravel's own public/ files (index.php, .htaccess, favicon.ico,
# robots.txt) are the only things this script must never touch.
for entry in public/*; do
    name="$(basename "$entry")"
    case "$name" in
        index.php|.htaccess|favicon.ico|robots.txt) ;;
        *) rm -rf "$entry" ;;
    esac
done

cp -r "$frontend_dir/dist/." public/

echo "Frontend built and copied into backend/public. Run 'eb deploy' from backend/ next."

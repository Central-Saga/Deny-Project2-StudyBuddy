#!/bin/sh
set -eu

# Gunakan APP_KEY dari environment jika sudah tersedia.
# Jika kosong, buat dan simpan key secara persisten.
KEY_FILE="/var/www/.runtime-secrets/app_key"

if [ -z "${APP_KEY:-}" ]; then
    if [ ! -s "$KEY_FILE" ]; then
        umask 077
        php -r 'echo "base64:" . base64_encode(random_bytes(32)) . PHP_EOL;' > "$KEY_FILE"
    fi

    APP_KEY="$(cat "$KEY_FILE")"
    export APP_KEY
fi

# Migrasi wajib berhasil sebelum Laravel melayani request.
php artisan migrate --force

# Jalankan Laravel sebagai proses utama container.
exec php artisan serve --host=0.0.0.0 --port=8000

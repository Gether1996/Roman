#!/bin/sh
set -e

mkdir -p /data/media /data

if [ ! -f "${CONFIG_INI_PATH:-/data/config.ini}" ]; then
    cp /app/config.ini "${CONFIG_INI_PATH:-/data/config.ini}"
fi

python manage.py migrate --noinput
exec gunicorn Roman.wsgi:application --workers 2 --bind 0.0.0.0:8000 --timeout 60 --access-logfile -

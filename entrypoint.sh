#!/bin/sh
set -e

mkdir -p /data/media /data

python manage.py migrate --noinput
# One-time copy of config.ini (schedules, booking rules) into the database.
# Skipped automatically once the DB holds the settings, so the admin's changes are never overwritten.
python manage.py import_config_ini || echo "[config] import failed – using defaults / existing DB values"
exec gunicorn Roman.wsgi:application --workers 2 --bind 0.0.0.0:8000 --timeout 60 --access-logfile -

"""Copy settings from config.ini into the database (one time).

Runs automatically on every container start (entrypoint.sh), but only does
something when the database has no settings yet – so a redeploy never
overwrites changes the admin made in the panel.

    python manage.py import_config_ini                 # one-time import
    python manage.py import_config_ini --force         # overwrite DB with the file
    python manage.py import_config_ini --path x.ini    # import a specific file
    python manage.py import_config_ini --show          # print current DB settings
"""
from django.core.management.base import BaseCommand

from Roman.backend_funcs.system_config import config_dict, import_ini


class Command(BaseCommand):
    help = 'Imports config.ini (therapists\' schedules, booking rules) into the database – only once unless --force.'

    def add_arguments(self, parser):
        parser.add_argument('--path', help='Path to config.ini (default: settings.CONFIG_INI_PATH)')
        parser.add_argument('--force', action='store_true', help='Overwrite settings already stored in the database')
        parser.add_argument('--show', action='store_true', help='Only print the settings currently in use')

    def handle(self, *args, **options):
        if options['show']:
            for section, values in config_dict().items():
                self.stdout.write(f'[{section}]')
                for key, value in values.items():
                    self.stdout.write(f'{key} = {value}')
                self.stdout.write('')
            return
        imported, message = import_ini(options.get('path'), force=options['force'])
        self.stdout.write((self.style.SUCCESS if imported else self.style.WARNING)(f'[config] {message}'))

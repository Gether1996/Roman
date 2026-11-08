import json
import shutil
import tempfile
from datetime import datetime, time, timedelta
from pathlib import Path

from django.conf import settings
from django.test import TestCase, override_settings

from accounts.models import CustomUser
from Roman.backend_funcs import content as content_store
from Roman.backend_funcs.reservation import approve_token
from viewer.models import AlreadyMadeReservation, Reservation, SiteContentRevision


def _config_copy():
    tmp = Path(tempfile.mkdtemp()) / 'config.ini'
    shutil.copy(settings.BASE_DIR / 'config.ini', tmp)
    return tmp


CONFIG = _config_copy()


def next_weekday(weekday_name, min_days=3):
    day = datetime.now().date() + timedelta(days=min_days)
    while day.strftime('%A') != weekday_name:
        day += timedelta(days=1)
    return day


@override_settings(CONFIG_INI_PATH=CONFIG, ALLOWED_HOSTS=['testserver'],
                   EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class BaseTest(TestCase):
    def setUp(self):
        self.admin = CustomUser.objects.create(email='admin@test.sk', username='admin@test.sk', is_superuser=True, is_staff=True)
        self.admin.set_password('x-strong-pass-1')
        self.admin.save()

    def post(self, url, data, client=None):
        return (client or self.client).post(url, json.dumps(data), content_type='application/json')

    def booking(self, **overrides):
        day = next_weekday('Monday')
        data = {
            'selectedDate': day.strftime('%Y-%m-%d'), 'timeSlot': '10:00', 'duration': 60,
            'massageName': '60 min masáž', 'nameSurname': 'Ján Test', 'email': 'jan@test.sk',
            'phone': '0900123456', 'worker': 'Roman', 'note': '', 'consent': True,
        }
        data.update(overrides)
        return data


class ContentTests(BaseTest):
    def test_defaults_match_previous_site(self):
        content = content_store.get_content()
        services = {s['backend_name']: s for s in content['services']}
        self.assertEqual(services['60 min masáž']['price'], '35 €')
        self.assertEqual(services['45 min SM systém']['workers'], ['Roman'])
        self.assertEqual([t['key'] for t in content['therapists']], ['Roman', 'Evka'])
        self.assertEqual(content['contact']['email'], 'salonaminask@gmail.com')

    def test_public_bootstrap_hides_private_data(self):
        AlreadyMadeReservation.objects.create(name_surname='Tajný klient', email='x@y.sk')
        data = self.client.get('/api/bootstrap/').json()
        self.assertNotIn('notification_email', data['content']['general'])
        options = self.client.get('/api/reservation-bootstrap/').json()['user_options']
        self.assertEqual(options, [])

    def test_admin_can_save_and_restore_section(self):
        self.client.force_login(self.admin)
        response = self.post('/api/admin/content/hero/', {'data': {'subtitle': {'sk': 'Nový text', 'en': ''}}})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(content_store.get_section('hero')['subtitle']['sk'], 'Nový text')
        self.post('/api/admin/content/hero/', {'data': {'subtitle': {'sk': 'Druhý text', 'en': ''}}})
        revision = SiteContentRevision.objects.filter(section='hero').first()
        self.post(f'/api/admin/revisions/{revision.id}/restore/', {})
        self.assertEqual(content_store.get_section('hero')['subtitle']['sk'], 'Nový text')

    def test_invalid_content_is_rejected(self):
        self.client.force_login(self.admin)
        bad_duration = self.post('/api/admin/content/services/', {'data': [{'name': {'sk': 'X'}, 'duration': 33, 'workers': ['Roman']}]})
        self.assertEqual(bad_duration.status_code, 400)
        bad_link = self.post('/api/admin/content/contact/', {'data': {'instagram': 'javascript:alert(1)'}})
        self.assertEqual(bad_link.status_code, 400)
        remove_worker = self.post('/api/admin/content/therapists/', {'data': [{'key': 'Roman', 'name': 'Roman'}]})
        self.assertEqual(remove_worker.status_code, 400)

    def test_admin_api_requires_superuser(self):
        for url in ('/api/admin/dashboard/', '/api/admin/reservations/', '/api/admin/content/', '/api/admin/clients/'):
            self.assertEqual(self.client.get(url).status_code, 403, url)


class BookingTests(BaseTest):
    def test_public_booking_requires_consent(self):
        response = self.post('/create_reservation/', self.booking(consent=False))
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()['error_code'], 'CONSENT_REQUIRED')
        ok = self.post('/create_reservation/', self.booking())
        self.assertEqual(ok.status_code, 200, ok.content)
        self.assertIsNotNone(Reservation.objects.get().consent_at)

    def test_public_booking_rejects_unknown_service_and_too_soon(self):
        self.assertEqual(self.post('/create_reservation/', self.booking(massageName='Zlatá masáž')).json()['error_code'], 'INVALID_SERVICE')
        tomorrow = (datetime.now().date() + timedelta(days=1)).strftime('%Y-%m-%d')
        self.assertEqual(self.post('/create_reservation/', self.booking(selectedDate=tomorrow)).json()['error_code'], 'TOO_SOON')

    def test_booking_disabled_for_therapist(self):
        therapists = content_store.get_section('therapists')
        therapists[0]['booking_enabled'] = False
        content_store.save_section('therapists', therapists)
        self.assertEqual(self.post('/create_reservation/', self.booking()).json()['error_code'], 'WORKER_UNAVAILABLE')

    def test_admin_booking_unchanged(self):
        self.client.force_login(self.admin)
        response = self.post('/create_reservation/', self.booking(consent=None, email='', phone='', massageName='Vlastná služba'))
        self.assertEqual(response.status_code, 200, response.content)
        self.assertTrue(Reservation.objects.get().active)


class ApproveLinkTests(BaseTest):
    def make(self, **kwargs):
        start = datetime.combine(next_weekday('Monday'), time(10, 0))
        return Reservation.objects.create(name_surname='A', worker='Roman', status='Čaká sa schválenie', active=False,
                                          datetime_from=start, datetime_to=start + timedelta(hours=1), **kwargs)

    def test_signed_link_approves_with_one_click(self):
        r = self.make(consent_at=datetime.now())
        response = self.client.get(f'/approve_reservation_mail/{r.id}/?t={approve_token(r.id)}')
        self.assertEqual(response.status_code, 200)
        r.refresh_from_db()
        self.assertTrue(r.active)

    def test_guessed_link_is_refused_for_new_reservations(self):
        r = self.make(consent_at=datetime.now())
        self.assertEqual(self.client.get(f'/approve_reservation_mail/{r.id}/').status_code, 403)
        self.assertEqual(self.client.get(f'/approve_reservation_mail/{r.id}/?t=wrong').status_code, 403)
        r.refresh_from_db()
        self.assertFalse(r.active)

    def test_legacy_link_from_old_email_still_works(self):
        r = self.make()
        self.client.get(f'/approve_reservation_mail/{r.id}/')
        r.refresh_from_db()
        self.assertTrue(r.active)


class AdminReservationTests(BaseTest):
    def setUp(self):
        super().setUp()
        self.client.force_login(self.admin)
        day = next_weekday('Monday')
        self.a = Reservation.objects.create(name_surname='A', worker='Roman', status='Schválená', active=True,
                                            datetime_from=datetime.combine(day, time(10)), datetime_to=datetime.combine(day, time(11)))
        self.b = Reservation.objects.create(name_surname='B', worker='Evka', status='Schválená', active=True,
                                            datetime_from=datetime.combine(day, time(13)), datetime_to=datetime.combine(day, time(14)))

    def test_move_conflict_respects_shared_room_and_break(self):
        # 11:00 start is inside the 15-min break after A (A ends 11:00) -> conflict
        response = self.post(f'/api/admin/reservations/{self.b.id}/update/', {'time_from': '11:00', 'duration': 60})
        self.assertEqual(response.status_code, 409)
        ok = self.post(f'/api/admin/reservations/{self.b.id}/update/', {'time_from': '11:15', 'duration': 60})
        self.assertEqual(ok.status_code, 200)
        forced = self.post(f'/api/admin/reservations/{self.b.id}/update/', {'time_from': '10:30', 'duration': 60, 'force': True})
        self.assertEqual(forced.status_code, 200)

    def test_list_and_dashboard_have_no_earnings(self):
        data = self.client.get('/api/admin/reservations/?when=all').json()
        self.assertEqual(data['total'], 2)
        self.assertNotIn('price', data['reservations'][0])
        dash = self.client.get('/api/admin/dashboard/').json()
        self.assertNotIn('month_revenue', dash['stats'])

    def test_deleting_user_keeps_reservations(self):
        user = CustomUser.objects.create(email='u@test.sk', username='u@test.sk')
        self.a.user = user
        self.a.save()
        self.assertEqual(self.client.delete(f'/api/admin/users/{user.id}/').status_code, 200)
        self.assertTrue(Reservation.objects.filter(id=self.a.id).exists())


class SystemConfigTests(BaseTest):
    def test_import_is_one_time_and_force_overwrites(self):
        from io import StringIO
        from django.core.management import call_command
        from Roman.backend_funcs.system_config import load_config
        from viewer.models import ConfigEntry

        ini = Path(tempfile.mkdtemp()) / 'config.ini'
        ini.write_text('[settings-roman]\ndays_ahead = 12\nworking_days = [\'Monday\']\n'
                       '[settings]\nreservations_per_page = 7\nbreak_minutes = 20\n', encoding='utf-8')
        call_command('import_config_ini', path=str(ini), stdout=StringIO())
        config = load_config()
        self.assertEqual(config['settings-roman']['days_ahead'], '12')
        self.assertEqual(config['settings']['break_minutes'], '20')
        # missing values are completed from the defaults (= original config.ini)
        self.assertEqual(config['settings-evka']['days_ahead'], '45')

        # a second deploy must not overwrite what the admin changed in the panel
        ConfigEntry.objects.filter(section='settings-roman', key='days_ahead').update(value='99')
        call_command('import_config_ini', path=str(ini), stdout=StringIO())
        self.assertEqual(load_config()['settings-roman']['days_ahead'], '99')

        call_command('import_config_ini', path=str(ini), force=True, stdout=StringIO())
        self.assertEqual(load_config()['settings-roman']['days_ahead'], '12')

    def test_admin_settings_are_saved_in_db_not_file(self):
        from viewer.models import ConfigEntry
        before = CONFIG.read_text(encoding='utf-8')
        self.client.force_login(self.admin)
        response = self.post('/save_settings/', {'days_ahead_evka': 21, 'break_minutes': 10})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(ConfigEntry.objects.get(section='settings-evka', key='days_ahead').value, '21')
        self.assertEqual(self.client.get('/api/settings-bootstrap/').json()['rules']['break_minutes'], 10)
        self.assertEqual(CONFIG.read_text(encoding='utf-8'), before)  # config.ini untouched

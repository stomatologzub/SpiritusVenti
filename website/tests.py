from unittest.mock import patch
from smtplib import SMTPException
from django.core import mail
from django.contrib.staticfiles import finders
from django.test import Client, SimpleTestCase, override_settings

@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend', EMAIL_HOST='smtp.example.com', DEFAULT_FROM_EMAIL='site@example.com', CONTACT_EMAIL='owner@example.com')
class WebsiteTests(SimpleTestCase):
    def setUp(self):
        self.client = Client(enforce_csrf_checks=True)
        self.client.get('/')
        self.token = self.client.cookies['csrftoken'].value
        self.data = {'name': 'Test User', 'phone': '+421 900 123 456', 'email': 'test@example.com', 'message': 'Test message'}

    def post(self, **changes):
        return self.client.post('/api/contact/', {**self.data, **changes}, HTTP_X_CSRFTOKEN=self.token)

    def test_home_and_assets(self):
        response = self.client.get('/')
        self.assertContains(response, '/static/style.css')
        self.assertContains(response, '/static/script.js')
        self.assertContains(response, 'action="/api/contact/"')
        for name in ['style.css', 'script.js', 'gallery/rooftop-hvac.png', 'gallery/commercial-installation.jpg', 'gallery/service-maintenance.webp', 'gallery/system-commissioning.jpg']:
            self.assertIsNotNone(finders.find(name))

    def test_contact_sends_email(self):
        self.assertEqual(self.post().status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ['owner@example.com'])
        self.assertEqual(mail.outbox[0].reply_to, ['test@example.com'])
        self.assertIn(self.data['phone'], mail.outbox[0].body)

    def test_optional_email(self):
        self.assertEqual(self.post(email='').status_code, 200)
        self.assertEqual(mail.outbox[0].reply_to, [])

    def test_invalid_fields(self):
        for invalid in [{'name': ''}, {'phone': 'abcd'}, {'email': 'invalid'}, {'message': 'a' * 5001}, {'email': 'x@example.com\nBcc: other@example.com'}]:
            self.assertEqual(self.post(**invalid).status_code, 400)
        self.assertEqual(len(mail.outbox), 0)

    def test_csrf_required(self):
        self.assertEqual(self.client.post('/api/contact/', self.data).status_code, 403)

    def test_post_required(self):
        self.assertEqual(self.client.get('/api/contact/').status_code, 405)

    @override_settings(EMAIL_HOST='')
    def test_missing_smtp(self):
        self.assertEqual(self.post().status_code, 503)

    @patch('website.views.EmailMessage.send', side_effect=SMTPException('failed'))
    def test_delivery_failure(self, send):
        self.assertEqual(self.post().status_code, 502)

    def test_private_files_not_exposed(self):
        for url in ['/config/settings.py', '/.env', '/manage.py']:
            self.assertEqual(self.client.get(url).status_code, 404)

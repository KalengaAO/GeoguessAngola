from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core import mail
from django.test import override_settings
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from rest_framework.test import APITestCase

from game.models import GameSession, PlayerStats

User = get_user_model()


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class AccountApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="explorer",
            email="explorer@example.com",
            password="Old-password123",
        )
        self.client.force_authenticate(self.user)

    def test_password_change_requires_current_password(self):
        response = self.client.post(
            "/api/account/password/change/",
            {
                "current_password": "Old-password123",
                "new_password": "New-password123",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("New-password123"))

    def test_password_reset_request_and_confirmation(self):
        response = self.client.post(
            "/api/account/password/reset/",
            {"email": self.user.email},
        )
        self.assertEqual(response.status_code, 202)
        self.assertEqual(len(mail.outbox), 1)

        token = default_token_generator.make_token(self.user)
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        self.client.force_authenticate(None)
        response = self.client.post(
            "/api/account/password/reset/confirm/",
            {
                "uid": uid,
                "token": token,
                "new_password": "Reset-password123",
            },
        )
        self.assertEqual(response.status_code, 200)

        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("Reset-password123"))

    def test_public_profile_and_search_do_not_expose_email(self):
        PlayerStats.objects.create(
            user=self.user,
            total_score=1200,
            games_played=2,
            best_score=800,
            completed_rounds=10,
        )

        response = self.client.get(
            f"/api/account/players/{self.user.username}/"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["username"], self.user.username)
        self.assertEqual(response.data["total_score"], 1200)
        self.assertNotIn("email", response.data)

        response = self.client.get(
            "/api/account/players/",
            {"q": "expl"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]["username"], self.user.username)

    def test_account_deletion_removes_user_data(self):
        session = GameSession.objects.create(user=self.user)
        PlayerStats.objects.create(user=self.user)

        response = self.client.delete(
            "/api/account/delete/",
            {"password": "Old-password123"},
        )

        self.assertEqual(response.status_code, 204)
        self.assertFalse(User.objects.filter(pk=self.user.pk).exists())
        self.assertFalse(GameSession.objects.filter(pk=session.pk).exists())

# Create your tests here.

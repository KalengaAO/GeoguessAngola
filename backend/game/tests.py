from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from .models import (
    GameRound,
    GameSession,
    GeoLocation,
    LocationImage,
    PlayerStats,
)

User = get_user_model()


class GameApiTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="explorador",
            password="password123",
        )
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_leaderboard_orders_players_by_total_score(self):
        runner_up = User.objects.create_user(
            username="jogador-b",
            password="password123",
        )
        PlayerStats.objects.create(
            user=self.user,
            total_score=4500,
            best_score=4500,
            games_played=1,
        )
        PlayerStats.objects.create(
            user=runner_up,
            total_score=7200,
            best_score=4100,
            games_played=2,
        )

        response = self.client.get("/api/game/leaderboard/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [entry["username"] for entry in response.data["results"]],
            ["jogador-b", "explorador"],
        )
        self.assertEqual(
            [entry["rank"] for entry in response.data["results"]],
            [1, 2],
        )

    def test_timeout_marks_round_without_score_after_limit(self):
        session = GameSession.objects.create(user=self.user)
        location = GeoLocation.objects.create(
            name="Miradouro",
            province="Luanda",
            latitude=-8.8,
            longitude=13.2,
        )
        image = LocationImage.objects.create(
            location=location,
            image="locations/test.jpg",
        )
        game_round = GameRound.objects.create(
            session=session,
            image=image,
            round_number=1,
            started_at=timezone.now() - timedelta(
                seconds=settings.ROUND_TIME_SECONDS + 1
            ),
        )

        response = self.client.post(
            f"/api/game/rounds/{game_round.id}/timeout/"
        )

        game_round.refresh_from_db()
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["timed_out"])
        self.assertEqual(
            response.data["correct_location"],
            {"latitude": -8.8, "longitude": 13.2},
        )
        self.assertEqual(game_round.score, 0)
        self.assertIsNotNone(game_round.answered_at)

    def test_timeout_is_rejected_before_round_limit(self):
        session = GameSession.objects.create(user=self.user)
        location = GeoLocation.objects.create(
            name="Praia",
            province="Benguela",
            latitude=-12.6,
            longitude=13.4,
        )
        image = LocationImage.objects.create(
            location=location,
            image="locations/test.jpg",
        )
        game_round = GameRound.objects.create(
            session=session,
            image=image,
            round_number=1,
        )

        response = self.client.post(
            f"/api/game/rounds/{game_round.id}/timeout/"
        )

        self.assertEqual(response.status_code, 400)
        game_round.refresh_from_db()
        self.assertIsNone(game_round.answered_at)

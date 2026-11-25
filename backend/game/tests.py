from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
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

    def create_image(self, name):
        location = GeoLocation.objects.create(
            name=name,
            province="Luanda",
            latitude=-8.8,
            longitude=13.2,
        )
        return LocationImage.objects.create(
            location=location,
            image=f"locations/{name}.jpg",
        )

    def test_all_game_endpoints_require_authentication(self):
        endpoints = [
            ("POST", "/api/game/start/", None),
            ("GET", "/api/game/resume/", None),
            ("GET", "/api/game/history/", None),
            ("GET", "/api/game/leaderboard/", None),
            ("POST", "/api/game/rounds/1/answer/", {
                "latitude": -8.8,
                "longitude": 13.2,
            }),
            ("POST", "/api/game/rounds/1/timeout/", None),
            ("POST", "/api/game/1/next/", None),
            ("GET", "/api/game/1/status/", None),
            ("POST", "/api/game/1/complete/", None),
            ("POST", "/api/game/1/abandon/", None),
            ("GET", "/api/game/stats/", None),
        ]
        client = APIClient()

        for method, path, data in endpoints:
            request = getattr(client, method.lower())
            response = (
                request(path)
                if method == "GET"
                else request(path, data=data, format="json")
            )
            self.assertEqual(response.status_code, 401, path)

    def test_start_game_creates_session_and_first_round(self):
        self.create_image("Luanda")

        response = self.client.post("/api/game/start/")

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["session_status"], "in_progress")
        self.assertEqual(response.data["round"]["number"], 1)
        self.assertEqual(
            GameRound.objects.get(pk=response.data["round"]["id"]).session.user,
            self.user,
        )

    @override_settings(ROUNDS_PER_GAME=2)
    def test_answer_and_next_round_complete_game_after_configured_rounds(self):
        session = GameSession.objects.create(user=self.user)
        first_image = self.create_image("Luanda")
        self.create_image("Benguela")
        first_round = GameRound.objects.create(
            session=session,
            image=first_image,
            round_number=1,
        )

        first_answer = self.client.post(
            f"/api/game/rounds/{first_round.id}/answer/",
            {"latitude": -8.8, "longitude": 13.2},
            format="json",
        )
        self.assertEqual(first_answer.status_code, 200)
        self.assertEqual(first_answer.data["score"], 5000)

        next_round_response = self.client.post(
            f"/api/game/{session.id}/next/"
        )
        self.assertEqual(next_round_response.status_code, 200)
        self.assertEqual(
            next_round_response.data["round"]["number"],
            2,
        )

        second_answer = self.client.post(
            f"/api/game/rounds/{next_round_response.data['round']['id']}/answer/",
            {"latitude": -8.8, "longitude": 13.2},
            format="json",
        )
        self.assertEqual(second_answer.status_code, 200)

        finish_response = self.client.post(
            f"/api/game/{session.id}/next/"
        )
        self.assertEqual(finish_response.status_code, 200)
        self.assertEqual(finish_response.data["session_status"], "completed")
        self.assertEqual(
            GameSession.objects.get(pk=session.id).rounds.count(),
            2,
        )

    def test_game_status_returns_round_progress_and_rejects_other_owner(self):
        session = GameSession.objects.create(user=self.user)
        game_round = self.create_round(session)

        response = self.client.get(
            f"/api/game/{session.id}/status/"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["progress"]["answered_rounds"], 0)
        self.assertEqual(response.data["progress"]["total_rounds"], 5)
        self.assertEqual(response.data["rounds"][0]["id"], game_round.id)

        other_user = User.objects.create_user(
            username="other",
            password="password123",
        )
        self.client.force_authenticate(other_user)
        other_response = self.client.get(
            f"/api/game/{session.id}/status/"
        )
        self.assertEqual(other_response.status_code, 404)

    def test_history_rejects_invalid_pagination(self):
        response = self.client.get("/api/game/history/?limit=abc")

        self.assertEqual(response.status_code, 400)
        self.assertIn("números", response.data["detail"])

    def test_player_stats_endpoint_returns_authenticated_players_stats(self):
        response = self.client.get("/api/game/stats/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["total_score"], 0)
        self.assertEqual(response.data["games_played"], 0)

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

    def create_round(self, session, answered=False):
        location = GeoLocation.objects.create(
            name=f"Location {session.id}",
            province="Luanda",
            latitude=-8.8,
            longitude=13.2,
        )
        image = LocationImage.objects.create(
            location=location,
            image="locations/test.jpg",
        )
        return GameRound.objects.create(
            session=session,
            image=image,
            round_number=1,
            answered_at=timezone.now() if answered else None,
            score=100 if answered else 0,
        )

    def test_resume_returns_the_active_game(self):
        session = GameSession.objects.create(user=self.user)
        game_round = self.create_round(session)

        response = self.client.get("/api/game/resume/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["session_id"], session.id)
        self.assertEqual(response.data["round"]["id"], game_round.id)

    def test_start_rejects_a_second_active_game(self):
        session = GameSession.objects.create(user=self.user)
        self.create_round(session)

        response = self.client.post("/api/game/start/")

        self.assertEqual(response.status_code, 400)
        self.assertIn("partida em andamento", response.data["detail"])

    @override_settings(ROUNDS_PER_GAME=1)
    def test_complete_game_updates_status_and_player_stats(self):
        session = GameSession.objects.create(user=self.user)
        self.create_round(session, answered=True)

        response = self.client.post(
            f"/api/game/{session.id}/complete/"
        )

        self.assertEqual(response.status_code, 200)
        session.refresh_from_db()
        self.assertEqual(session.status, GameSession.Status.COMPLETED)
        self.assertEqual(response.data["total_score"], 100)
        stats = PlayerStats.objects.get(user=self.user)
        self.assertEqual(stats.games_played, 1)
        self.assertEqual(stats.total_score, 100)

    def test_abandon_game_is_recorded_in_history(self):
        session = GameSession.objects.create(user=self.user)
        self.create_round(session)

        response = self.client.post(
            f"/api/game/{session.id}/abandon/"
        )

        self.assertEqual(response.status_code, 200)
        session.refresh_from_db()
        self.assertEqual(session.status, GameSession.Status.ABANDONED)

        history_response = self.client.get("/api/game/history/")
        self.assertEqual(history_response.status_code, 200)
        self.assertEqual(
            history_response.data["results"][0]["session_id"],
            session.id,
        )

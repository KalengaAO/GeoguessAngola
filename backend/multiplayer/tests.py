from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.utils import timezone
from django.conf import settings
from datetime import timedelta
from rest_framework.test import APIClient

from .services import create_room
from game.models import GeoLocation, LocationImage
from .models import (
    MultiplayerMatch,
    MultiplayerRound,
)
from .services import join_room

User = get_user_model()


class MultiplayerRoomApiTests(TestCase):
    def setUp(self):
        self.host = User.objects.create_user(
            username="host",
            password="password123",
        )
        self.client = APIClient()
        self.client.force_authenticate(self.host)

    def test_room_participant_can_read_waiting_lobby(self):
        room = create_room(self.host)

        response = self.client.get(
            f"/api/multiplayer/rooms/{room.code}/"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["code"], room.code)
        self.assertEqual(response.data["status"], "waiting")
        self.assertEqual(response.data["host_username"], "host")
        self.assertEqual(
            [participant["username"] for participant in response.data["participants"]],
            ["host"],
        )

    def test_non_participant_cannot_read_lobby(self):
        room = create_room(self.host)
        outsider = User.objects.create_user(
            username="outsider",
            password="password123",
        )
        self.client.force_authenticate(outsider)

        response = self.client.get(
            f"/api/multiplayer/rooms/{room.code}/"
        )

        self.assertEqual(response.status_code, 400)

    def test_participant_can_leave_waiting_room(self):
        room = create_room(self.host)
        player = User.objects.create_user(
            username="player",
            password="password123",
        )
        join_room(player, room.code)
        self.client.force_authenticate(player)

        response = self.client.post(
            "/api/multiplayer/rooms/leave/",
            {"code": room.code},
        )

        self.assertEqual(response.status_code, 200)
        room.refresh_from_db()
        self.assertTrue(
            room.participants.filter(
                user=player,
                is_active=False,
            ).exists()
        )

    def test_timeout_completes_expired_round(self):
        room = create_room(self.host)
        location = GeoLocation.objects.create(
            name="Luanda",
            province="Luanda",
            latitude=-8.838333,
            longitude=13.234444,
        )
        image = LocationImage.objects.create(
            location=location,
            image="locations/test.jpg",
        )
        match = MultiplayerMatch.objects.create(room=room)
        multiplayer_round = MultiplayerRound.objects.create(
            match=match,
            image=image,
            round_number=1,
            started_at=timezone.now() - timedelta(
                seconds=settings.ROUND_TIME_SECONDS + 1
            ),
        )

        response = self.client.post(
            f"/api/multiplayer/rounds/{multiplayer_round.id}/timeout/"
        )

        self.assertEqual(response.status_code, 200)
        multiplayer_round.refresh_from_db()
        self.assertEqual(
            multiplayer_round.status,
            MultiplayerRound.Status.COMPLETED,
        )

    @override_settings(ROUNDS_PER_GAME=1)
    def test_only_host_can_advance_round(self):
        room = create_room(self.host)
        player = User.objects.create_user(
            username="player",
            password="password123",
        )
        join_room(player, room.code)
        location = GeoLocation.objects.create(
            name="Benguela",
            province="Benguela",
            latitude=-12.5763,
            longitude=13.4055,
        )
        image = LocationImage.objects.create(
            location=location,
            image="locations/test.jpg",
        )
        match = MultiplayerMatch.objects.create(room=room)
        multiplayer_round = MultiplayerRound.objects.create(
            match=match,
            image=image,
            round_number=1,
            status="completed",
        )

        self.client.force_authenticate(player)
        response = self.client.post(
            f"/api/multiplayer/matches/{match.id}/advance/"
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("anfitrião", response.data["detail"])

        self.client.force_authenticate(self.host)
        response = self.client.post(
            f"/api/multiplayer/matches/{match.id}/advance/"
        )
        self.assertEqual(response.status_code, 200)

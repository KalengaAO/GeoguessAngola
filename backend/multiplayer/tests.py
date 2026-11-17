from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from .services import create_room

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

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
    MultiplayerGuess,
    MultiplayerRound,
    RoomInvitation,
)
from accounts.models import Friendship
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

    def create_image(self, name, latitude=-8.838333, longitude=13.234444):
        location = GeoLocation.objects.create(
            name=name,
            province="Luanda",
            latitude=latitude,
            longitude=longitude,
        )
        return LocationImage.objects.create(
            location=location,
            image=f"locations/{name}.jpg",
        )

    def create_match_round(self, room, image, round_number=1, **round_fields):
        room.status = "in_progress"
        room.save(update_fields=["status"])
        match = MultiplayerMatch.objects.create(room=room)
        multiplayer_round = MultiplayerRound.objects.create(
            match=match,
            image=image,
            round_number=round_number,
            **round_fields,
        )
        return match, multiplayer_round

    def test_all_multiplayer_endpoints_require_authentication(self):
        endpoints = [
            ("POST", "/api/multiplayer/rooms/", {"max_players": 3}),
            ("POST", "/api/multiplayer/rooms/join/", {"code": "ABCDEFGH"}),
            ("PATCH", "/api/multiplayer/rooms/ready/", {
                "room_code": "ABCDEFGH",
                "is_ready": True,
            }),
            ("POST", "/api/multiplayer/rooms/leave/", {"code": "ABCDEFGH"}),
            ("POST", "/api/multiplayer/rooms/invitations/", {
                "code": "ABCDEFGH",
                "username": "player",
            }),
            ("GET", "/api/multiplayer/invitations/", None),
            ("POST", "/api/multiplayer/invitations/1/accept/", None),
            ("POST", "/api/multiplayer/rooms/start/", {"code": "ABCDEFGH"}),
            ("GET", "/api/multiplayer/rooms/ABCDEFGH/", None),
            ("GET", "/api/multiplayer/rooms/ABCDEFGH/match/", None),
            ("POST", "/api/multiplayer/rounds/1/guess/", {
                "guessed_latitude": -8.8,
                "guessed_longitude": 13.2,
            }),
            ("POST", "/api/multiplayer/rounds/1/timeout/", None),
            ("POST", "/api/multiplayer/matches/1/advance/", None),
            ("GET", "/api/multiplayer/matches/1/results/", None),
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

    def test_create_join_ready_and_start_match_endpoints(self):
        self.create_image("Luanda")
        create_response = self.client.post(
            "/api/multiplayer/rooms/",
            {"max_players": 3},
            format="json",
        )
        self.assertEqual(create_response.status_code, 201)
        room_code = create_response.data["code"]

        player = User.objects.create_user(
            username="player",
            password="password123",
        )
        player_client = APIClient()
        player_client.force_authenticate(player)
        join_response = player_client.post(
            "/api/multiplayer/rooms/join/",
            {"code": room_code.lower()},
            format="json",
        )
        self.assertEqual(join_response.status_code, 200)
        self.assertEqual(join_response.data["room_code"], room_code)

        host_ready = self.client.patch(
            "/api/multiplayer/rooms/ready/",
            {"room_code": room_code, "is_ready": True},
            format="json",
        )
        player_ready = player_client.patch(
            "/api/multiplayer/rooms/ready/",
            {"room_code": room_code, "is_ready": True},
            format="json",
        )
        self.assertEqual(host_ready.status_code, 200)
        self.assertEqual(player_ready.status_code, 200)
        self.assertTrue(host_ready.data["is_ready"])
        self.assertTrue(player_ready.data["is_ready"])

        start_response = self.client.post(
            "/api/multiplayer/rooms/start/",
            {"code": room_code},
            format="json",
        )
        self.assertEqual(start_response.status_code, 201)
        self.assertEqual(start_response.data["status"], "in_progress")
        self.assertEqual(
            MultiplayerRound.objects.filter(
                match_id=start_response.data["match_id"]
            ).count(),
            1,
        )

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

    def test_leave_completes_round_when_remaining_players_finished(self):
        room = create_room(self.host)
        player = User.objects.create_user(
            username="player",
            password="password123",
        )
        join_room(player, room.code)

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
        room.status = "in_progress"
        room.save(update_fields=["status"])
        match = MultiplayerMatch.objects.create(room=room)
        multiplayer_round = MultiplayerRound.objects.create(
            match=match,
            image=image,
            round_number=1,
        )

        host_participant = room.participants.get(user=self.host)
        MultiplayerGuess.objects.create(
            round=multiplayer_round,
            participant=host_participant,
            guessed_latitude=-8.838333,
            guessed_longitude=13.234444,
            distance_km=0,
            score=5000,
        )

        self.client.force_authenticate(player)
        response = self.client.post(
            "/api/multiplayer/rooms/leave/",
            {"code": room.code},
        )

        self.assertEqual(response.status_code, 200)
        multiplayer_round.refresh_from_db()
        self.assertEqual(
            multiplayer_round.status,
            MultiplayerRound.Status.COMPLETED,
        )

    def test_match_is_cancelled_when_only_one_player_remains(self):
        room = create_room(self.host)
        player = User.objects.create_user(
            username="player",
            password="password123",
        )
        join_room(player, room.code)

        room.status = "in_progress"
        room.save(update_fields=["status"])
        match = MultiplayerMatch.objects.create(room=room)

        self.client.force_authenticate(player)
        response = self.client.post(
            "/api/multiplayer/rooms/leave/",
            {"code": room.code},
        )

        self.assertEqual(response.status_code, 200)
        room.refresh_from_db()
        match.refresh_from_db()
        self.assertEqual(room.status, "closed")
        self.assertEqual(match.status, "cancelled")
        self.assertEqual(
            room.participants.filter(is_active=True).count(),
            0,
        )

    def test_friend_can_receive_and_accept_room_invitation(self):
        room = create_room(self.host)
        friend = User.objects.create_user(
            username="friend",
            password="password123",
        )
        Friendship.objects.create(
            requester=self.host,
            receiver=friend,
            status=Friendship.Status.ACCEPTED,
        )

        response = self.client.post(
            "/api/multiplayer/rooms/invitations/",
            {"code": room.code, "username": friend.username},
        )
        self.assertEqual(response.status_code, 201)
        invitation = RoomInvitation.objects.get(
            receiver=friend,
        )

        self.client.force_authenticate(friend)
        list_response = self.client.get("/api/multiplayer/invitations/")
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(list_response.data[0]["direction"], "received")

        accept_response = self.client.post(
            f"/api/multiplayer/invitations/{invitation.id}/accept/"
        )
        self.assertEqual(accept_response.status_code, 200)
        self.assertTrue(
            room.participants.filter(
                user=friend,
                is_active=True,
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
        )
        MultiplayerRound.objects.filter(pk=multiplayer_round.pk).update(
            started_at=timezone.now()
            - timedelta(seconds=settings.ROUND_TIME_SECONDS + 1)
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

    def test_match_time_is_per_round_after_five_minutes(self):
        room = create_room(self.host)
        player = User.objects.create_user(
            username="player",
            password="password123",
        )
        join_room(player, room.code)
        image = self.create_image("Luanda")
        match, multiplayer_round = self.create_match_round(room, image)
        MultiplayerMatch.objects.filter(pk=match.pk).update(
            started_at=timezone.now() - timedelta(minutes=5, seconds=1)
        )
        MultiplayerRound.objects.filter(pk=multiplayer_round.pk).update(
            started_at=timezone.now() - timedelta(seconds=10)
        )

        response = self.client.get(
            f"/api/multiplayer/rooms/{room.code}/match/"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "in_progress")
        self.assertEqual(response.data["duration_seconds"], 30)
        self.assertEqual(response.data["total_rounds"], 5)
        self.assertGreaterEqual(response.data["seconds_remaining"], 19)
        self.assertLessEqual(response.data["seconds_remaining"], 20)
        match.refresh_from_db()
        self.assertEqual(match.status, MultiplayerMatch.Status.IN_PROGRESS)

    def test_expired_round_rejects_late_guess_without_ending_match(self):
        room = create_room(self.host)
        image = self.create_image("Benguela", -12.5763, 13.4055)
        match, multiplayer_round = self.create_match_round(room, image)
        MultiplayerRound.objects.filter(pk=multiplayer_round.pk).update(
            started_at=timezone.now()
            - timedelta(
                seconds=(
                    settings.ROUND_TIME_SECONDS
                    + settings.ROUND_TIME_GRACE_SECONDS
                    + 1
                )
            )
        )

        response = self.client.post(
            f"/api/multiplayer/rounds/{multiplayer_round.id}/guess/",
            {
                "guessed_latitude": -12.5763,
                "guessed_longitude": 13.4055,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(MultiplayerGuess.objects.count(), 0)
        match.refresh_from_db()
        room.refresh_from_db()
        multiplayer_round.refresh_from_db()
        self.assertEqual(match.status, MultiplayerMatch.Status.IN_PROGRESS)
        self.assertEqual(room.status, "in_progress")
        self.assertEqual(
            multiplayer_round.status,
            MultiplayerRound.Status.COMPLETED,
        )

    def test_timeout_on_fifth_round_finishes_match_and_keeps_scores(self):
        room = create_room(self.host)
        player = User.objects.create_user(
            username="player",
            password="password123",
        )
        join_room(player, room.code)
        image = self.create_image("Malanje")
        match, multiplayer_round = self.create_match_round(
            room,
            image,
            round_number=5,
        )
        MultiplayerRound.objects.filter(pk=multiplayer_round.pk).update(
            started_at=timezone.now()
            - timedelta(seconds=settings.ROUND_TIME_SECONDS + 1)
        )
        host_participant = room.participants.get(user=self.host)
        MultiplayerGuess.objects.create(
            round=multiplayer_round,
            participant=host_participant,
            guessed_latitude=-8.838333,
            guessed_longitude=13.234444,
            distance_km=0,
            score=1750,
        )

        timeout_response = self.client.post(
            f"/api/multiplayer/rounds/{multiplayer_round.id}/timeout/"
        )
        self.assertEqual(timeout_response.status_code, 200)
        self.assertTrue(timeout_response.data["timed_out"])

        match.refresh_from_db()
        room.refresh_from_db()
        self.assertEqual(match.status, MultiplayerMatch.Status.COMPLETED)
        self.assertEqual(room.status, "finished")
        results_response = self.client.get(
            f"/api/multiplayer/matches/{match.id}/results/"
        )
        self.assertEqual(results_response.status_code, 200)
        scores = {
            entry["username"]: entry["total_score"]
            for entry in results_response.data["results"]
        }
        self.assertEqual(scores, {"host": 1750, "player": 0})

    @override_settings(ROUNDS_PER_GAME=2)
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
        LocationImage.objects.create(
            location=location,
            image="locations/test-second.jpg",
        )
        LocationImage.objects.create(
            location=GeoLocation.objects.create(
                name="Huambo",
                province="Huambo",
                latitude=-12.7,
                longitude=15.7,
            ),
            image="locations/test-third.jpg",
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
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["match_status"], "in_progress")
        self.assertEqual(response.data["round"]["round_number"], 2)

    def test_fifth_round_finishes_match_and_returns_final_scores(self):
        room = create_room(self.host)
        player = User.objects.create_user(
            username="player",
            password="password123",
        )
        join_room(player, room.code)
        room.status = "in_progress"
        room.save(update_fields=["status"])
        match = MultiplayerMatch.objects.create(room=room)
        host_participant = room.participants.get(user=self.host)
        player_participant = room.participants.get(user=player)
        final_round = None

        for round_number in range(1, 6):
            image = self.create_image(f"Location {round_number}")
            multiplayer_round = MultiplayerRound.objects.create(
                match=match,
                image=image,
                round_number=round_number,
                status=(
                    MultiplayerRound.Status.ACTIVE
                    if round_number == 5
                    else MultiplayerRound.Status.COMPLETED
                ),
            )
            if round_number < 5:
                for participant, score in (
                    (host_participant, 1000),
                    (player_participant, 500),
                ):
                    MultiplayerGuess.objects.create(
                        round=multiplayer_round,
                        participant=participant,
                        guessed_latitude=-8.838333,
                        guessed_longitude=13.234444,
                        distance_km=0,
                        score=score,
                    )
            else:
                final_round = multiplayer_round

        host_response = self.client.post(
            f"/api/multiplayer/rounds/{final_round.id}/guess/",
            {
                "guessed_latitude": -8.838333,
                "guessed_longitude": 13.234444,
            },
            format="json",
        )
        self.assertEqual(host_response.status_code, 201)
        self.assertEqual(host_response.data["score"], 5000)

        player_client = APIClient()
        player_client.force_authenticate(player)
        player_response = player_client.post(
            f"/api/multiplayer/rounds/{final_round.id}/guess/",
            {
                "guessed_latitude": -8.838333,
                "guessed_longitude": 13.234444,
            },
            format="json",
        )
        self.assertEqual(player_response.status_code, 201)
        match.refresh_from_db()
        room.refresh_from_db()
        self.assertEqual(match.status, MultiplayerMatch.Status.COMPLETED)
        self.assertEqual(room.status, "finished")
        self.assertEqual(match.rounds.count(), 5)

        match_response = self.client.get(
            f"/api/multiplayer/rooms/{room.code}/match/"
        )
        self.assertEqual(match_response.status_code, 200)
        self.assertEqual(match_response.data["status"], "completed")
        self.assertEqual(len(match_response.data["rounds"]), 5)

        results_response = self.client.get(
            f"/api/multiplayer/matches/{match.id}/results/"
        )
        self.assertEqual(results_response.status_code, 200)
        scores = {
            entry["username"]: entry["total_score"]
            for entry in results_response.data["results"]
        }
        self.assertEqual(scores, {"host": 9000, "player": 7000})

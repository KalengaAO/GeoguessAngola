
from math import ceil

from django.conf import settings
from django.utils import timezone
from rest_framework import serializers
from .models import (
    GameRoom,
    RoomParticipant,
    MultiplayerMatch,
    MultiplayerRound,
    MultiplayerGuess,
)

class CreateRoomSerializer(serializers.Serializer):

    max_players = serializers.IntegerField(
        min_value=2,
        max_value=5,
        default=5,
    )


class GameRoomSerializer(serializers.ModelSerializer):

    host_username = serializers.CharField(
        source="host.username",
        read_only=True,
    )

    class Meta:
        model = GameRoom
        fields = [
            "id",
            "code",
            "host_username",
            "status",
            "max_players",
            "created_at",
        ]
        read_only_fields = fields


class JoinRoomSerializer(serializers.Serializer):

    code = serializers.CharField(
        max_length=8,
        min_length=8,
        trim_whitespace=True,
    )

    def validate_code(self, value):
        return value.upper()


class LeaveRoomSerializer(serializers.Serializer):
    code = serializers.CharField(
        max_length=8,
        min_length=8,
        trim_whitespace=True,
    )

    def validate_code(self, value):
        return value.upper()


class SendRoomInvitationSerializer(serializers.Serializer):
    code = serializers.CharField(
        max_length=8,
        min_length=8,
        trim_whitespace=True,
    )
    username = serializers.CharField(max_length=150)

    def validate_code(self, value):
        return value.upper()

class RoomParticipantSerializer(serializers.ModelSerializer):

    username = serializers.CharField(
        source="user.username",
        read_only=True,
    )

    room_code = serializers.CharField(
        source="room.code",
        read_only=True,
    )

    class Meta:
        model = RoomParticipant
        fields = [
            "id",
            "username",
            "room_code",
            "is_ready",
            "is_active",
            "joined_at",
        ]
        read_only_fields = fields

    
class PlayerReadySerializer(serializers.Serializer):

    room_code = serializers.CharField(
        max_length=8,
        min_length=8,
        trim_whitespace=True,
    )

    is_ready = serializers.BooleanField()

    def validate_room_code(self, value):
        return value.upper()


class StartMatchSerializer(serializers.Serializer):
    code = serializers.CharField(
        max_length=8,
        min_length=8,
        trim_whitespace=True
    )

    def validate_code(self, value):
        return value.upper()



class MultiplayerRoundSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = MultiplayerRound
        fields = [
            "id",
            "round_number",
            "status",
            "image_url",
            "started_at",
            "completed_at",
        ]
        read_only_fields = fields

    def get_image_url(self, obj):
        request = self.context.get("request")

        if not obj.image.image:
            return None

        image_url = obj.image.image.url

        if request:
            return request.build_absolute_uri(image_url)

        return image_url


class MultiplayerMatchDetailSerializer(serializers.ModelSerializer):
    duration_seconds = serializers.SerializerMethodField()
    seconds_remaining = serializers.SerializerMethodField()
    total_rounds = serializers.SerializerMethodField()
    room_code = serializers.CharField(
        source="room.code",
        read_only=True,
    )
    host_username = serializers.CharField(
        source="room.host.username",
        read_only=True,
    )
    rounds = MultiplayerRoundSerializer(many=True, read_only=True)
    participants = serializers.SerializerMethodField()

    class Meta:
        model = MultiplayerMatch
        fields = [
            "id",
            "room_code",
            "host_username",
            "status",
            "started_at",
            "finished_at",
            "duration_seconds",
            "seconds_remaining",
            "total_rounds",
            "participants",
            "rounds",
        ]
        read_only_fields = fields

    def get_participants(self, obj):
        participants = obj.room.participants.filter(is_active=True)

        return RoomParticipantSerializer(
            participants,
            many=True,
            context=self.context,
        ).data

    def get_duration_seconds(self, obj):
        return settings.ROUND_TIME_SECONDS

    def get_seconds_remaining(self, obj):
        if obj.status != MultiplayerMatch.Status.IN_PROGRESS:
            return 0

        active_round = obj.rounds.filter(
            status=MultiplayerRound.Status.ACTIVE
        ).order_by("-round_number").first()
        if active_round is None:
            return 0

        elapsed = (
            timezone.now() - active_round.started_at
        ).total_seconds()
        return max(
            0,
            ceil(settings.ROUND_TIME_SECONDS - elapsed),
        )

    def get_total_rounds(self, obj):
        return settings.ROUNDS_PER_GAME

class MultiplayerGuessSerializer(serializers.Serializer):
    guessed_latitude = serializers.DecimalField(
        max_digits=9,
        decimal_places=6,
        min_value=-90,
        max_value=90,
    )

    guessed_longitude = serializers.DecimalField(
        max_digits=9,
        decimal_places=6,
        min_value=-180,
        max_value=180,
    )


class MultiplayerGuessResponseSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        source="participant.user.username",
        read_only=True,
    )

    class Meta:
        model = MultiplayerGuess
        fields = [
            "id",
            "username",
            "guessed_latitude",
            "guessed_longitude",
            "distance_km",
            "score",
            "submitted_at",
        ]
        read_only_fields = fields


class MatchResultSerializer(serializers.Serializer):
    rank = serializers.IntegerField(read_only=True)
    username = serializers.CharField(read_only=True)
    total_score = serializers.IntegerField(read_only=True)
    rounds_played = serializers.IntegerField(read_only=True)

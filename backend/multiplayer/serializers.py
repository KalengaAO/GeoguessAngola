
from rest_framework import serializers
from .models import GameRoom, RoomParticipant


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

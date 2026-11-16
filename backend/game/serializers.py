from rest_framework import serializers
from .models import PlayerStats


class SubmitAnswerSerializer(serializers.Serializer):
    latitude = serializers.FloatField(
        min_value=-90,
        max_value=90,
    )

    longitude = serializers.FloatField(
        min_value=-180,
        max_value=180,
    )

class PlayerStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlayerStats
        fields = [
            "total_score",
            "games_played",
            "best_score",
            "completed_rounds",
            "updated_at",
        ]
        read_only_fields = fields
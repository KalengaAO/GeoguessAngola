from rest_framework import serializers

from .models import QuizOption, QuizQuestion


class QuizOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizOption
        fields = ["id", "text", "order"]
        read_only_fields = fields


class QuizQuestionSerializer(serializers.ModelSerializer):
    options = QuizOptionSerializer(many=True, read_only=True)

    class Meta:
        model = QuizQuestion
        fields = [
            "id",
            "question",
            "category",
            "province",
            "options",
        ]
        read_only_fields = fields


class QuizProgressSerializer(serializers.Serializer):
    answered_questions = serializers.IntegerField(read_only=True)
    total_questions = serializers.IntegerField(read_only=True)
    score = serializers.IntegerField(read_only=True)
    percentage = serializers.FloatField(read_only=True)


class SubmitQuizAnswerSerializer(serializers.Serializer):
    option_id = serializers.PrimaryKeyRelatedField(
        queryset=QuizOption.objects.all(),
    )

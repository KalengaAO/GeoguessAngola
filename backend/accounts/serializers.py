from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework import serializers
from .models import UserProfile

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        validators=[validate_password],
    )

    class Meta:
        model = User
        fields = ["username", "password"]

    def create(self, validated_data):
        with transaction.atomic():
            user = User.objects.create_user(**validated_data)
            UserProfile.objects.create(user=user)
        return user


class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email")

    class Meta:
        model = UserProfile
        fields = [
            "username",
            "email",
            "avatar",
            "bio",
            "created_at",
        ]

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})

        if user_data:
            user = instance.user

            for attr, value in user_data.items():
                setattr(user, attr, value)

        if user_data:
            user.save(update_fields=list(user_data.keys()))

        return super().update(instance, validated_data)


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(
        write_only=True,
        validators=[validate_password],
    )

    def validate(self, attrs):
        if not self.context["request"].user.check_password(
            attrs["current_password"]
        ):
            raise serializers.ValidationError(
                {"current_password": "A palavra-passe actual está incorrecta."}
            )
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(
        write_only=True,
        validators=[validate_password],
    )


class AccountDeleteSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True)

    def validate_password(self, value):
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError(
                "A palavra-passe está incorrecta."
            )
        return value


class PublicPlayerSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    bio = serializers.SerializerMethodField()
    total_score = serializers.IntegerField(read_only=True)
    games_played = serializers.IntegerField(read_only=True)
    best_score = serializers.IntegerField(read_only=True)
    completed_rounds = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = [
            "username",
            "avatar",
            "bio",
            "total_score",
            "games_played",
            "best_score",
            "completed_rounds",
        ]

    def get_avatar(self, obj):
        profile = getattr(obj, "profile", None)
        if not profile or not profile.avatar:
            return None
        request = self.context.get("request")
        url = profile.avatar.url
        return request.build_absolute_uri(url) if request else url

    def get_bio(self, obj):
        profile = getattr(obj, "profile", None)
        return profile.bio if profile else ""


class FriendshipSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(read_only=True)
    status = serializers.CharField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    responded_at = serializers.DateTimeField(read_only=True)
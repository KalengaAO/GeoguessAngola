import binascii

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.forms import PasswordResetForm
from django.contrib.auth.tokens import default_token_generator
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils.http import urlsafe_base64_decode
from rest_framework.permissions import IsAuthenticated
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from .models import UserProfile
from game.models import GameSession, PlayerStats
from multiplayer.models import GameRoom, MultiplayerMatch
from quiz.models import QuizSession
from .serializers import (
    AccountDeleteSerializer,
    PasswordChangeSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    ProfileSerializer,
    PublicPlayerSerializer,
    RegisterSerializer,
)

User = get_user_model()


class RegisterView(APIView):
    permission_classes= [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()

            return Response(
                {"detail": "Utilizador criado com sucesso."},
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = ProfileSerializer(profile)

        return Response(serializer.data)

    def patch(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)

        serializer = ProfileSerializer(
            profile,
            data=request.data,
            partial=True,
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )


class PasswordChangeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save(update_fields=["password"])
        return Response(
            {"detail": "Palavra-passe alterada com sucesso."},
            status=status.HTTP_200_OK,
        )


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        form = PasswordResetForm(data=serializer.validated_data)
        if form.is_valid():
            form.save(
                use_https=request.is_secure(),
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
                request=request,
                email_template_name="registration/password_reset_email.html",
            )

        return Response(
            {
                "detail": (
                    "Se existir uma conta para este email, "
                    "será enviado um link de recuperação."
                )
            },
            status=status.HTTP_202_ACCEPTED,
        )


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user_id = urlsafe_base64_decode(
                serializer.validated_data["uid"]
            ).decode()
            user = User.objects.get(pk=user_id)
        except (
            TypeError,
            ValueError,
            OverflowError,
            binascii.Error,
            User.DoesNotExist,
        ):
            user = None

        if user is None or not default_token_generator.check_token(
            user,
            serializer.validated_data["token"],
        ):
            return Response(
                {"detail": "O link de recuperação é inválido ou expirou."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])
        return Response(
            {"detail": "Palavra-passe redefinida com sucesso."},
            status=status.HTTP_200_OK,
        )


class AccountDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        serializer = AccountDeleteSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)

        user = request.user
        with transaction.atomic():
            GameSession.objects.filter(user=user).delete()
            PlayerStats.objects.filter(user=user).delete()
            QuizSession.objects.filter(user=user).delete()

            hosted_rooms = GameRoom.objects.filter(host=user)
            MultiplayerMatch.objects.filter(room__in=hosted_rooms).delete()
            hosted_rooms.delete()

            user.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


class PublicPlayerProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, username):
        user = get_object_or_404(
            User.objects.select_related("profile", "game_stats"),
            username=username,
            is_active=True,
        )
        stats = getattr(user, "game_stats", None)
        profile = getattr(user, "profile", None)
        serializer = PublicPlayerSerializer(
            user,
            context={"request": request},
        )
        data = serializer.data
        data.update(
            {
                "bio": profile.bio if profile else "",
                "total_score": stats.total_score if stats else 0,
                "games_played": stats.games_played if stats else 0,
                "best_score": stats.best_score if stats else 0,
                "completed_rounds": stats.completed_rounds if stats else 0,
            }
        )
        return Response(data)


class PlayerSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get("q", "").strip()
        if len(query) < 2:
            return Response(
                {"detail": "A pesquisa deve conter pelo menos 2 caracteres."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        users = (
            User.objects.filter(
                Q(username__icontains=query),
                is_active=True,
            )
            .select_related("profile", "game_stats")
            .order_by("username")[:20]
        )
        return Response(
            PublicPlayerSerializer(
                users,
                many=True,
                context={"request": request},
            ).data
        )

 

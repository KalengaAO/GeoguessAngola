from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import GameRound
from .serializers import SubmitAnswerSerializer
from .services import submit_round_answer
from .services import start_game


class StartGameView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            session, game_round = start_game(request.user)

            image_url = request.build_absolute_uri(
                game_round.image.image.url
            )

            return Response(
                {
                    "session_id": session.id,
                    "session_status": session.status,
                    "round": {
                        "id": game_round.id,
                        "number": game_round.round_number,
                        "image_url": image_url,
                    },
                },
                status=status.HTTP_201_CREATED,
            )

        except ValueError as error:
            return Response(
                {"detail": str(error)},
                status=status.HTTP_400_BAD_REQUEST,
            )

class SubmitAnswerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, round_id):
        serializer = SubmitAnswerSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            game_round, distance_km = submit_round_answer(
                game_round_id=round_id,
                user=request.user,
                guessed_latitude=serializer.validated_data["latitude"],
                guessed_longitude=serializer.validated_data["longitude"],
            )

            return Response(
                {
                    "round_id": game_round.id,
                    "round_number": game_round.round_number,
                    "distance_km": round(distance_km, 2),
                    "score": game_round.score,
                },
                status=status.HTTP_200_OK,
            )

        except GameRound.DoesNotExist:
            return Response(
                {"detail": "Ronda não encontrada."},
                status=status.HTTP_404_NOT_FOUND,
            )

        except ValueError as error:
            return Response(
                {"detail": str(error)},
                status=status.HTTP_400_BAD_REQUEST,
            )

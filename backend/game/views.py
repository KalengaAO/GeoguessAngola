from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import GameRound
from .serializers import SubmitAnswerSerializer
from .services import submit_round_answer, start_game, advance_game
from .models import GameSession
from django.conf import settings
from django.db.models import Sum, Count


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


class NextRoundView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        try:
            session, next_round = advance_game(
                session_id=session_id,
                user=request.user,
            )

            # A partida terminou
            if next_round is None:
                return Response(
                    {
                        "session_id": session.id,
                        "session_status": session.status,
                        "message": "Partida concluída!",
                    },
                    status=status.HTTP_200_OK,
                )

            # Foi criada uma nova ronda
            image_url = request.build_absolute_uri(
                next_round.image.image.url
            )

            return Response(
                {
                    "session_id": session.id,
                    "session_status": session.status,
                    "round": {
                        "id": next_round.id,
                        "number": next_round.round_number,
                        "image_url": image_url,
                    },
                },
                status=status.HTTP_200_OK,
            )

        except GameSession.DoesNotExist:
            return Response(
                {"detail": "Partida não encontrada."},
                status=status.HTTP_404_NOT_FOUND,
            )

        except ValueError as error:
            return Response(
                {"detail": str(error)},
                status=status.HTTP_400_BAD_REQUEST,
            )

class GameStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        try:
            session = GameSession.objects.get(
                pk=session_id,
                user=request.user,
            )

            rounds = session.rounds.select_related(
                "image"
            ).order_by("round_number")

            rounds_data = []
            total_score = 0
            answered_rounds = 0

            for game_round in rounds:
                is_answered = game_round.answered_at is not None

                if is_answered:
                    answered_rounds += 1
                    total_score += game_round.score or 0

                image_url = request.build_absolute_uri(
                    game_round.image.image.url
                )

                rounds_data.append({
                    "id": game_round.id,
                    "number": game_round.round_number,
                    "image_url": image_url,
                    "is_answered": is_answered,
                    "score": game_round.score if is_answered else None,
                    "guessed_latitude": (
                        game_round.guessed_latitude if is_answered else None
                    ),
                    "guessed_longitude": (
                        game_round.guessed_longitude if is_answered else None
                    ),
                })

            return Response(
                {
                    "session_id": session.id,
                    "session_status": session.status,
                    "progress": {
                        "answered_rounds": answered_rounds,
                        "total_rounds": settings.ROUNDS_PER_GAME,
                    },
                    "total_score": total_score,
                    "rounds": rounds_data,
                },
                status=status.HTTP_200_OK,
            )

        except GameSession.DoesNotExist:
            return Response(
                {"detail": "Partida não encontrada."},
                status=status.HTTP_404_NOT_FOUND,
            )
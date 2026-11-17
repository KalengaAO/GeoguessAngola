from django.conf import settings
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import GameRound, GameSession, PlayerStats
from .serializers import PlayerStatsSerializer, SubmitAnswerSerializer
from .services import (
    advance_game,
    calculate_distance_km,
    expire_overdue_rounds,
    get_round_time_limit,
    get_seconds_remaining,
    get_session_total_score,
    start_game,
    submit_round_answer,
    timeout_round,
)


# ---------------------------------------------------------------------------
# Helpers de resposta
# ---------------------------------------------------------------------------

def to_float(value):
    return float(value) if value is not None else None


def build_round_payload(request, game_round):
    """Dados públicos de uma ronda (NUNCA inclui a localização correta)."""
    return {
        "id": game_round.id,
        "number": game_round.round_number,
        "image_url": request.build_absolute_uri(
            game_round.image.image.url
        ),
        "seconds_remaining": get_seconds_remaining(game_round),
    }


def build_correct_location(game_round):
    """Só deve ser usada depois de a ronda ter sido respondida."""
    location = game_round.image.location

    return {
        "latitude": float(location.latitude),
        "longitude": float(location.longitude),
    }


def build_result_payload(game_round):
    """Resultado de uma ronda já respondida (inclui timeout sem palpite)."""
    correct_location = build_correct_location(game_round)
    guessed_lat = to_float(game_round.guessed_latitude)
    guessed_lon = to_float(game_round.guessed_longitude)

    distance_km = None

    if guessed_lat is not None and guessed_lon is not None:
        distance_km = round(
            calculate_distance_km(
                correct_location["latitude"],
                correct_location["longitude"],
                guessed_lat,
                guessed_lon,
            ),
            2,
        )

    return {
        "score": game_round.score or 0,
        "distance_km": distance_km,
        "timed_out": guessed_lat is None or guessed_lon is None,
        "guessed_latitude": guessed_lat,
        "guessed_longitude": guessed_lon,
        "correct_location": correct_location,
    }


def build_answer_response(game_round):
    data = build_result_payload(game_round)
    data.update(
        {
            "round_id": game_round.id,
            "round_number": game_round.round_number,
            "session_total_score": get_session_total_score(
                game_round.session
            ),
        }
    )
    return data


# ---------------------------------------------------------------------------
# Views
# ---------------------------------------------------------------------------

class StartGameView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            session, game_round = start_game(request.user)

            return Response(
                {
                    "session_id": session.id,
                    "session_status": session.status,
                    "round": build_round_payload(request, game_round),
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
            game_round, _distance_km = submit_round_answer(
                game_round_id=round_id,
                user=request.user,
                guessed_latitude=serializer.validated_data["latitude"],
                guessed_longitude=serializer.validated_data["longitude"],
            )

            return Response(
                build_answer_response(game_round),
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


class TimeoutRoundView(APIView):
    """O tempo acabou sem palpite: fecha a ronda com 0 pontos."""

    permission_classes = [IsAuthenticated]

    def post(self, request, round_id):
        try:
            game_round = timeout_round(
                game_round_id=round_id,
                user=request.user,
            )

            return Response(
                build_answer_response(game_round),
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

            # A partida terminou.
            if next_round is None:
                return Response(
                    {
                        "session_id": session.id,
                        "session_status": session.status,
                        "is_finished": True,
                        "message": "Partida concluída!",
                    },
                    status=status.HTTP_200_OK,
                )

            return Response(
                {
                    "session_id": session.id,
                    "session_status": session.status,
                    "is_finished": False,
                    "round": build_round_payload(request, next_round),
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
        except GameSession.DoesNotExist:
            return Response(
                {"detail": "Partida não encontrada."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Fecha rondas abandonadas há muito tempo.
        expire_overdue_rounds(session)

        rounds = session.rounds.select_related(
            "image__location"
        ).order_by("round_number")

        rounds_data = []
        total_score = 0
        answered_rounds = 0

        for game_round in rounds:
            is_answered = game_round.answered_at is not None

            round_data = build_round_payload(request, game_round)
            round_data.update(
                {
                    "is_answered": is_answered,
                    "score": None,
                    "distance_km": None,
                    "timed_out": None,
                    "guessed_latitude": None,
                    "guessed_longitude": None,
                    "correct_location": None,
                }
            )

            if is_answered:
                answered_rounds += 1
                total_score += game_round.score or 0

                # A localização só é revelada depois de a ronda ser respondida.
                round_data.update(build_result_payload(game_round))

            rounds_data.append(round_data)

        return Response(
            {
                "session_id": session.id,
                "session_status": session.status,
                "is_finished": (
                    session.status == GameSession.Status.COMPLETED
                ),
                "time_limit_seconds": get_round_time_limit(),
                "progress": {
                    "answered_rounds": answered_rounds,
                    "total_rounds": settings.ROUNDS_PER_GAME,
                },
                "total_score": total_score,
                "rounds": rounds_data,
            },
            status=status.HTTP_200_OK,
        )


class PlayerStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        stats, _ = PlayerStats.objects.get_or_create(user=request.user)
        serializer = PlayerStatsSerializer(stats)

        return Response(serializer.data)

from django.conf import settings
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import GameRound, GameSession, PlayerStats
from .serializers import SubmitAnswerSerializer, PlayerStatsSerializer
from .services import (
    advance_game,
    abandon_game,
    calculate_distance_km,
    complete_game,
    get_active_game,
    start_game,
    submit_round_answer,
    timeout_round,
)


def round_payload(request, game_round):
    return {
        "id": game_round.id,
        "number": game_round.round_number,
        "image_url": request.build_absolute_uri(
            game_round.image.image.url
        ),
        "started_at": game_round.started_at,
        "time_limit_seconds": settings.ROUND_TIME_SECONDS,
        "grace_seconds": settings.ROUND_TIME_GRACE_SECONDS,
    }


class StartGameView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            session, game_round = start_game(request.user)

            return Response(
                {
                    "session_id": session.id,
                    "session_status": session.status,
                    "round": round_payload(request, game_round),
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
            game_round, distance_km, correct_location = (
                submit_round_answer(
                    game_round_id=round_id,
                    user=request.user,
                    guessed_latitude=serializer.validated_data["latitude"],
                    guessed_longitude=serializer.validated_data["longitude"],
                )
            )

            guessed_location = {
                "latitude": game_round.guessed_latitude,
                "longitude": game_round.guessed_longitude,
            }
            location = game_round.image.location
            correct_location.update(
                {
                    "name": location.name,
                    "province": location.province,
                }
            )

            return Response(
                {
                    "round_id": game_round.id,
                    "round_number": game_round.round_number,
                    "distance_km": round(distance_km, 2),
                    "score": game_round.score,
                    "guessed_location": guessed_location,
                    "correct_location": correct_location,
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


class TimeoutRoundView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, round_id):
        try:
            game_round = timeout_round(
                game_round_id=round_id,
                user=request.user,
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

        return Response(
            {
                "round_id": game_round.id,
                "round_number": game_round.round_number,
                "score": game_round.score,
                "timed_out": True,
                "correct_location": {
                    "latitude": float(game_round.image.location.latitude),
                    "longitude": float(game_round.image.location.longitude),
                    "name": game_round.image.location.name,
                    "province": game_round.image.location.province,
                },
            },
            status=status.HTTP_200_OK,
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
            return Response(
                {
                    "session_id": session.id,
                    "session_status": session.status,
                    "round": round_payload(request, next_round),
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


class ResumeGameView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        session = get_active_game(request.user)
        if session is None:
            return Response(
                {"detail": "Não existe nenhuma partida em andamento."},
                status=status.HTTP_404_NOT_FOUND,
            )

        current_round = session.rounds.order_by("-round_number").first()
        if current_round is None:
            return Response(
                {"detail": "A partida não possui rondas."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "session_id": session.id,
                "session_status": session.status,
                "round": round_payload(request, current_round),
            },
            status=status.HTTP_200_OK,
        )


class CompleteGameView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        try:
            session = complete_game(
                session_id=session_id,
                user=request.user,
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

        return Response(
            {
                "session_id": session.id,
                "session_status": session.status,
                "finished_at": session.finished_at,
                "total_score": sum(
                    game_round.score for game_round in session.rounds.all()
                ),
            },
            status=status.HTTP_200_OK,
        )


class AbandonGameView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        try:
            session = abandon_game(
                session_id=session_id,
                user=request.user,
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

        return Response(
            {
                "session_id": session.id,
                "session_status": session.status,
                "finished_at": session.finished_at,
            },
            status=status.HTTP_200_OK,
        )


class GameHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            limit = min(int(request.query_params.get("limit", 20)), 50)
            offset = max(int(request.query_params.get("offset", 0)), 0)
        except ValueError:
            return Response(
                {"detail": "Os parâmetros limit e offset devem ser números."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if limit < 1:
            return Response(
                {"detail": "O parâmetro limit deve ser maior que zero."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        sessions = (
            GameSession.objects
            .filter(
                user=request.user,
                status__in=[
                    GameSession.Status.COMPLETED,
                    GameSession.Status.ABANDONED,
                ],
            )
            .prefetch_related("rounds")
            .order_by("-started_at")
        )
        total = sessions.count()
        history = []

        for session in sessions[offset:offset + limit]:
            history.append(
                {
                    "session_id": session.id,
                    "status": session.status,
                    "started_at": session.started_at,
                    "finished_at": session.finished_at,
                    "total_score": sum(
                        game_round.score
                        for game_round in session.rounds.all()
                    ),
                    "answered_rounds": sum(
                        game_round.answered_at is not None
                        for game_round in session.rounds.all()
                    ),
                    "total_rounds": session.rounds.count(),
                }
            )

        return Response(
            {
                "count": total,
                "limit": limit,
                "offset": offset,
                "results": history,
            },
            status=status.HTTP_200_OK,
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
                "image__location"
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
                elapsed_seconds = (
                    timezone.now() - game_round.started_at
                ).total_seconds()
                seconds_remaining = max(
                    0,
                    settings.ROUND_TIME_SECONDS - elapsed_seconds,
                )
                location = game_round.image.location
                guessed_location = (
                    (
                        float(game_round.guessed_latitude),
                        float(game_round.guessed_longitude),
                    )
                    if is_answered
                    and game_round.guessed_latitude is not None
                    and game_round.guessed_longitude is not None
                    else None
                )
                distance_km = (
                    calculate_distance_km(
                        float(location.latitude),
                        float(location.longitude),
                        guessed_location[0],
                        guessed_location[1],
                    )
                    if guessed_location
                    else None
                )

                rounds_data.append({
                    "id": game_round.id,
                    "number": game_round.round_number,
                    "image_url": image_url,
                    "started_at": game_round.started_at,
                    "seconds_remaining": (
                        None if is_answered else seconds_remaining
                    ),
                    "is_answered": is_answered,
                    "score": game_round.score if is_answered else None,
                    "distance_km": (
                        round(distance_km, 2)
                        if distance_km is not None
                        else None
                    ),
                    "correct_location": (
                        {
                            "latitude": float(location.latitude),
                            "longitude": float(location.longitude),
                            "name": location.name,
                            "province": location.province,
                        }
                        if is_answered
                        else None
                    ),
                    "timed_out": is_answered and guessed_location is None,
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
                    "time_limit_seconds": settings.ROUND_TIME_SECONDS,
                    "grace_seconds": settings.ROUND_TIME_GRACE_SECONDS,
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

class PlayerStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        stats, created = PlayerStats.objects.get_or_create(
            user=request.user,
        )

        serializer = PlayerStatsSerializer(stats)

        return Response(serializer.data)


class LeaderboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        players = (
            PlayerStats.objects
            .filter(games_played__gt=0)
            .select_related("user")
            .order_by(
                "-total_score",
                "-best_score",
                "user__username",
            )[:100]
        )

        return Response(
            {
                "results": [
                    {
                        "rank": rank,
                        "username": player.user.username,
                        "total_score": player.total_score,
                        "best_score": player.best_score,
                        "games_played": player.games_played,
                    }
                    for rank, player in enumerate(players, start=1)
                ]
            },
            status=status.HTTP_200_OK,
        )
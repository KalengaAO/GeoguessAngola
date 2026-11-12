from rest_framework.permissions import IsAuthenticated
from .services import advance_multiplayer_round
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import render
from rest_framework import status
from .services import (
        create_room, join_room, 
        set_player_ready, start_match,
        get_room_match, submit_multiplayer_guess,
        get_match_results,
    )

from .serializers import (
    CreateRoomSerializer, GameRoomSerializer,
    JoinRoomSerializer, RoomParticipantSerializer,
    PlayerReadySerializer, StartMatchSerializer,
    MultiplayerMatchDetailSerializer,
    MultiplayerGuessSerializer,
    MultiplayerGuessResponseSerializer,
    MatchResultSerializer,
)

class CreateRoomView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        serializer = CreateRoomSerializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        room = create_room(
            user=request.user,
            max_players=serializer.validated_data["max_players"],
        )

        response_serializer = GameRoomSerializer(room)

        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED,
        )

class JoinRoomView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        serializer = JoinRoomSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            participant = join_room(
                user=request.user,
                code=serializer.validated_data["code"],
            )

        except ValueError as error:
            return Response(
                {"detail": str(error)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        response_serializer = RoomParticipantSerializer(participant)

        return Response(
            response_serializer.data,
            status=status.HTTP_200_OK,
        )

class PlayerReadyView(APIView):

    permission_classes = [IsAuthenticated]

    def patch(self, request):

        serializer = PlayerReadySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            participant = set_player_ready(
                user=request.user,
                room_code=serializer.validated_data["room_code"],
                is_ready=serializer.validated_data["is_ready"],
            )

        except ValueError as error:
            return Response(
                {"detail": str(error)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        response_serializer = RoomParticipantSerializer(participant)

        return Response(
            response_serializer.data,
            status=status.HTTP_200_OK,
        )


class StartMatchView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = StartMatchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            match = start_match(
                user=request.user,
                room_code=serializer.validated_data["code"],
            )
        except ValueError as error:
            return Response(
                {"detail": str(error)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "match_id": match.id,
                "room_code": match.room.code,
                "status": match.status,
                "message": "Partida iniciada com sucesso.",
            },
            status=status.HTTP_201_CREATED,
        )


class RoomMatchDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, room_code):
        try:
            match = get_room_match(
                user=request.user,
                room_code=room_code,
            )
        except ValueError as error:
            return Response(
                {"detail": str(error)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = MultiplayerMatchDetailSerializer(
            match,
            context={"request": request},
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

class SubmitMultiplayerGuessView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, round_id):
        serializer = MultiplayerGuessSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            guess = submit_multiplayer_guess(
                round_id=round_id,
                user=request.user,
                guessed_latitude=serializer.validated_data[
                    "guessed_latitude"
                ],
                guessed_longitude=serializer.validated_data[
                    "guessed_longitude"
                ],
            )
        except ValueError as error:
            return Response(
                {"detail": str(error)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        response_serializer = MultiplayerGuessResponseSerializer(guess)

        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED,
        )


class AdvanceMultiplayerRoundView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, match_id):
        try:
            match, next_round = advance_multiplayer_round(
                match_id=match_id,
                user=request.user,
            )
        except ValueError as error:
            return Response(
                {"detail": str(error)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if next_round is None:
            return Response(
                {
                    "match_id": match.id,
                    "match_status": match.status,
                    "message": "Partida concluída com sucesso.",
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {
                "match_id": match.id,
                "match_status": match.status,
                "round": {
                    "id": next_round.id,
                    "round_number": next_round.round_number,
                    "status": next_round.status,
                    "image_url": request.build_absolute_uri(
                        next_round.image.image.url
                    ),
                },
                "message": "Nova ronda criada com sucesso.",
            },
            status=status.HTTP_201_CREATED,
        )

class MatchResultsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, match_id):
        try:
            match, results = get_match_results(
                match_id=match_id,
                user=request.user,
            )
        except ValueError as error:
            return Response(
                {"detail": str(error)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        results_data = []

        for position, participant in enumerate(results, start=1):
            results_data.append({
                "rank": position,
                "username": participant.user.username,
                "total_score": participant.total_score,
                "rounds_played": participant.rounds_played,
            })

        serializer = MatchResultSerializer(
            results_data,
            many=True,
        )

        return Response({
            "match_id": match.id,
            "match_status": match.status,
            "results": serializer.data,
        }, status=status.HTTP_200_OK)

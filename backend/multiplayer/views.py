from django.shortcuts import render

# Create your views here.

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .services import (
        create_room, join_room, 
    set_player_ready, start_match
    )
from .serializers import (
    CreateRoomSerializer, GameRoomSerializer,
    JoinRoomSerializer, RoomParticipantSerializer,
    PlayerReadySerializer, StartMatchSerializer,
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

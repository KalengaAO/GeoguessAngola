from rest_framework.permissions import IsAuthenticated
from .services import advance_multiplayer_round
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import render
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import MultiplayerRound
from .services import (
        create_room, join_room, 
        set_player_ready, start_match,
        get_room_lobby, get_room_match, submit_multiplayer_guess,
        get_match_results, leave_room, timeout_multiplayer_round,
        send_room_invitation, respond_room_invitation,
        get_room_invitations,
    )

from .serializers import (
    CreateRoomSerializer, GameRoomSerializer,
    JoinRoomSerializer, RoomParticipantSerializer,
    PlayerReadySerializer, StartMatchSerializer,
    MultiplayerMatchDetailSerializer,
    MultiplayerGuessSerializer,
    MultiplayerGuessResponseSerializer,
    MatchResultSerializer,
    LeaveRoomSerializer,
    SendRoomInvitationSerializer,
)

User = get_user_model()

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


class LeaveRoomView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = LeaveRoomSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            room = leave_room(
                user=request.user,
                room_code=serializer.validated_data["code"],
            )
        except ValueError as error:
            return Response(
                {"detail": str(error)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        match = getattr(room, "match", None)
        return Response(
            {
                "code": room.code,
                "status": room.status,
                "match_status": (
                    match.status if match is not None else None
                ),
                "message": "Saíste da sala.",
            },
            status=status.HTTP_200_OK,
        )


class SendRoomInvitationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SendRoomInvitationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            receiver = User.objects.get(
                username=serializer.validated_data["username"],
                is_active=True,
            )
        except User.DoesNotExist:
            return Response(
                {"detail": "Jogador não encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            invitation = send_room_invitation(
                user=request.user,
                room_code=serializer.validated_data["code"],
                receiver=receiver,
            )
        except ValueError as error:
            return Response(
                {"detail": str(error)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "id": invitation.id,
                "room_code": invitation.room.code,
                "sender": invitation.sender.username,
                "receiver": invitation.receiver.username,
                "status": invitation.status,
                "created_at": invitation.created_at,
            },
            status=status.HTTP_201_CREATED,
        )


class RoomInvitationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        status_filter = request.query_params.get("status")
        invitations = get_room_invitations(request.user)
        if status_filter:
            invitations = invitations.filter(status=status_filter)

        return Response(
            [
                {
                    "id": invitation.id,
                    "room_code": invitation.room.code,
                    "sender": invitation.sender.username,
                    "receiver": invitation.receiver.username,
                    "status": invitation.status,
                    "created_at": invitation.created_at,
                    "responded_at": invitation.responded_at,
                    "direction": (
                        "sent"
                        if invitation.sender_id == request.user.pk
                        else "received"
                    ),
                }
                for invitation in invitations
            ],
            status=status.HTTP_200_OK,
        )


class RespondRoomInvitationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, invitation_id, action):
        try:
            invitation = respond_room_invitation(
                user=request.user,
                invitation_id=invitation_id,
                action=action,
            )
        except ValueError as error:
            return Response(
                {"detail": str(error)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "id": invitation.id,
                "room_code": invitation.room.code,
                "sender": invitation.sender.username,
                "receiver": invitation.receiver.username,
                "status": invitation.status,
                "responded_at": invitation.responded_at,
            },
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


class RoomLobbyView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, room_code):
        try:
            room = get_room_lobby(
                user=request.user,
                room_code=room_code,
            )
        except ValueError as error:
            return Response(
                {"detail": str(error)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        match = getattr(room, "match", None)
        participants = room.participants.filter(
            is_active=True,
        ).select_related("user")

        return Response(
            {
                "id": room.id,
                "code": room.code,
                "status": room.status,
                "max_players": room.max_players,
                "host_username": room.host.username,
                "match_id": match.id if match else None,
                "participants": RoomParticipantSerializer(
                    participants,
                    many=True,
                ).data,
            },
            status=status.HTTP_200_OK,
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
        response_data = serializer.data
        rounds = match.rounds.select_related(
            "image__location"
        ).order_by("round_number")
        for round_data, multiplayer_round in zip(
            response_data["rounds"],
            rounds,
        ):
            if multiplayer_round.status == MultiplayerRound.Status.COMPLETED:
                location = multiplayer_round.image.location
                round_data["location_name"] = location.name
                round_data["province"] = location.province

        return Response(
            response_data,
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

        if guess is None:
            return Response(
                {"detail": "O tempo para responder terminou. O palpite não foi contabilizado."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        response_serializer = MultiplayerGuessResponseSerializer(guess)
        response_data = dict(response_serializer.data)
        location = guess.round.image.location
        response_data["location_name"] = location.name
        response_data["province"] = location.province

        return Response(
            response_data,
            status=status.HTTP_201_CREATED,
        )


class TimeoutMultiplayerRoundView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, round_id):
        try:
            multiplayer_round = timeout_multiplayer_round(
                round_id,
                user=request.user,
            )
        except ValueError as error:
            return Response(
                {"detail": str(error)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "round_id": multiplayer_round.id,
                "round_number": multiplayer_round.round_number,
                "status": multiplayer_round.status,
                "timed_out": True,
                "completed_at": multiplayer_round.completed_at,
                "location_name": multiplayer_round.image.location.name,
                "province": multiplayer_round.image.location.province,
            },
            status=status.HTTP_200_OK,
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

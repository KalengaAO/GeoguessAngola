from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

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
# Create your views here.

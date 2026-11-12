
from django.urls import path
from .views import (
    CreateRoomView, JoinRoomView, 
    PlayerReadyView, StartMatchView,
    RoomMatchDetailView, SubmitMultiplayerGuessView,
    AdvanceMultiplayerRoundView, MatchResultsView,


    )

urlpatterns = [
    path("rooms/", CreateRoomView.as_view(), name="create_room"),
    path("rooms/join/", JoinRoomView.as_view(), name="join_room"),
    path("rooms/ready/", PlayerReadyView.as_view(), name="player_ready"),
    path("rooms/start/", StartMatchView.as_view(), name="start_match"),
    path("rooms/<str:room_code>/match/", RoomMatchDetailView.as_view(), name="room_match_detail"),
    path("rounds/<int:round_id>/guess/", SubmitMultiplayerGuessView.as_view(), name="submit-multiplayer-guess"),
    path("matches/<int:match_id>/advance/", AdvanceMultiplayerRoundView.as_view(), name="advance-multiplayer-round"),
    path("matches/<int:match_id>/results/", MatchResultsView.as_view(), name="match-results"),
]

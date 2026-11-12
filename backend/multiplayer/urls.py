
from django.urls import path
from .views import (
    CreateRoomView, JoinRoomView, 
    PlayerReadyView, StartMatchView,
    )

urlpatterns = [
    path("rooms/", CreateRoomView.as_view(), name="create-room"),
    path("rooms/join/", JoinRoomView.as_view(), name="join-room"),
    path("rooms/ready/", PlayerReadyView.as_view(), name="player-ready"),
    path("rooms/start/", StartMatchView.as_view(), name="start-match"),
]

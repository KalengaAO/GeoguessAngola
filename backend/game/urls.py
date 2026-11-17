from django.urls import path
from .views import (
    StartGameView,
    SubmitAnswerView,
    NextRoundView,
    GameStatusView,
    PlayerStatsView,
)

urlpatterns = [
    path("start/", StartGameView.as_view(), name="start_game"),
    path(
        "rounds/<int:round_id>/answer/",
        SubmitAnswerView.as_view(),
        name="submit-answer",
    ),
    path(
        "<int:session_id>/next/",
        NextRoundView.as_view(),
        name="next-round",
    ),
    path(
        "<int:session_id>/status/",
        GameStatusView.as_view(),
        name="game-status",
    ),
    path(
    "stats/",
    PlayerStatsView.as_view(),
    name="player-stats",
    ),
]
from django.urls import path
from .views import (
    StartGameView,
    SubmitAnswerView,
    NextRoundView,
    GameStatusView,
)

urlpatterns = [
    path("games/start/", StartGameView.as_view(), name="start_game"),
    path(
        "games/rounds/<int:round_id>/answer/",
        SubmitAnswerView.as_view(),
        name="submit-answer",
    ),
    path(
        "games/<int:session_id>/next/",
        NextRoundView.as_view(),
        name="next-round",
    ),
    path(
        "games/<int:session_id>/status/",
        GameStatusView.as_view(),
        name="game-status",
    ),
]
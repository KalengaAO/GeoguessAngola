from django.urls import path
from .views import (
    StartGameView,
    SubmitAnswerView,
    TimeoutRoundView,
    NextRoundView,
    GameStatusView,
    PlayerStatsView,
    LeaderboardView,
    ResumeGameView,
    CompleteGameView,
    AbandonGameView,
    GameHistoryView,
)

urlpatterns = [
    path("start/", StartGameView.as_view(), name="start_game"),
    path("resume/", ResumeGameView.as_view(), name="resume_game"),
    path("history/", GameHistoryView.as_view(), name="game_history"),
    path("leaderboard/", LeaderboardView.as_view(), name="leaderboard"),
    path(
        "rounds/<int:round_id>/answer/",
        SubmitAnswerView.as_view(),
        name="submit-answer",
    ),
    path(
        "rounds/<int:round_id>/timeout/",
        TimeoutRoundView.as_view(),
        name="timeout-round",
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
        "<int:session_id>/complete/",
        CompleteGameView.as_view(),
        name="complete-game",
    ),
    path(
        "<int:session_id>/abandon/",
        AbandonGameView.as_view(),
        name="abandon-game",
    ),
    path(
    "stats/",
    PlayerStatsView.as_view(),
    name="player-stats",
    ),
]
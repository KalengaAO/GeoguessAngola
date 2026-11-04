from django.urls import path
from .views import StartGameView, SubmitAnswerView

urlpatterns = [
    path("games/start/", StartGameView.as_view(), name="start_game"),
    path(
        "games/rounds/<int:round_id>/answer/",
        SubmitAnswerView.as_view(),
        name="submit-answer",
    ),
]
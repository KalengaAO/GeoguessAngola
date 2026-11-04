from django.urls import path
from .views import StartGameView

urlpatterns = [
    path("games/start/", StartGameView.as_view(), name="start_game"),
]
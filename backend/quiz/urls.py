from django.urls import path

from .views import (
    EndQuizSessionView,
    QuizQuestionDetailView,
    QuizQuestionListView,
    StartQuizSessionView,
    SubmitQuizAnswerView,
)

urlpatterns = [
    path(
        "sessions/",
        StartQuizSessionView.as_view(),
        name="start-quiz-session",
    ),
    path(
        "sessions/<int:session_id>/end/",
        EndQuizSessionView.as_view(),
        name="end-quiz-session",
    ),
    path(
        "sessions/<int:session_id>/questions/",
        QuizQuestionListView.as_view(),
        name="quiz-questions",
    ),
    path(
        "sessions/<int:session_id>/questions/<int:question_id>/",
        QuizQuestionDetailView.as_view(),
        name="quiz-question-detail",
    ),
    path(
        "sessions/<int:session_id>/questions/<int:question_id>/answer/",
        SubmitQuizAnswerView.as_view(),
        name="submit-quiz-answer",
    ),
]

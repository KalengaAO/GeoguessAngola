from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from django.utils import timezone

from .models import QuizQuestion, QuizSession
from .serializers import (
    QuizQuestionSerializer,
    SubmitQuizAnswerSerializer,
)


class StartQuizSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if QuizSession.objects.filter(
            user=request.user,
            status=QuizSession.Status.ACTIVE,
        ).exists():
            return Response(
                {"detail": "Já existe um quiz activo para este utilizador."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        session = QuizSession.objects.create(user=request.user)

        return Response(
            {
                "session_id": session.id,
                "status": session.status,
                "started_at": session.started_at,
            },
            status=status.HTTP_201_CREATED,
        )


class EndQuizSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        try:
            session = QuizSession.objects.get(
                pk=session_id,
                user=request.user,
                status=QuizSession.Status.ACTIVE,
            )
        except QuizSession.DoesNotExist:
            return Response(
                {"detail": "Quiz activo não encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        session.status = QuizSession.Status.COMPLETED
        session.ended_at = timezone.now()
        session.save(update_fields=["status", "ended_at"])

        return Response(
            {
                "session_id": session.id,
                "status": session.status,
                "ended_at": session.ended_at,
            },
            status=status.HTTP_200_OK,
        )


def get_active_session(session_id, user):
    try:
        return QuizSession.objects.get(
            pk=session_id,
            user=user,
            status=QuizSession.Status.ACTIVE,
        )
    except QuizSession.DoesNotExist:
        return None


class QuizQuestionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        if get_active_session(session_id, request.user) is None:
            return Response(
                {"detail": "Quiz activo não encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        questions = QuizQuestion.objects.filter(
            is_active=True,
        ).prefetch_related("options")

        serializer = QuizQuestionSerializer(questions, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)


class QuizQuestionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id, question_id):
        if get_active_session(session_id, request.user) is None:
            return Response(
                {"detail": "Quiz activo não encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            question = QuizQuestion.objects.prefetch_related(
                "options",
            ).get(
                pk=question_id,
                is_active=True,
            )
        except QuizQuestion.DoesNotExist:
            return Response(
                {"detail": "Pergunta não encontrada."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = QuizQuestionSerializer(question)

        return Response(serializer.data, status=status.HTTP_200_OK)


class SubmitQuizAnswerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id, question_id):
        if get_active_session(session_id, request.user) is None:
            return Response(
                {"detail": "Quiz activo não encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = SubmitQuizAnswerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            question = QuizQuestion.objects.get(
                pk=question_id,
                is_active=True,
            )
        except QuizQuestion.DoesNotExist:
            return Response(
                {"detail": "Pergunta não encontrada."},
                status=status.HTTP_404_NOT_FOUND,
            )

        option = serializer.validated_data["option_id"]

        if option.question_id != question.id:
            return Response(
                {"detail": "A opção não pertence a esta pergunta."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        correct_option = question.options.get(is_correct=True)

        return Response(
            {
                "question_id": question.id,
                "selected_option_id": option.id,
                "is_correct": option.is_correct,
                "correct_option_id": correct_option.id,
                "explanation": question.explanation,
            },
            status=status.HTTP_200_OK,
        )

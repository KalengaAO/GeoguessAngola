from django.db import IntegrityError, transaction
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from django.utils import timezone

from .models import QuizAnswer, QuizOption, QuizQuestion, QuizSession
from .serializers import (
    QuizProgressSerializer,
    QuizQuestionSerializer,
    SubmitQuizAnswerSerializer,
)


def get_progress(session):
    total_questions = QuizQuestion.objects.filter(is_active=True).count()
    answered_questions = session.answers.count()
    percentage = (
        round((session.score / (total_questions * 100)) * 100, 2)
        if total_questions
        else 0
    )

    return QuizProgressSerializer(
        {
            "answered_questions": answered_questions,
            "total_questions": total_questions,
            "score": session.score,
            "percentage": percentage,
        },
    ).data


def session_response(session):
    return {
        "session_id": session.id,
        "status": session.status,
        "score": session.score,
        "progress": get_progress(session),
        "started_at": session.started_at,
        "ended_at": session.ended_at,
    }


class StartQuizSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            with transaction.atomic():
                if QuizSession.objects.select_for_update().filter(
                    user=request.user,
                    status=QuizSession.Status.ACTIVE,
                ).exists():
                    return Response(
                        {"detail": "Já existe um quiz activo para este utilizador."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                session = QuizSession.objects.create(user=request.user)
        except IntegrityError:
            return Response(
                {"detail": "Já existe um quiz activo para este utilizador."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            session_response(session),
            status=status.HTTP_201_CREATED,
        )


class EndQuizSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        try:
            with transaction.atomic():
                session = (
                    QuizSession.objects
                    .select_for_update()
                    .get(
                        pk=session_id,
                        user=request.user,
                        status=QuizSession.Status.ACTIVE,
                    )
                )
                session.status = QuizSession.Status.COMPLETED
                session.ended_at = timezone.now()
                session.save(update_fields=["status", "ended_at"])
        except QuizSession.DoesNotExist:
            return Response(
                {"detail": "Quiz activo não encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            session_response(session),
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
        serializer = SubmitQuizAnswerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        selected_option = serializer.validated_data["option_id"]

        try:
            with transaction.atomic():
                session = (
                    QuizSession.objects
                    .select_for_update()
                    .get(
                        pk=session_id,
                        user=request.user,
                        status=QuizSession.Status.ACTIVE,
                    )
                )

                try:
                    question = (
                        QuizQuestion.objects
                        .select_for_update()
                        .get(
                            pk=question_id,
                            is_active=True,
                        )
                    )
                except QuizQuestion.DoesNotExist:
                    return Response(
                        {"detail": "Pergunta não encontrada."},
                        status=status.HTTP_404_NOT_FOUND,
                    )

                try:
                    option = (
                        QuizOption.objects
                        .select_for_update()
                        .get(
                            pk=selected_option.pk,
                            question=question,
                        )
                    )
                except QuizOption.DoesNotExist:
                    return Response(
                        {"detail": "A opção não pertence a esta pergunta."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                if QuizAnswer.objects.filter(
                    session=session,
                    question=question,
                ).exists():
                    return Response(
                        {
                            "detail":
                            "Esta pergunta já foi respondida neste quiz."
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                is_correct = option.is_correct
                answer_score = 100 if is_correct else 0
                correct_option = (
                    QuizOption.objects
                    .select_for_update()
                    .get(question=question, is_correct=True)
                )

                QuizAnswer.objects.create(
                    session=session,
                    question=question,
                    option=option,
                    is_correct=is_correct,
                    score=answer_score,
                )

                session.score += answer_score

                total_questions = QuizQuestion.objects.filter(
                    is_active=True,
                ).count()
                answered_questions = session.answers.count()

                if answered_questions >= total_questions:
                    session.status = QuizSession.Status.COMPLETED
                    session.ended_at = timezone.now()

                session.save(
                    update_fields=[
                        "score",
                        "status",
                        "ended_at",
                    ],
                )
        except IntegrityError:
            return Response(
                {
                    "detail":
                    "Esta pergunta já foi respondida neste quiz."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        except QuizSession.DoesNotExist:
            return Response(
                {"detail": "Quiz activo não encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            {
                "question_id": question.id,
                "selected_option_id": option.id,
                "is_correct": is_correct,
                "score": answer_score,
                "correct_option_id": correct_option.id,
                "explanation": question.explanation,
                "session": session_response(session),
            },
            status=status.HTTP_200_OK,
        )

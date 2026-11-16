from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from .models import QuizOption, QuizQuestion, QuizSession


class QuizApiTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="quiz-player",
            password="strong-password",
        )
        self.question = QuizQuestion.objects.create(
            question="Qual é a capital de Angola?",
            category=QuizQuestion.Category.PROVINCE,
            province="Luanda",
            explanation="Luanda é a capital de Angola.",
        )
        self.options = [
            QuizOption.objects.create(
                question=self.question,
                text=text,
                order=order,
                is_correct=order == 1,
            )
            for order, text in enumerate(
                ["Luanda", "Huambo", "Benguela", "Lubango"],
                start=1,
            )
        ]

    def test_questions_return_four_options_without_correct_answer(self):
        self.client.force_authenticate(self.user)
        session_response = self.client.post("/api/quiz/sessions/")
        self.session_id = session_response.data["session_id"]

        response = self.client.get("/api/quiz/questions/")

        self.assertEqual(response.status_code, 404)

        response = self.client.get(
            f"/api/quiz/sessions/{self.session_id}/questions/",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data[0]["options"]), 4)
        self.assertNotIn("is_correct", response.data[0]["options"][0])

    def test_answer_returns_result_for_option_from_question(self):
        self.client.force_authenticate(self.user)
        session = QuizSession.objects.create(user=self.user)

        response = self.client.post(
            f"/api/quiz/sessions/{session.id}/questions/"
            f"{self.question.id}/answer/",
            {"option_id": self.options[0].id},
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["is_correct"])

    def test_answer_rejects_option_from_another_question(self):
        other_question = QuizQuestion.objects.create(
            question="Outra pergunta",
            category=QuizQuestion.Category.LOCATION,
        )
        other_option = QuizOption.objects.create(
            question=other_question,
            text="Opção",
            order=1,
            is_correct=True,
        )
        self.client.force_authenticate(self.user)
        session = QuizSession.objects.create(user=self.user)

        response = self.client.post(
            f"/api/quiz/sessions/{session.id}/questions/"
            f"{self.question.id}/answer/",
            {"option_id": other_option.id},
        )

        self.assertEqual(response.status_code, 400)

    def test_user_cannot_start_two_active_quizzes(self):
        self.client.force_authenticate(self.user)

        self.assertEqual(
            self.client.post("/api/quiz/sessions/").status_code,
            201,
        )
        response = self.client.post("/api/quiz/sessions/")

        self.assertEqual(response.status_code, 400)

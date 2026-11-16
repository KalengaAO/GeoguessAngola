from django.conf import settings
from django.db import models
from django.db.models import Q


class QuizSession(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Activa"
        COMPLETED = "completed", "Concluída"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="quiz_sessions",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
    )
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user"],
                condition=Q(status="active"),
                name="unique_active_quiz_session_per_user",
            ),
        ]
        ordering = ["-started_at"]

    def __str__(self):
        return f"Quiz de {self.user.username} ({self.status})"


class QuizQuestion(models.Model):
    class Category(models.TextChoices):
        LOCATION = "location", "Localização"
        PROVINCE = "province", "Província"

    question = models.TextField()
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
    )
    province = models.CharField(
        max_length=100,
        blank=True,
    )
    explanation = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return self.question


class QuizOption(models.Model):
    question = models.ForeignKey(
        QuizQuestion,
        on_delete=models.CASCADE,
        related_name="options",
    )
    text = models.CharField(max_length=255)
    order = models.PositiveSmallIntegerField()
    is_correct = models.BooleanField(default=False)

    class Meta:
        ordering = ["order"]
        constraints = [
            models.UniqueConstraint(
                fields=["question", "order"],
                name="unique_quiz_option_order",
            ),
            models.CheckConstraint(
                condition=Q(order__gte=1) & Q(order__lte=4),
                name="quiz_option_order_valid",
            ),
            models.UniqueConstraint(
                fields=["question"],
                condition=Q(is_correct=True),
                name="unique_correct_quiz_option",
            ),
        ]

    def __str__(self):
        return f"{self.question_id} - {self.order}"

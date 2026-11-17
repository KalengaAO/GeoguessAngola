from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("quiz", "0002_quizsession"),
    ]

    operations = [
        migrations.AddField(
            model_name="quizsession",
            name="score",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.CreateModel(
            name="QuizAnswer",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("is_correct", models.BooleanField()),
                ("score", models.PositiveIntegerField(default=0)),
                ("answered_at", models.DateTimeField(auto_now_add=True)),
                (
                    "option",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="quiz_answers",
                        to="quiz.quizoption",
                    ),
                ),
                (
                    "question",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="quiz_answers",
                        to="quiz.quizquestion",
                    ),
                ),
                (
                    "session",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="answers",
                        to="quiz.quizsession",
                    ),
                ),
            ],
            options={"ordering": ["answered_at"]},
        ),
        migrations.AddConstraint(
            model_name="quizanswer",
            constraint=models.UniqueConstraint(
                fields=("session", "question"),
                name="unique_quiz_answer_per_question",
            ),
        ),
    ]

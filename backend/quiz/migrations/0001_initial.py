from django.db import migrations, models
import django.db.models.deletion


QUESTIONS = [
    {
        "question": "Em que província se encontra a Serra da Leba?",
        "category": "location",
        "province": "Huíla",
        "explanation": "A Serra da Leba fica na província da Huíla.",
        "options": [
            ("Huíla", True),
            ("Namibe", False),
            ("Benguela", False),
            ("Cunene", False),
        ],
    },
    {
        "question": "Qual é a capital da província de Cabinda?",
        "category": "province",
        "province": "Cabinda",
        "explanation": "A cidade de Cabinda é a capital da província com o mesmo nome.",
        "options": [
            ("Cabinda", True),
            ("Soyo", False),
            ("Uíge", False),
            ("Dundo", False),
        ],
    },
    {
        "question": "Em que província se encontram as Pedras Negras de Pungo Andongo?",
        "category": "location",
        "province": "Malanje",
        "explanation": "As Pedras Negras de Pungo Andongo são uma atração natural de Malanje.",
        "options": [
            ("Malanje", True),
            ("Kwanza Sul", False),
            ("Bié", False),
            ("Lunda Norte", False),
        ],
    },
    {
        "question": "Qual destas cidades é a capital da província do Huambo?",
        "category": "province",
        "province": "Huambo",
        "explanation": "A cidade do Huambo é a capital da província do Huambo.",
        "options": [
            ("Huambo", True),
            ("Lubango", False),
            ("Lobito", False),
            ("Menongue", False),
        ],
    },
    {
        "question": "Em que província está localizada a Fenda da Tundavala?",
        "category": "location",
        "province": "Huíla",
        "explanation": "A Fenda da Tundavala é um miradouro natural localizado na Huíla.",
        "options": [
            ("Huíla", True),
            ("Namibe", False),
            ("Cuando Cubango", False),
            ("Benguela", False),
        ],
    },
]


def create_questions(apps, schema_editor):
    question_model = apps.get_model("quiz", "QuizQuestion")
    option_model = apps.get_model("quiz", "QuizOption")

    for data in QUESTIONS:
        question = question_model.objects.create(
            question=data["question"],
            category=data["category"],
            province=data["province"],
            explanation=data["explanation"],
        )

        option_model.objects.bulk_create(
            [
                option_model(
                    question=question,
                    text=text,
                    order=order,
                    is_correct=is_correct,
                )
                for order, (text, is_correct) in enumerate(
                    data["options"],
                    start=1,
                )
            ],
        )


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="QuizQuestion",
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
                ("question", models.TextField()),
                (
                    "category",
                    models.CharField(
                        choices=[
                            ("location", "Localização"),
                            ("province", "Província"),
                        ],
                        max_length=20,
                    ),
                ),
                ("province", models.CharField(blank=True, max_length=100)),
                ("explanation", models.TextField(blank=True)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"ordering": ["id"]},
        ),
        migrations.CreateModel(
            name="QuizOption",
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
                ("text", models.CharField(max_length=255)),
                ("order", models.PositiveSmallIntegerField()),
                ("is_correct", models.BooleanField(default=False)),
                (
                    "question",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="options",
                        to="quiz.quizquestion",
                    ),
                ),
            ],
            options={"ordering": ["order"]},
        ),
        migrations.AddConstraint(
            model_name="quizoption",
            constraint=models.UniqueConstraint(
                fields=("question", "order"),
                name="unique_quiz_option_order",
            ),
        ),
        migrations.AddConstraint(
            model_name="quizoption",
            constraint=models.CheckConstraint(
                condition=models.Q(("order__gte", 1), ("order__lte", 4)),
                name="quiz_option_order_valid",
            ),
        ),
        migrations.AddConstraint(
            model_name="quizoption",
            constraint=models.UniqueConstraint(
                condition=models.Q(("is_correct", True)),
                fields=("question",),
                name="unique_correct_quiz_option",
            ),
        ),
        migrations.RunPython(create_questions, migrations.RunPython.noop),
    ]

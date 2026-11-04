from django.db import models
from django.db.models import Q
from django.db.models import QuerySet
from django.conf import settings

class GeoLocation(models.Model):
    name = models.CharField(max_length=120)
    province = models.CharField(max_length=100)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=Q(latitude__gte=-90) & Q(latitude__lte=90),
                name="geolocation_latitude_valid",
            ),
            models.CheckConstraint(
                condition=Q(longitude__gte=-180) & Q(longitude__lte=180),
                name="geolocation_longitude_valid",
            ),
        ]

    def __str__(self):
        return f"{self.name}, {self.province}, Angola"

class LocationImage(models.Model):
    location = models.ForeignKey(
        GeoLocation,
        on_delete=models.CASCADE,
        related_name="images",
    )
    image = models.ImageField(upload_to="locations/")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Imagem de {self.location.name}"

class GameSession(models.Model):
    class Status(models.TextChoices):
        IN_PROGRESS = "in_progress", "Em andamento"
        COMPLETED = "completed", "Concluída"
        ABANDONED = "abandoned", "Abandonada"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="game_sessions",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.IN_PROGRESS,
    )
    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Partida {self.pk} — {self.user}"


class GameRound(models.Model):
    session = models.ForeignKey(
        GameSession,
        on_delete=models.CASCADE,
        related_name="rounds",
    )
    image = models.ForeignKey(
        LocationImage,
        on_delete=models.PROTECT,
        related_name="game_rounds",
    )
    round_number = models.PositiveSmallIntegerField()
    guessed_latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
    )
    guessed_longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
    )
    score = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    answered_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["session", "round_number"],
                name="unique_round_number_per_session",
            ),
        ]
        ordering = ["session", "round_number"]

    def __str__(self):
        return f"Partida {self.session_id} — Ronda {self.round_number}"


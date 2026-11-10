
from django.conf import settings
from django.db import models
from django.db.models import Q


class GameRoom(models.Model):

    class Status(models.TextChoices):
        WAITING = "waiting", "À espera"
        IN_PROGRESS = "in_progress", "Em jogo"
        FINISHED = "finished", "Concluída"
        CLOSED = "closed", "Fechada"

    host = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="hosted_game_rooms",
    )

    code = models.CharField(
        max_length=8,
        unique=True,
        editable=False,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.WAITING,
    )

    max_players = models.PositiveSmallIntegerField(default=5)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Sala {self.code}"


class RoomParticipant(models.Model):

    room = models.ForeignKey(
        GameRoom,
        on_delete=models.CASCADE,
        related_name="participants",
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="multiplayer_participations",
    )

    is_ready = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["room", "user"],
                name="unique_room_participant",
            ),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.room.code}"


class MultiplayerMatch(models.Model):

    class Status(models.TextChoices):
        IN_PROGRESS = "in_progress", "Em andamento"
        COMPLETED = "completed", "Concluída"
        CANCELLED = "cancelled", "Cancelada"

    room = models.OneToOneField(
        GameRoom,
        on_delete=models.PROTECT,
        related_name="match",
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.IN_PROGRESS,
    )

    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Partida da sala {self.room.code}"


class MultiplayerRound(models.Model):

    class Status(models.TextChoices):
        ACTIVE = "active", "Ativa"
        COMPLETED = "completed", "Concluída"

    match = models.ForeignKey(
        MultiplayerMatch,
        on_delete=models.CASCADE,
        related_name="rounds",
    )

    image = models.ForeignKey(
        "game.LocationImage",
        on_delete=models.PROTECT,
        related_name="multiplayer_rounds",
    )

    round_number = models.PositiveSmallIntegerField()

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
    )

    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["match", "round_number"],
                name="unique_multiplayer_match_round",
            ),
        ]

        ordering = ["match", "round_number"]

    def __str__(self):
        return f"Partida {self.match_id} - Ronda {self.round_number}"


class MultiplayerGuess(models.Model):

    round = models.ForeignKey(
        MultiplayerRound,
        on_delete=models.CASCADE,
        related_name="guesses",
    )

    participant = models.ForeignKey(
        RoomParticipant,
        on_delete=models.CASCADE,
        related_name="guesses",
    )

    guessed_latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
    )

    guessed_longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
    )

    distance_km = models.DecimalField(
        max_digits=10,
        decimal_places=3,
    )

    score = models.PositiveIntegerField(default=0)

    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["round", "participant"],
                name="unique_participant_guess_per_round",
            ),
            models.CheckConstraint(
                condition=Q(
                    guessed_latitude__gte=-90,
                    guessed_latitude__lte=90,
                ),
                name="multiplayer_guess_latitude_range",
            ),
            models.CheckConstraint(
                condition=Q(
                    guessed_longitude__gte=-180,
                    guessed_longitude__lte=180,
                ),
                name="multiplayer_guess_longitude_range",
            ),
        ]

    def __str__(self):
        return (
            f"{self.participant.user.username} - "
            f"Ronda {self.round.round_number}"
        )

from django.db import models
from django.conf import settings
from django.db.models import Q


class UserProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    avatar = models.ImageField(
        upload_to="avatars/",
        null=True,
        blank=True,
    )
    bio = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Perfil de {self.user.username}"


class Friendship(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pendente"
        ACCEPTED = "accepted", "Aceite"
        REJECTED = "rejected", "Rejeitado"
        CANCELLED = "cancelled", "Cancelado"

    requester = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="friendship_requests_sent",
    )
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="friendship_requests_received",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["requester", "receiver"],
                name="unique_friendship_request",
            ),
            models.CheckConstraint(
                condition=~Q(requester=models.F("receiver")),
                name="friendship_cannot_be_self",
            ),
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.requester.username} -> {self.receiver.username}"
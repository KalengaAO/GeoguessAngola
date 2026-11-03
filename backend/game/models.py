from django.db import models
from django.db.models import Q
from django.db.models import QuerySet

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

def get_playable_images() -> QuerySet:
    return LocationImage.objects.filter(
        is_active=True,
        location__is_active=True,
    ).select_related("location")

def choose_random_image():
    return get_playable_images().order_by("?").first()
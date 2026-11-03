from django.contrib import admin
from .models import GeoLocation, LocationImage, GameSession, GameRound


@admin.register(GeoLocation)
class GeoLocationAdmin(admin.ModelAdmin):
    list_display = ("name", "province", "is_active")
    list_filter = ("province", "is_active")
    search_fields = ("name", "province")
    ordering = ("province", "name")


@admin.register(LocationImage)
class LocationImageAdmin(admin.ModelAdmin):
    list_display = ("location", "is_active", "created_at")
    list_filter = ("is_active", "location__province")
    search_fields = ("location__name",)

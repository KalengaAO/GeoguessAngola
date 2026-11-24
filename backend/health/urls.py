from django.urls import path
from .healths import health

urlpatterns = [path("", health, name="health")]
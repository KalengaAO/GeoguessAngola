import math
from django.db import transaction
from .models import GameSession, GameRound, LocationImage
from django.utils import timezone
from .models import GameSession, GameRound, LocationImage

def get_playable_images():
    return LocationImage.objects.filter(
        is_active=True,
        location__is_active=True,
    ).select_related("location")


def choose_random_image():
    return get_playable_images().order_by("?").first()


@transaction.atomic
def start_game(user):
    image = choose_random_image()

    if image is None:
        raise ValueError(
            "Não existem imagens ativas disponíveis para iniciar o jogo."
        )

    session = GameSession.objects.create(user=user)

    game_round = GameRound.objects.create(
        session=session,
        image=image,
        round_number=1,
    )
    
    return session, game_round

def calculate_distance_km(lat1, lon1, lat2, lon2):
    """Calcula a distância entre duas coordenadas, em quilómetros."""
    earth_radius_km = 6371.0088

    lat1, lon1, lat2, lon2 = map(
        math.radians,
        (lat1, lon1, lat2, lon2),
    )

    delta_lat = lat2 - lat1
    delta_lon = lon2 - lon1

    a = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(lat1)
        * math.cos(lat2)
        * math.sin(delta_lon / 2) ** 2
    )

    return 2 * earth_radius_km * math.asin(math.sqrt(a))

def calculate_score(distance_km):
    return max(0, round(5000 * (1 - distance_km / 500)))


@transaction.atomic
def submit_round_answer(game_round_id, user, guessed_latitude, guessed_longitude):
    game_round = (
        GameRound.objects
        .select_for_update()
        .select_related("session", "image__location")
        .get(pk=game_round_id, session__user=user)
    )

    if game_round.answered_at is not None:
        raise ValueError("Esta ronda já foi respondida.")

    if game_round.session.status != GameSession.Status.IN_PROGRESS:
        raise ValueError("Esta partida já não está em andamento.")

    guessed_latitude = float(guessed_latitude)
    guessed_longitude = float(guessed_longitude)

    if not -90 <= guessed_latitude <= 90:
        raise ValueError("Latitude inválida.")

    if not -180 <= guessed_longitude <= 180:
        raise ValueError("Longitude inválida.")

    location = game_round.image.location

    distance_km = calculate_distance_km(
        float(location.latitude),
        float(location.longitude),
        guessed_latitude,
        guessed_longitude,
    )

    game_round.guessed_latitude = guessed_latitude
    game_round.guessed_longitude = guessed_longitude
    game_round.score = calculate_score(distance_km)
    game_round.answered_at = timezone.now()
    game_round.save(
        update_fields=[
            "guessed_latitude",
            "guessed_longitude",
            "score",
            "answered_at",
        ]
    )

    return game_round, distance_km
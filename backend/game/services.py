import math
from django.db import transaction
from .models import GameSession, GameRound, LocationImage
from django.utils import timezone
from .models import GameSession, GameRound, LocationImage
from django.conf import settings

def get_playable_images():
    return LocationImage.objects.filter(
        is_active=True,
        location__is_active=True,
    ).select_related("location")

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

@transaction.atomic
def advance_game(session_id, user):
    session = (
        GameSession.objects
        .select_for_update()
        .get(pk=session_id, user=user)
    )

    if session.status != GameSession.Status.IN_PROGRESS:
        raise ValueError("Esta partida já não está em andamento.")

    rounds = list(
        session.rounds.order_by("round_number")
    )

    if not rounds:
        raise ValueError("Esta partida ainda não tem rondas.")

    current_round = rounds[-1]

    if current_round.answered_at is None:
        raise ValueError("A ronda atual ainda não foi respondida.")

    if current_round.round_number >= settings.ROUNDS_PER_GAME:
        session.status = GameSession.Status.COMPLETED
        session.finished_at = timezone.now()
        session.save(update_fields=["status", "finished_at"])
        return session, None

    used_image_ids = session.rounds.values_list("image_id", flat=True)
    image = choose_random_image(exclude_ids=used_image_ids)

    if image is None:
        raise ValueError("Não existem imagens ativas disponíveis.")

    next_round = GameRound.objects.create(
        session=session,
        image=image,
        round_number=current_round.round_number + 1,
    )

    return session, next_round

def choose_random_image(exclude_ids=None):
    images = get_playable_images()

    if exclude_ids:
        images = images.exclude(id__in=exclude_ids)

    return images.order_by("?").first()
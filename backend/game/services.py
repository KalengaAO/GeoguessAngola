import math
from django.db import transaction
from .models import GameSession, GameRound, LocationImage
from django.utils import timezone
from .models import GameSession, GameRound, LocationImage
from django.conf import settings
from django.db.models import Sum
from .models import PlayerStats

def get_playable_images():
    return LocationImage.objects.filter(
        is_active=True,
        location__is_active=True,
    ).select_related("location")

@transaction.atomic
def start_game(user):
    if GameSession.objects.filter(
        user=user,
        status=GameSession.Status.IN_PROGRESS,
    ).exists():
        raise ValueError(
            "Já existe uma partida em andamento. Retoma essa partida antes "
            "de iniciar uma nova."
        )

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


def get_active_game(user):
    return (
        GameSession.objects
        .filter(
            user=user,
            status=GameSession.Status.IN_PROGRESS,
        )
        .prefetch_related("rounds__image__location")
        .order_by("-started_at")
        .first()
    )

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
def submit_round_answer(
    game_round_id,
    user,
    guessed_latitude,
    guessed_longitude,
):
    """Regista o palpite e devolve os dados das duas localizações."""
    game_round = (
        GameRound.objects
        .select_for_update()
        .select_related("session", "image__location")
        .get(
            pk=game_round_id,
            session__user=user,
        )
    )

    if game_round.answered_at is not None:
        raise ValueError("Esta ronda já foi respondida.")

    if game_round.session.status != GameSession.Status.IN_PROGRESS:
        raise ValueError("Esta partida já não está em andamento.")

    answer_deadline = (
        settings.ROUND_TIME_SECONDS + settings.ROUND_TIME_GRACE_SECONDS
    )
    elapsed_seconds = (timezone.now() - game_round.started_at).total_seconds()

    if elapsed_seconds > answer_deadline:
        raise ValueError("O tempo para responder a esta ronda terminou.")

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

    correct_location = {
        "latitude": float(location.latitude),
        "longitude": float(location.longitude),
    }

    return game_round, distance_km, correct_location


@transaction.atomic
def timeout_round(game_round_id, user):
    game_round = (
        GameRound.objects
        .select_for_update()
        .select_related("session", "image__location")
        .get(
            pk=game_round_id,
            session__user=user,
        )
    )

    if (
        game_round.answered_at is not None
        and game_round.guessed_latitude is None
        and game_round.guessed_longitude is None
        and game_round.score == 0
    ):
        return game_round

    if game_round.answered_at is not None:
        raise ValueError("Esta ronda já foi concluída.")

    if game_round.session.status != GameSession.Status.IN_PROGRESS:
        raise ValueError("Esta partida já não está em andamento.")

    timeout_after = settings.ROUND_TIME_SECONDS
    elapsed_seconds = (timezone.now() - game_round.started_at).total_seconds()

    if elapsed_seconds < timeout_after:
        raise ValueError("A ronda ainda está dentro do tempo permitido.")

    game_round.score = 0
    game_round.answered_at = timezone.now()
    game_round.save(update_fields=["score", "answered_at"])

    return game_round


@transaction.atomic
def advance_game(session_id, user):
    session = (
        GameSession.objects
        .select_for_update()
        .get(pk=session_id, user=user)
    )

    if session.status == GameSession.Status.COMPLETED:
        return session, None

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
        complete_game(session_id=session_id, user=user)
        session.refresh_from_db()
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


@transaction.atomic
def complete_game(session_id, user):
    session = (
        GameSession.objects
        .select_for_update()
        .get(pk=session_id, user=user)
    )

    if session.status == GameSession.Status.COMPLETED:
        return session

    if session.status != GameSession.Status.IN_PROGRESS:
        raise ValueError("Esta partida já não está em andamento.")

    rounds = session.rounds.order_by("round_number")
    if rounds.count() < settings.ROUNDS_PER_GAME:
        raise ValueError("A partida ainda não tem todas as rondas.")

    if rounds.filter(answered_at__isnull=True).exists():
        raise ValueError("Ainda existem rondas por responder.")

    session.status = GameSession.Status.COMPLETED
    session.finished_at = timezone.now()
    session.save(update_fields=["status", "finished_at"])
    update_player_stats(session)
    return session


@transaction.atomic
def abandon_game(session_id, user):
    session = (
        GameSession.objects
        .select_for_update()
        .get(pk=session_id, user=user)
    )

    if session.status == GameSession.Status.ABANDONED:
        return session

    if session.status != GameSession.Status.IN_PROGRESS:
        raise ValueError("Esta partida já não está em andamento.")

    session.status = GameSession.Status.ABANDONED
    session.finished_at = timezone.now()
    session.save(update_fields=["status", "finished_at"])
    return session

def choose_random_image(exclude_ids=None):
    images = get_playable_images()

    if exclude_ids:
        images = images.exclude(id__in=exclude_ids)

    return images.order_by("?").first()

@transaction.atomic
def update_player_stats(session):
    result = session.rounds.aggregate(
        total_score=Sum("score"),
    )

    session_score = result["total_score"] or 0

    completed_rounds = session.rounds.filter(
        answered_at__isnull=False,
    ).count()

    stats, _ = PlayerStats.objects.get_or_create(
        user=session.user,
    )

    # Bloqueia o registo durante a atualização.
    stats = PlayerStats.objects.select_for_update().get(
        pk=stats.pk,
    )

    stats.total_score += session_score
    stats.games_played += 1
    stats.best_score = max(stats.best_score, session_score)
    stats.completed_rounds += completed_rounds

    stats.save(update_fields=[
        "total_score",
        "games_played",
        "best_score",
        "completed_rounds",
        "updated_at",
    ])

    return stats
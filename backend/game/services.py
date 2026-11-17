import math

from django.conf import settings
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone

from .models import GameSession, GameRound, LocationImage, PlayerStats


# ---------------------------------------------------------------------------
# Imagens
# ---------------------------------------------------------------------------

def get_playable_images():
    return LocationImage.objects.filter(
        is_active=True,
        location__is_active=True,
    ).select_related("location")


def choose_random_image(exclude_ids=None):
    images = get_playable_images()

    if exclude_ids:
        images = images.exclude(id__in=exclude_ids)

    return images.order_by("?").first()


# ---------------------------------------------------------------------------
# Cálculos
# ---------------------------------------------------------------------------

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
    """
    Pontuação máxima de 5000, que desce linearmente até 0 aos
    SCORE_MAX_DISTANCE_KM (settings.py; por omissão 1500 km).
    """
    max_points = 5000
    max_distance = getattr(settings, "SCORE_MAX_DISTANCE_KM", 1500)

    return max(0, round(max_points * (1 - distance_km / max_distance)))


def get_session_total_score(session):
    result = session.rounds.filter(
        answered_at__isnull=False,
    ).aggregate(total=Sum("score"))

    return result["total"] or 0


# ---------------------------------------------------------------------------
# Tempo da ronda (o servidor é a autoridade)
# ---------------------------------------------------------------------------

def get_round_time_limit():
    return getattr(settings, "ROUND_TIME_SECONDS", 30)


def get_round_grace():
    """Tolerância para a latência da rede ao submeter perto do fim."""
    return getattr(settings, "ROUND_TIME_GRACE_SECONDS", 3)


def get_elapsed_seconds(game_round):
    return (timezone.now() - game_round.started_at).total_seconds()


def get_seconds_remaining(game_round):
    """Segundos que faltam; None se a ronda já foi respondida."""
    if game_round.answered_at is not None:
        return None

    remaining = get_round_time_limit() - get_elapsed_seconds(game_round)
    return max(0, round(remaining, 1))


def has_time_run_out(game_round):
    """O tempo acabou (com 1s de tolerância para o relógio do cliente)."""
    return get_elapsed_seconds(game_round) >= get_round_time_limit() - 1


def is_round_overdue(game_round):
    """Passou do limite + tolerância: já não se aceitam palpites."""
    limit = get_round_time_limit() + get_round_grace()
    return get_elapsed_seconds(game_round) > limit


def _mark_timed_out(game_round):
    """Fecha a ronda sem palpite: 0 pontos."""
    game_round.guessed_latitude = None
    game_round.guessed_longitude = None
    game_round.score = 0
    game_round.answered_at = timezone.now()
    game_round.save(
        update_fields=[
            "guessed_latitude",
            "guessed_longitude",
            "score",
            "answered_at",
        ]
    )


@transaction.atomic
def expire_overdue_rounds(session):
    """
    Fecha rondas abandonadas (ex.: o jogador fechou a página ou fez refresh
    muito depois de o tempo acabar).
    """
    overdue = session.rounds.select_for_update().filter(
        answered_at__isnull=True,
    )

    for game_round in overdue:
        if is_round_overdue(game_round):
            _mark_timed_out(game_round)


# ---------------------------------------------------------------------------
# Fluxo do jogo
# ---------------------------------------------------------------------------

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


@transaction.atomic
def submit_round_answer(
    game_round_id,
    user,
    guessed_latitude,
    guessed_longitude,
):
    """
    Devolve (game_round, distance_km). Se o palpite chegar fora de tempo,
    a ronda é fechada com 0 pontos e distance_km é None.
    """
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

    if is_round_overdue(game_round):
        _mark_timed_out(game_round)
        return game_round, None

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
def timeout_round(game_round_id, user):
    """O jogador não respondeu a tempo: fecha a ronda com 0 pontos."""
    game_round = (
        GameRound.objects
        .select_for_update()
        .select_related("session", "image__location")
        .get(pk=game_round_id, session__user=user)
    )

    # Idempotente: se já foi respondida, devolve-a tal como está.
    if game_round.answered_at is not None:
        return game_round

    if game_round.session.status != GameSession.Status.IN_PROGRESS:
        raise ValueError("Esta partida já não está em andamento.")

    if not has_time_run_out(game_round):
        raise ValueError("O tempo desta ronda ainda não terminou.")

    _mark_timed_out(game_round)

    return game_round


@transaction.atomic
def advance_game(session_id, user):
    session = (
        GameSession.objects
        .select_for_update()
        .get(pk=session_id, user=user)
    )

    if session.status != GameSession.Status.IN_PROGRESS:
        raise ValueError("Esta partida já não está em andamento.")

    last_round = (
        session.rounds.order_by("-round_number").first()
    )

    if last_round is None:
        raise ValueError("Esta partida ainda não tem rondas.")

    current_round = (
        GameRound.objects
        .select_for_update()
        .select_related("image")
        .get(pk=last_round.pk)
    )

    if current_round.answered_at is None:
        if has_time_run_out(current_round):
            _mark_timed_out(current_round)
        else:
            # Idempotente: pedidos duplicados não dão erro,
            # devolve a ronda que já está em curso.
            return session, current_round

    # Última ronda: termina a partida.
    if current_round.round_number >= settings.ROUNDS_PER_GAME:
        session.status = GameSession.Status.COMPLETED
        session.finished_at = timezone.now()
        session.save(update_fields=["status", "finished_at"])
        update_player_stats(session)
        return session, None

    used_image_ids = list(
        session.rounds.values_list("image_id", flat=True)
    )

    image = choose_random_image(exclude_ids=used_image_ids)

    # Se houver menos imagens do que rondas, permite repetir.
    if image is None:
        image = choose_random_image()

    if image is None:
        raise ValueError("Não existem imagens ativas disponíveis.")

    next_round = GameRound.objects.create(
        session=session,
        image=image,
        round_number=current_round.round_number + 1,
    )

    return session, next_round


@transaction.atomic
def update_player_stats(session):
    session_score = get_session_total_score(session)

    completed_rounds = session.rounds.filter(
        answered_at__isnull=False,
    ).count()

    stats, _ = PlayerStats.objects.get_or_create(user=session.user)

    # Bloqueia o registo durante a atualização.
    stats = PlayerStats.objects.select_for_update().get(pk=stats.pk)

    stats.total_score += session_score
    stats.games_played += 1
    stats.best_score = max(stats.best_score, session_score)
    stats.completed_rounds += completed_rounds

    stats.save(
        update_fields=[
            "total_score",
            "games_played",
            "best_score",
            "completed_rounds",
            "updated_at",
        ]
    )

    return stats
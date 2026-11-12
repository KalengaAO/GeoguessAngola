import secrets
import string
from django.conf import settings
from django.utils import timezone
from django.db.models import Count, Q, Sum, Value
from django.db.models.functions import Coalesce
from django.db import IntegrityError, transaction
from game.services import (
        calculate_distance_km, calculate_score,
        choose_random_image,
    )
from .models import (
        GameRoom, RoomParticipant,
        MultiplayerMatch, MultiplayerRound,
        MultiplayerGuess,
        )


def generate_room_code():
    characters = string.ascii_uppercase + string.digits

    return "".join(
        secrets.choice(characters)
        for _ in range(8)
    )


@transaction.atomic
def create_room(user, max_players=5):

    if max_players < 2 or max_players > 5:
        raise ValueError(
            "A sala deve permitir entre 2 e 5 jogadores."
        )

    room = None

    for _ in range(10):
        code = generate_room_code()

        try:
            with transaction.atomic():
                room = GameRoom.objects.create(
                    host=user,
                    code=code,
                    max_players=max_players,
                )
            break

        except IntegrityError:
            continue

    if room is None:
        raise RuntimeError(
            "Não foi possível gerar um código único para a sala."
        )

    RoomParticipant.objects.create(
        room=room,
        user=user,
    )

    return room


@transaction.atomic
def join_room(user, code):

    try:
        room = GameRoom.objects.select_for_update().get(
            code=code.upper()
        )
    except GameRoom.DoesNotExist:
        raise ValueError("Sala não encontrada.")

    if room.status != GameRoom.Status.WAITING:
        raise ValueError("Esta sala já não está disponível.")

    participant = RoomParticipant.objects.filter(
        room=room,
        user=user,
    ).first()

    if participant and participant.is_active:
        raise ValueError("Já estás registado nesta sala.")

    active_players = RoomParticipant.objects.filter(
        room=room,
        is_active=True,
    ).count()

    if active_players >= room.max_players:
        raise ValueError("Esta sala já atingiu a capacidade máxima.")

    if participant:
        # Reativar um participante que tinha saído da sala.
        participant.is_active = True
        participant.is_ready = False
        participant.save(update_fields=["is_active", "is_ready"])
    else:
        participant = RoomParticipant.objects.create(
            room=room,
            user=user,
        )

    return participant


@transaction.atomic
def set_player_ready(user, room_code, is_ready):

    try:
        participant = RoomParticipant.objects.select_for_update().select_related(
            "room"
        ).get(
            room__code=room_code.upper(),
            user=user,
            is_active=True,
        )

    except RoomParticipant.DoesNotExist:
        raise ValueError(
            "Não és um participante ativo desta sala."
        )

    if participant.room.status != GameRoom.Status.WAITING:
        raise ValueError(
            "Não podes alterar a preparação desta sala."
        )

    participant.is_ready = is_ready

    participant.save(update_fields=["is_ready"])

    return participant

@transaction.atomic
def start_match(user, room_code):
    try:
        room = GameRoom.objects.select_for_update().get(
            code=room_code.upper()
        )
    except GameRoom.DoesNotExist:
        raise ValueError("Sala não encontrada.")

    if room.status != GameRoom.Status.WAITING:
        raise ValueError("Esta sala já não está disponível.")

    if room.host_id != user.id:
        raise ValueError("Apenas o anfitrião pode iniciar a partida.")

    participants = room.participants.filter(is_active=True)

    if participants.count() < 2:
        raise ValueError("São necessários pelo menos dois jogadores activos.")

    ready_players = participants.filter(is_ready=True).count()

    if ready_players < 2:
        raise ValueError(
            "São necessários pelo menos dois jogadores preparados."
        )

    image = choose_random_image()

    if image is None:
        raise ValueError(
            "Não existem imagens disponíveis para iniciar a partida."
        )

    match = MultiplayerMatch.objects.create(
        room=room
    )

    MultiplayerRound.objects.create(
        match=match,
        image=image,
        round_number=1,
    )

    room.status = GameRoom.Status.IN_PROGRESS
    room.save(update_fields=["status"])

    return match

def get_room_match(user, room_code):
    try:
        room = GameRoom.objects.get(code=room_code.upper())
    except GameRoom.DoesNotExist:
        raise ValueError("Sala não encontrada.")

    is_participant = room.participants.filter(
        user=user,
        is_active=True,
    ).exists()

    if not is_participant:
        raise ValueError("Não estás autorizado a consultar esta partida.")

    try:
        match = MultiplayerMatch.objects.select_related(
            "room"
        ).prefetch_related(
            "rounds__image",
            "room__participants__user",
        ).get(room=room)
    except MultiplayerMatch.DoesNotExist:
        raise ValueError("Esta sala ainda não tem uma partida.")

    return match




@transaction.atomic
def submit_multiplayer_guess(
    round_id,
    user,
    guessed_latitude,
    guessed_longitude,
):
    try:
        multiplayer_round = (
            MultiplayerRound.objects
            .select_for_update()
            .select_related(
                "match__room",
                "image__location",
            )
            .get(id=round_id)
        )
    except MultiplayerRound.DoesNotExist:
        raise ValueError("Ronda não encontrada.")

    if multiplayer_round.match.status != MultiplayerMatch.Status.IN_PROGRESS:
        raise ValueError("Esta partida já não está em andamento.")

    if multiplayer_round.status != MultiplayerRound.Status.ACTIVE:
        raise ValueError("Esta ronda já não está activa.")

    try:
        participant = RoomParticipant.objects.get(
            room=multiplayer_round.match.room,
            user=user,
            is_active=True,
        )
    except RoomParticipant.DoesNotExist:
        raise ValueError("Não és um participante activo nesta sala.")

    if MultiplayerGuess.objects.filter(
        round=multiplayer_round,
        participant=participant,
    ).exists():
        raise ValueError("Já submeteste um palpite nesta ronda.")

    try:
        guessed_latitude = float(guessed_latitude)
        guessed_longitude = float(guessed_longitude)
    except (TypeError, ValueError):
        raise ValueError("As coordenadas devem ser valores numéricos.")

    if not -90 <= guessed_latitude <= 90:
        raise ValueError("Latitude inválida.")

    if not -180 <= guessed_longitude <= 180:
        raise ValueError("Longitude inválida.")

    location = multiplayer_round.image.location

    distance_km = calculate_distance_km(
        float(location.latitude),
        float(location.longitude),
        guessed_latitude,
        guessed_longitude,
    )

    score = calculate_score(distance_km)

    guess = MultiplayerGuess.objects.create(
        round=multiplayer_round,
        participant=participant,
        guessed_latitude=guessed_latitude,
        guessed_longitude=guessed_longitude,
        distance_km=distance_km,
        score=score,
    )

    complete_round_if_ready(multiplayer_round)

    return guess

def complete_round_if_ready(multiplayer_round):
    room = multiplayer_round.match.room

    active_players = room.participants.filter(
        is_active=True
    ).count()

    submitted_guesses = MultiplayerGuess.objects.filter(
        round=multiplayer_round,
        participant__room=room,
        participant__is_active=True,
    ).count()

    if submitted_guesses >= active_players and active_players > 0:
        multiplayer_round.status = MultiplayerRound.Status.COMPLETED
        multiplayer_round.completed_at = timezone.now()

        multiplayer_round.save(
            update_fields=["status", "completed_at"]
        )

        return True

    return False


@transaction.atomic
def advance_multiplayer_round(match_id, user):
    try:
        match = MultiplayerMatch.objects.select_for_update().select_related(
            "room"
        ).get(id=match_id)
    except MultiplayerMatch.DoesNotExist:
        raise ValueError("Partida não encontrada.")

    if match.status != MultiplayerMatch.Status.IN_PROGRESS:
        raise ValueError("Esta partida já não está em andamento.")

    # Verificar se o utilizador pertence à sala e continua activo.
    is_participant = match.room.participants.filter(
        user=user,
        is_active=True,
    ).exists()

    if not is_participant:
        raise ValueError("Não és um participante activo nesta partida.")

    # Obter e bloquear a última ronda.
    last_round = match.rounds.select_for_update().order_by(
        "-round_number"
    ).first()

    if last_round is None:
        raise ValueError("Esta partida ainda não possui rondas.")

    if last_round.status != MultiplayerRound.Status.COMPLETED:
        raise ValueError("A ronda actual ainda não foi concluída.")

    # Verificar se a partida atingiu o limite de rondas.
    if last_round.round_number >= settings.ROUNDS_PER_GAME:
        match.status = MultiplayerMatch.Status.COMPLETED
        match.finished_at = timezone.now()
        match.save(update_fields=["status", "finished_at"])

        match.room.status = GameRoom.Status.FINISHED
        match.room.save(update_fields=["status"])

        return match, None

    # Recolher os IDs das imagens já utilizadas nesta partida.
    used_image_ids = match.rounds.values_list(
        "image_id",
        flat=True,
    )

    # Escolher uma imagem que ainda não tenha sido utilizada.
    image = choose_random_image(exclude_ids=used_image_ids)

    if image is None:
        raise ValueError(
            "Não existem imagens novas disponíveis para a próxima ronda."
        )

    next_round = MultiplayerRound.objects.create(
        match=match,
        image=image,
        round_number=last_round.round_number + 1,
    )

    return match, next_round

def get_match_results(match_id, user):
    try:
        match = MultiplayerMatch.objects.select_related(
            "room"
        ).get(id=match_id)
    except MultiplayerMatch.DoesNotExist:
        raise ValueError("Partida não encontrada.")

    # Apenas participantes da partida podem consultar os resultados.
    is_participant = match.room.participants.filter(
        user=user
    ).exists()

    if not is_participant:
        raise ValueError(
            "Não tens permissão para consultar os resultados desta partida."
        )

    results = match.room.participants.select_related(
        "user"
    ).annotate(
        total_score=Coalesce(
            Sum(
                "guesses__score",
                filter=Q(guesses__round__match=match),
            ),
            Value(0),
        ),
        rounds_played=Count(
            "guesses",
            filter=Q(guesses__round__match=match),
        ),
    ).order_by(
        "-total_score",
        "user__username",
    )

    return match, results

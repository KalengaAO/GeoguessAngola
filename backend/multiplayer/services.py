import secrets
import string
from django.db import IntegrityError, transaction
from .models import (
        GameRoom, RoomParticipant,
        MultiplayerMatch, MultiplayerRound)
from game.services import choose_random_image


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

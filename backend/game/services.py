from django.db import transaction

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
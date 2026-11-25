# Carregar e adicionar imagens do jogo

O jogo usa duas tabelas Django:

- `game.GeoLocation`: nome, província e coordenadas do local.
- `game.LocationImage`: ficheiro associado a uma localização e estado activo.

## Carregar os dados iniciais

Os fixtures `geo_locations_fixture.json` e `location_images_fixture.json` contêm
10 localizações e 9 imagens disponíveis. A imagem da Baía Azul referenciada
numa versão anterior do fixture não está presente em `media/locations/`, por
isso foi retirada do fixture de imagens para evitar criar um registo com um
ficheiro inexistente.

Confirma que os ficheiros estão em `backend/media/locations/` e que o
`MEDIA_ROOT` configurado no Django aponta para a pasta onde as imagens devem
ser guardadas. Copia os ficheiros para essa pasta, preservando a subpasta
`locations/`, se ainda não estiverem lá. Depois, a partir de `backend/`, corre:

```bash
python manage.py migrate
python manage.py loaddata geo_locations_fixture.json location_images_fixture.json
```

O Django carrega primeiro as localizações e depois as imagens, que referenciam
as localizações pelos seus IDs. `loaddata` pode ser executado novamente para
reaplicar os mesmos IDs dos fixtures; faz primeiro uma cópia de segurança se
existirem dados que não devam ser substituídos.

## Adicionar outras localizações manualmente (opcional)

Esta secção não é necessária para carregar os dados iniciais: os dois fixtures
acima já fazem isso. Usa o exemplo apenas quando quiseres acrescentar uma nova
localização directamente pelo Django, sem editar e voltar a carregar os JSON.

Abre a shell do Django a partir de `backend/`:

```bash
python manage.py shell
```

Cria a localização e associa o ficheiro. Neste exemplo, a imagem de origem está
em `backend/media/locations/`; o `ImageField` guarda-a através do storage
configurado no Django:

```python
from pathlib import Path
from django.core.files import File
from game.models import GeoLocation, LocationImage

location = GeoLocation.objects.create(
    name="Nome do local",
    province="Província",
    latitude=-12.345678,
    longitude=13.456789,
    is_active=True,
)

image_path = Path("media/locations/nome-do-ficheiro.jpg")
with image_path.open("rb") as source:
    LocationImage.objects.create(
        location=location,
        image=File(source, name=image_path.name),
        is_active=True,
    )
```

As coordenadas devem estar em graus decimais: latitude entre `-90` e `90`,
longitude entre `-180` e `180`. Coloca os ficheiros numa pasta persistente
configurada como `MEDIA_ROOT` no ambiente de execução, e mantém o caminho
relativo guardado pelo `ImageField` (por exemplo, `locations/foto.jpg`) para
que o Django consiga gerar a URL de media.

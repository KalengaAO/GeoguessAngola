# GeoguessAngola
O nosso projeto consiste no desenvolvimento de uma plataforma interativa que combina exploração geográfica e conhecimento cultural, inspirada no conceito do GeoGuessr, mas com um foco especial em Angola.


## DATABASE
postgres=# CREATE USER geoangola WITH PASSWORD '7teclado@';
CREATE ROLE
postgres=# CREATE DATABASE geoguessangola OWNER geoangola;
CREATE DATABASE

### DEFAULT ENV

export DB_PASSWORD='A_TUA_PASSWORD'

# Origens permitidas para chamadas do frontend (separadas por vírgula)
export CORS_ALLOWED_ORIGINS='http://localhost:5173'

# Necessário para requisições com métodos POST, PUT, PATCH ou DELETE
export CSRF_TRUSTED_ORIGINS='http://localhost:5173'

## ROUTES DA API

## Multiplayer API

Base URL: `/api/multiplayer/`

Todas as rotas requerem autenticação JWT (`Bearer Token`).

| Método | Endpoint | Descrição |
|:---:|---|---|
| POST | `/rooms/` | Cria uma sala multiplayer e regista o criador como anfitrião. |
| POST | `/rooms/join/` | Permite ao utilizador entrar numa sala através do código. |
| POST | `/rooms/ready/` | Actualiza o estado de preparação do participante. |
| POST | `/rooms/start/` | Inicia a partida após validar as condições de preparação e a autorização do anfitrião. |
| GET | `/rooms/{room_code}/match/` | Consulta os detalhes da partida, participantes e rondas. |
| POST | `/rounds/{round_id}/guess/` | Submete o palpite geográfico de um participante numa ronda. |
| POST | `/matches/{match_id}/advance/` | Conclui a partida ou cria a ronda seguinte. |
| GET | `/matches/{match_id}/results/` | Consulta a classificação e as pontuações acumuladas dos participantes. |


## Account API

Base URL: `/api/`

Todas as rotas protegidas requerem autenticação JWT (`Bearer Token`).

| Método | Endpoint | Descrição |
|:---:|---|---|
| POST | `/register/` | Regista um novo utilizador e cria o respectivo perfil. |
| POST | `/token/` | Autentica o utilizador e fornece os tokens JWT. |
| GET | `/account/profile/` | Consulta os dados do perfil do utilizador autenticado. |
| PATCH | `/account/profile/` | Actualiza os dados da conta e do perfil do utilizador. |


## Game API

Base URL: `/api/games/`

Todas as rotas requerem autenticação JWT (`Bearer Token`).

| Método | Endpoint | Descrição |
|:---:|---|---|
| POST | `/start/` | Inicia uma nova partida e cria a primeira ronda. |
| POST | `/rounds/{round_id}/answer/` | Submete a localização escolhida pelo jogador e calcula a distância e pontuação. |


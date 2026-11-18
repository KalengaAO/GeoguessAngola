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
| POST | `/account/password/change/` | Altera a palavra-passe com confirmação da palavra-passe actual. |
| POST | `/account/password/reset/` | Solicita um email de recuperação de palavra-passe. |
| POST | `/account/password/reset/confirm/` | Define uma nova palavra-passe usando o `uid` e `token` enviados por email. |
| DELETE | `/account/delete/` | Apaga a conta após confirmação da palavra-passe. |
| GET | `/account/players/?q=...` | Pesquisa jogadores por nome de utilizador. |
| GET | `/account/players/{username}/` | Consulta o perfil público e estatísticas de um jogador. |


## Game API

Base URL: `/api/games/`

Todas as rotas requerem autenticação JWT (`Bearer Token`).

| Método | Endpoint | Descrição |
|:---:|---|---|
| POST | `/start/` | Inicia uma nova partida e cria a primeira ronda. |
| POST | `/rounds/{round_id}/answer/` | Submete a localização escolhida pelo jogador e calcula a distância e pontuação. |


## Quiz API

Base URL: `/api/quiz/`

Todas as rotas requerem autenticação JWT (`Bearer Token`). Cada pergunta
disponibiliza quatro opções de resposta.

| Método | Endpoint | Descrição |
|:---:|---|---|
| POST | `/sessions/` | Inicia um quiz para o utilizador autenticado. Apenas um quiz pode estar activo por utilizador. |
| POST | `/sessions/{session_id}/end/` | Encerra o quiz activo do utilizador. |
| GET | `/sessions/{session_id}/questions/` | Lista as perguntas activas e as respectivas opções. |
| GET | `/sessions/{session_id}/questions/{question_id}/` | Consulta uma pergunta específica da sessão activa. |
| POST | `/sessions/{session_id}/questions/{question_id}/answer/` | Submete uma resposta através de `{"option_id": id}`, regista a resposta e actualiza a pontuação. |

Cada resposta correcta vale 100 pontos. Uma pergunta só pode ser respondida uma
vez por sessão. As respostas de sessão incluem `answered_questions`,
`total_questions`, `score` e `percentage`. A sessão é concluída automaticamente
quando todas as perguntas activas forem respondidas.


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


## Account API

Base URL: `/api/`

Todas as rotas protegidas requerem autenticação JWT (`Bearer Token`).

### Multiplayer API — Endpoints

| Método HTTP | Endpoint | View | Descrição |
|---|---|---|---|
| POST | `/api/multiplayer/rooms/` | `CreateRoomView` | Cria uma nova sala multiplayer. |
| POST | `/api/multiplayer/rooms/join/` | `JoinRoomView` | Permite ao jogador entrar numa sala existente. |
| POST | `/api/multiplayer/rooms/ready/` | `PlayerReadyView` | Regista que o jogador está pronto para iniciar a partida. |
| POST | `/api/multiplayer/rooms/leave/` | `LeaveRoomView` | Permite ao jogador sair de uma sala. |
| POST | `/api/multiplayer/rooms/invitations/` | `SendRoomInvitationView` | Envia um convite para outro jogador entrar numa sala. |
| GET | `/api/multiplayer/invitations/` | `RoomInvitationListView` | Lista os convites recebidos pelo jogador. |
| POST | `/api/multiplayer/invitations/{invitation_id}/{action}/` | `RespondRoomInvitationView` | Aceita ou rejeita um convite recebido. |
| POST | `/api/multiplayer/rooms/start/` | `StartMatchView` | Inicia uma partida multiplayer. |
| GET | `/api/multiplayer/rooms/{room_code}/` | `RoomLobbyView` | Retorna os detalhes e o estado atual da sala. |
| GET | `/api/multiplayer/rooms/{room_code}/match/` | `RoomMatchDetailView` | Retorna os detalhes da partida associada à sala. |
| POST | `/api/multiplayer/rounds/{round_id}/guess/` | `SubmitMultiplayerGuessView` | Submete a localização escolhida pelo jogador numa ronda. |
| POST | `/api/multiplayer/rounds/{round_id}/timeout/` | `TimeoutMultiplayerRoundView` | Regista o término do tempo disponível numa ronda. |
| POST | `/api/multiplayer/matches/{match_id}/advance/` | `AdvanceMultiplayerRoundView` | Avança a partida para a próxima ronda. |
| GET | `/api/multiplayer/matches/{match_id}/results/` | `MatchResultsView` | Retorna os resultados finais da partida multiplayer. |


## Game API

Base URL: `/api/games/`

Todas as rotas requerem autenticação JWT (`Bearer Token`).

| Método HTTP | Endpoint | View | Descrição |
|---|---|---|---|
| POST | `/api/games/start/` | `StartGameView` | Inicia uma nova sessão de jogo para o utilizador autenticado. |
| GET | `/api/games/resume/` | `ResumeGameView` | Recupera a sessão de jogo em andamento, permitindo ao jogador continuar. |
| GET | `/api/games/history/` | `GameHistoryView` | Retorna o histórico de sessões de jogo do utilizador. |
| GET | `/api/games/leaderboard/` | `LeaderboardView` | Retorna a classificação global dos jogadores. |
| POST | `/api/games/rounds/{round_id}/answer/` | `SubmitAnswerView` | Submete a resposta do jogador para uma ronda específica. |
| POST | `/api/games/rounds/{round_id}/timeout/` | `TimeoutRoundView` | Regista o término do tempo disponível para responder a uma ronda. |
| POST | `/api/games/{session_id}/next/` | `NextRoundView` | Avança a sessão para a próxima ronda. |
| GET | `/api/games/{session_id}/status/` | `GameStatusView` | Consulta o estado atual de uma sessão de jogo. |
| POST | `/api/games/{session_id}/complete/` | `CompleteGameView` | Finaliza uma sessão de jogo. |
| POST | `/api/games/{session_id}/abandon/` | `AbandonGameView` | Permite ao jogador abandonar uma sessão em andamento. |
| GET | `/api/games/stats/` | `PlayerStatsView` | Retorna as estatísticas individuais do jogador. |


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

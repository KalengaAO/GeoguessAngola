# GeoguessAngola
O nosso projeto consiste no desenvolvimento de uma plataforma interativa que combina exploração geográfica e conhecimento cultural, inspirada no conceito do GeoGuessr, mas com um foco especial em Angola.


## DATABASE
postgres=# CREATE USER geoangola WITH PASSWORD '7teclado@';
CREATE ROLE
postgres=# CREATE DATABASE geoguessangola OWNER geoangola;
CREATE DATABASE

## ROUTES

| Operação | Método | Endpoint |
|---|---|---|
| Iniciar partida | POST | `/api/games/start/` |
| Submeter resposta | POST | `/api/games/rounds/<round_id>/answer/` |
| Próxima ronda | POST | `/api/games/<session_id>/next/` |
| Consultar estado | GET | `/api/games/<session_id>/status/` |


### POST /api/games/<int:session_id>/next/

Cenário A — Existe uma próxima ronda

`Resposta:
{
    "session_id": 1,
    "session_status": "in_progress",
    "round": {
        "id": 2,
        "number": 2,
        "image_url": "http://localhost:8000/media/locations/exemplo2.jpg"
    }
}`

Cenário B — A partida terminou
{
    "session_id": 1,
    "session_status": "completed",
    "message": "Partida concluída!"
}

### GET /api/games/<int:session_id>/status/

Resposta:
`{
    "session_id": 1,
    "session_status": "in_progress",
    "progress": {
        "answered_rounds": 2,
        "total_rounds": 5
    },
    "total_score": 8750,
    "rounds": [
        {
            "id": 1,
            "number": 1,
            "image_url": "http://localhost:8000/media/location1.jpg",
            "is_answered": true,
            "score": 4500,
            "guessed_latitude": -8.8383,
            "guessed_longitude": 13.2344
        },
        {
            "id": 2,
            "number": 2,
            "image_url": "http://localhost:8000/media/location2.jpg",
            "is_answered": true,
            "score": 4250,
            "guessed_latitude": -12.5,
            "guessed_longitude": 15.2
        },
        {
            "id": 3,
            "number": 3,
            "image_url": "http://localhost:8000/media/location3.jpg",
            "is_answered": false,
            "score": null,
            "guessed_latitude": null,
            "guessed_longitude": null
        }
    ]
}`

## DEFAULT ENV

export DB_PASSWORD='A_TUA_PASSWORD'


## ROTAS DA API
POST : /api/games/rounds/<round_id>/answer/
POST : /api/games/start/

### Obter o token

POST /api/token/

Envia o nome de utilizador e a palavra-passe. Recebes um token de acesso e um token de atualização.


### Aceder à API

POST /api/games/start/

Envia o token de acesso no cabeçalho Authorization para que o Django identifique o utilizador.


### Renovar o token

POST /api/token/refresh/

Quando o token de acesso expirar, utiliza o token de atualização para obter outro.


# Testando a API
Sessão baseada em token
{
	"session_id": 2,
	"session_status": "in_progress",
	"round": {
		"id": 3,
		"number": 1,
		"image_url": "http://127.0.0.1:8000/media/locations/image-116-768x512.png"
	}
}
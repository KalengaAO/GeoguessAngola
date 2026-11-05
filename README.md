# GeoguessAngola
O nosso projeto consiste no desenvolvimento de uma plataforma interativa que combina exploração geográfica e conhecimento cultural, inspirada no conceito do GeoGuessr, mas com um foco especial em Angola.


## DATABASE
postgres=# CREATE USER geoangola WITH PASSWORD '7teclado@';
CREATE ROLE
postgres=# CREATE DATABASE geoguessangola OWNER geoangola;
CREATE DATABASE


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
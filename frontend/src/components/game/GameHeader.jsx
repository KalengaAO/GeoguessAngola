import { Link } from "react-router-dom";

/**
 * Cabeçalho do jogo. Todos os campos de info são opcionais,
 * por isso serve para single-player e multiplayer (usa `extra`
 * para jogadores, tempo, etc.).
 */
function GameHeader({
    sessionId,
    roundNumber,
    totalRounds,
    totalScore,
    homePath = "/profile",
    extra = null,
}) {
    return (
        <header className="game-page__header">
            <div className="game-page__brand">
                <Link to={homePath}>
                    <span>GEOGUESS</span> ANGOLA
                </Link>
            </div>

            <div className="game-page__round-info">
                {sessionId != null && <span>Partida #{sessionId}</span>}

                {roundNumber != null && (
                    <span>
                        Ronda {roundNumber}
                        {totalRounds ? ` / ${totalRounds}` : ""}
                    </span>
                )}

                {totalScore != null && <span>{totalScore} pontos</span>}

                {extra}
            </div>
        </header>
    );
}

export default GameHeader;

import { Link } from "react-router-dom";

/** Resumo final da partida. No multiplayer, passa `children` com o ranking. */
function FinalSummary({
    totalScore,
    rounds,
    onPlayAgain,
    homePath = "/profile",
    children,
}) {
    return (
        <section className="game-page__summary">
            <h1>Partida concluída!</h1>

            <p className="game-page__summary-total">
                <strong>{totalScore}</strong> pontos
            </p>

            <ul className="game-page__summary-list">
                {rounds.map((r) => (
                    <li key={r.id}>
                        <span>Ronda {r.number}</span>
                        <span>
                            {r.distance_km != null
                                ? `${r.distance_km} km`
                                : "—"}
                        </span>
                        <strong>{r.score ?? 0} pts</strong>
                    </li>
                ))}
            </ul>

            {children}

            {onPlayAgain && (
                <button
                    type="button"
                    className="game-page__submit-button"
                    onClick={onPlayAgain}
                >
                    Jogar novamente
                </button>
            )}

            <Link to={homePath} className="game-page__link-button">
                Voltar ao perfil
            </Link>
        </section>
    );
}

export default FinalSummary;

/**
 * Resultado de uma ronda.
 *
 * - countdownLabel: texto tipo "Próxima ronda em 5s" (avanço automático)
 * - onAction/actionLabel: botão opcional (ex.: "Tentar novamente" se falhar)
 * - children: espaço para o ranking da ronda no multiplayer
 */
function RoundResult({
    result,
    countdownLabel,
    onAction,
    actionLabel,
    actionDisabled = false,
    children,
}) {
    if (!result) return null;

    const hasGuess = !result.timed_out;

    return (
        <div className="game-page__result">
            <h2>Resultado da ronda</h2>

            {result.timed_out && (
                <p className="game-page__result-note">
                    Tempo esgotado — sem palpite nesta ronda.
                </p>
            )}

            <div className="game-page__result-stats">
                <div>
                    <span>Distância</span>
                    <strong>
                        {result.distance_km != null
                            ? `${result.distance_km} km`
                            : "—"}
                    </strong>
                </div>

                <div>
                    <span>Pontuação</span>
                    <strong>{result.score} pontos</strong>
                </div>
            </div>

            {result.correct_location && (
                <div className="game-page__map-legend">
                    {hasGuess && (
                        <span>
                            <i className="guess-marker" />
                            O teu palpite
                        </span>
                    )}

                    <span>
                        <i className="correct-marker" />
                        Localização verdadeira
                    </span>
                </div>
            )}

            {children}

            {countdownLabel && (
                <p className="game-page__countdown">{countdownLabel}</p>
            )}

            {onAction && (
                <button
                    type="button"
                    className="game-page__submit-button"
                    onClick={onAction}
                    disabled={actionDisabled}
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
}

export default RoundResult;
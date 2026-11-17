/** Barra de tempo da ronda. */
function RoundTimer({ secondsLeft, totalSeconds, label = "Tempo restante" }) {
    const percent = totalSeconds
        ? Math.max(0, Math.min(100, (secondsLeft / totalSeconds) * 100))
        : 0;

    const urgent = secondsLeft <= 10;

    return (
        <div
            className={`game-page__timer${
                urgent ? " game-page__timer--urgent" : ""
            }`}
        >
            <div className="game-page__timer-top">
                <span>{label}</span>
                <strong>{secondsLeft}s</strong>
            </div>

            <div className="game-page__timer-bar">
                <div
                    className="game-page__timer-fill"
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
}

export default RoundTimer;
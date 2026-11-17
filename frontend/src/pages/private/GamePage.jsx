import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import useGameSession from "../../hooks/useGameSession";
import { startGame } from "../../services/gameService";

import {
    GameHeader,
    GameMessage,
    LandscapeImage,
    GuessMap,
    SelectionInfo,
    RoundTimer,
    RoundResult,
    FinalSummary,
} from "../../components/game";

import "../../components/game/game.css";

function GamePage() {
    const { sessionId } = useParams();
    const navigate = useNavigate();

    const game = useGameSession(sessionId);

    async function handlePlayAgain() {
        try {
            const data = await startGame();
            navigate(`/game/${data.session_id}`);
        } catch (error) {
            toast.error(
                error.response?.data?.detail ||
                    "Não foi possível iniciar uma nova partida."
            );
        }
    }

    // ---------- Carregamento / erro ----------
    if (game.isLoading) {
        return (
            <main className="game-page">
                <GameMessage title="A carregar partida..." />
            </main>
        );
    }

    if (game.loadError || !game.round) {
        return (
            <main className="game-page">
                <GameMessage
                    title="Ronda indisponível"
                    text="Não foi possível recuperar os dados desta partida. Inicia uma nova partida a partir do teu perfil."
                >
                    <Link to="/profile" className="game-page__link-button">
                        Voltar ao perfil
                    </Link>
                </GameMessage>
            </main>
        );
    }

    // ---------- Partida concluída ----------
    if (game.isFinished) {
        return (
            <main className="game-page">
                <GameHeader sessionId={sessionId} />

                <FinalSummary
                    totalScore={game.totalScore}
                    rounds={game.rounds}
                    onPlayAgain={handlePlayAgain}
                />
            </main>
        );
    }

    // ---------- Ronda em curso ----------
    const { round, roundResult, selectedLocation } = game;
    const hasResult = Boolean(roundResult);

    let countdownLabel = null;

    if (hasResult) {
        if (game.isAdvancing) {
            countdownLabel = "A carregar...";
        } else if (!game.advanceFailed) {
            countdownLabel = game.isLastRound
                ? `Resultado final em ${game.resultCountdown}s`
                : `Próxima ronda em ${game.resultCountdown}s`;
        }
    }

    return (
        <main className="game-page">
            <GameHeader
                sessionId={sessionId}
                roundNumber={round.number}
                totalRounds={game.totalRounds}
                totalScore={game.totalScore}
            />

            <section className="game-page__content">
                <LandscapeImage imageUrl={round.image_url} />

                <div className="game-page__map-section">
                    <div className="game-page__map-heading">
                        <h2>
                            {hasResult
                                ? "Comparação das localizações"
                                : "Selecciona a localização"}
                        </h2>

                        <p>
                            {hasResult
                                ? "Compara o teu palpite com a localização verdadeira."
                                : "Clica no mapa para colocar o teu marcador."}
                        </p>
                    </div>

                    {!hasResult && (
                        <RoundTimer
                            secondsLeft={game.secondsLeft}
                            totalSeconds={game.timeLimit}
                        />
                    )}

                    <GuessMap
                        mapKey={round.id}
                        selectedLocation={selectedLocation}
                        correctLocation={roundResult?.correct_location}
                        onSelect={game.setSelectedLocation}
                        disabled={hasResult || game.isSubmitting}
                    />

                    {!hasResult && (
                        <>
                            <SelectionInfo location={selectedLocation} />

                            <button
                                type="button"
                                className="game-page__submit-button"
                                onClick={game.submitGuess}
                                disabled={
                                    !selectedLocation || game.isSubmitting
                                }
                            >
                                {game.isSubmitting
                                    ? "A submeter..."
                                    : "Confirmar localização"}
                            </button>
                        </>
                    )}

                    <RoundResult
                        result={roundResult}
                        countdownLabel={countdownLabel}
                        onAction={
                            game.advanceFailed ? game.goToNextRound : undefined
                        }
                        actionLabel="Tentar novamente"
                        actionDisabled={game.isAdvancing}
                    />
                </div>
            </section>
        </main>
    );
}

export default GamePage;
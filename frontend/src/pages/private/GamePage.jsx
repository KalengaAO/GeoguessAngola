import { useEffect, useState } from "react";
import {
    CircleMarker,
    MapContainer,
    Polyline,
    Popup,
    TileLayer,
    useMap,
    useMapEvents,
} from "react-leaflet";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate, useParams } from "react-router-dom";
import BrandLogo from "../../components/BrandLogo/BrandLogo";
import useGameSession from "../../hooks/useGameSession";
import { abandonGame } from "../../services/gameService";
import { getApiErrorMessage } from "../../utils/apiErrors";
import "leaflet/dist/leaflet.css";
import "./GamePage.css";

function MapClickHandler({ onLocationSelect, disabled }) {
    useMapEvents({
        click(event) {
            if (disabled) return;
            onLocationSelect({
                latitude: event.latlng.lat,
                longitude: event.latlng.lng,
            });
        },
    });

    return null;
}

function ResultMapBounds({ selectedLocation, correctLocation }) {
    const map = useMap();

    useEffect(() => {
        if (!selectedLocation || !correctLocation) return;

        map.fitBounds(
            [
                [selectedLocation.latitude, selectedLocation.longitude],
                [correctLocation.latitude, correctLocation.longitude],
            ],
            { padding: [40, 40], maxZoom: 8 }
        );
    }, [map, selectedLocation, correctLocation]);

    return null;
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function GamePage() {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const [isAbandoning, setIsAbandoning] = useState(false);
    const {
        round,
        rounds,
        totalRounds,
        totalScore,
        selectedLocation,
        roundResult,
        secondsLeft,
        resultCountdown,
        isLoading,
        loadError,
        isSubmitting,
        isAdvancing,
        advanceFailed,
        isFinished,
        isLastRound,
        setSelectedLocation,
        submitGuess,
        goToNextRound,
    } = useGameSession(sessionId);

    async function handleAbandon() {
        if (
            isAbandoning ||
            !window.confirm("Queres mesmo abandonar esta partida?")
        ) {
            return;
        }

        setIsAbandoning(true);
        try {
            await abandonGame(sessionId);
            toast.success("Partida abandonada.");
            navigate("/games", { replace: true });
        } catch (error) {
            toast.error(
                getApiErrorMessage(
                    error,
                    "Não foi possível abandonar a partida."
                )
            );
        } finally {
            setIsAbandoning(false);
        }
    }
 
    if (isLoading) {
        return (
            <main className="game-page">
                <p className="game-page__message" role="status">
                    A carregar a partida...
                </p>
            </main>
        );
    }

    if (loadError || (!round && !isFinished)) {
        return (
            <main className="game-page">
                <div className="game-page__message">
                    <h1>Partida indisponível</h1>
                    <p>
                        Não foi possível recuperar esta partida. Inicia um novo
                        jogo a partir da área de jogos.
                    </p>
                    <Link to="/games" className="game-page__submit-button">
                        Voltar aos jogos
                    </Link>
                </div>
            </main>
        );
    }

    if (isFinished) {
        return (
            <main className="game-page">
                <header className="game-page__header">
                    <BrandLogo to="/games" className="game-page__brand" compact />
                </header>

                <section className="game-page__summary">
                    <p className="game-page__eyebrow">JORNADA CONCLUÍDA</p>
                    <h1>Partida concluída!</h1>
                    <p className="game-page__summary-total">
                        Pontuação final
                        <strong>{totalScore.toLocaleString("pt-PT")}</strong>
                    </p>
                    <ul className="game-page__summary-list">
                        {rounds.map((completedRound) => (
                            <li key={completedRound.id}>
                                <span>Ronda {completedRound.number}</span>
                                <span>
                                    {completedRound.timed_out
                                        ? "Tempo esgotado"
                                        : completedRound.distance_km != null
                                            ? `${completedRound.distance_km} km`
                                            : "Concluída"}
                                </span>
                                <strong>{completedRound.score ?? 0} pts</strong>
                            </li>
                        ))}
                    </ul>
                    <Link
                        to="/games"
                        className="game-page__submit-button"
                    >
                        Jogar outra partida
                    </Link>
                </section>
            </main>
        );
    }

    const correctLocation = roundResult?.correct_location;
    const isTimerUrgent = secondsLeft <= 10 && !roundResult;
    const isTimerExpired = secondsLeft <= 0 && !roundResult;

    return (
        <main className="game-page">
            <header className="game-page__header">
                <BrandLogo to="/games" className="game-page__brand" compact />
                <div className="game-page__header-actions">
                    <button
                        type="button"
                        className="game-page__abandon-button"
                        onClick={handleAbandon}
                        disabled={isAbandoning || isSubmitting || isAdvancing}
                    >
                        <LogOut size={16} aria-hidden="true" />
                        {isAbandoning ? "A abandonar..." : "Abandonar partida"}
                    </button>
                    <div className="game-page__round-info">
                        <span>Ronda {round.number} de {totalRounds}</span>
                        <span className="game-page__score">
                            {totalScore.toLocaleString("pt-PT")} pts
                        </span>
                        <span
                            className={`game-page__timer-display${isTimerUrgent ? " is-urgent" : ""}${isTimerExpired ? " is-expired" : ""}`}
                            role="timer"
                            aria-label={`Tempo restante: ${secondsLeft} segundos`}
                        >
                            {formatTime(secondsLeft)}
                        </span>
                    </div>
                </div>
            </header>

            <section className="game-page__content">
                <div className="game-page__landscape">
                    <div className="game-page__section-heading">
                        <h1>Onde fica este lugar?</h1>
                        <p>
                            Observa a paisagem e identifica a sua localização
                            no mapa de Angola.
                        </p>
                    </div>
                    <div className="game-page__image-container">
                        <img
                            src={round.image_url}
                            alt="Paisagem angolana para identificação geográfica"
                            className="game-page__image"
                        />
                    </div>
                </div>

                <div className="game-page__map-section">
                    <div className="game-page__map-heading">
                        <h2>
                            {roundResult
                                ? "Comparação das localizações"
                                : "Selecciona a localização"}
                        </h2>
                        <p>
                            {roundResult
                                ? "Compara o teu palpite com a localização verdadeira."
                                : "Clica no mapa para colocar o teu marcador."}
                        </p>
                    </div>

                    <div className="game-page__map">
                        <MapContainer
                            center={[-12.5, 18.5]}
                            zoom={5}
                            scrollWheelZoom
                            className="game-page__leaflet"
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <MapClickHandler
                                onLocationSelect={setSelectedLocation}
                                disabled={
                                    Boolean(roundResult) ||
                                    isSubmitting ||
                                    secondsLeft <= 0
                                }
                            />
                            {selectedLocation && (
                                <CircleMarker
                                    center={[
                                        selectedLocation.latitude,
                                        selectedLocation.longitude,
                                    ]}
                                    radius={9}
                                    pathOptions={{
                                        color: "#FFFFFF",
                                        fillColor: "#FFC629",
                                        fillOpacity: 1,
                                    }}
                                >
                                    <Popup>Localização escolhida</Popup>
                                </CircleMarker>
                            )}
                            {correctLocation && (
                                <CircleMarker
                                    center={[
                                        correctLocation.latitude,
                                        correctLocation.longitude,
                                    ]}
                                    radius={9}
                                    pathOptions={{
                                        color: "#FFFFFF",
                                        fillColor: "#16A34A",
                                        fillOpacity: 1,
                                    }}
                                >
                                    <Popup>Localização verdadeira</Popup>
                                </CircleMarker>
                            )}
                            {selectedLocation && correctLocation && (
                                <>
                                    <Polyline
                                        positions={[
                                            [
                                                selectedLocation.latitude,
                                                selectedLocation.longitude,
                                            ],
                                            [
                                                correctLocation.latitude,
                                                correctLocation.longitude,
                                            ],
                                        ]}
                                        pathOptions={{
                                            color: "#FFC629",
                                            weight: 3,
                                            dashArray: "8 8",
                                        }}
                                    />
                                    <ResultMapBounds
                                        selectedLocation={selectedLocation}
                                        correctLocation={correctLocation}
                                    />
                                </>
                            )}
                        </MapContainer>
                    </div>

                    {selectedLocation && (
                        <div className="game-page__selection">
                            <span>Localização seleccionada</span>
                            <p>Latitude: {selectedLocation.latitude.toFixed(6)}</p>
                            <p>Longitude: {selectedLocation.longitude.toFixed(6)}</p>
                        </div>
                    )}

                    {roundResult && (
                        <div className="game-page__result">
                            <h2>Resultado da ronda</h2>
                            {roundResult.timed_out && (
                                <p className="game-page__result-note">
                                    O tempo terminou. Esta ronda não recebeu pontos.
                                </p>
                            )}
                            <div className="game-page__result-stats">
                                <div>
                                    <span>Distância</span>
                                    <strong>
                                        {roundResult.distance_km == null
                                            ? "—"
                                            : `${roundResult.distance_km} km`}
                                    </strong>
                                </div>
                                <div>
                                    <span>Pontuação</span>
                                    <strong>{roundResult.score} pontos</strong>
                                </div>
                            </div>
                            {correctLocation && (
                                <div className="game-page__map-legend">
                                    <span><i className="guess-marker" /> O teu palpite</span>
                                    <span><i className="correct-marker" /> Localização verdadeira</span>
                                </div>
                            )}
                            <p className="game-page__countdown">
                                {isAdvancing
                                    ? "A carregar a próxima ronda..."
                                    : `Avanço automático em ${resultCountdown}s`}
                            </p>
                            <button
                                type="button"
                                className="game-page__submit-button"
                                onClick={goToNextRound}
                                disabled={isAdvancing}
                            >
                                {isLastRound ? "Concluir partida" : "Próxima ronda"}
                            </button>
                        </div>
                    )}

                    {!roundResult && (
                        <button
                            type="button"
                            className="game-page__submit-button"
                            onClick={submitGuess}
                            disabled={
                                !selectedLocation ||
                                isSubmitting ||
                                secondsLeft <= 0
                            }
                        >
                            {isSubmitting
                                ? "A submeter..."
                                : secondsLeft <= 0
                                    ? "A registar fim do tempo..."
                                    : "Confirmar localização"}
                        </button>
                    )}
                    {advanceFailed && (
                        <p className="game-page__timeout-error" role="alert">
                            Não foi possível avançar. Tenta novamente.
                        </p>
                    )}
                </div>
            </section>
        </main>
    );
}

export default GamePage;

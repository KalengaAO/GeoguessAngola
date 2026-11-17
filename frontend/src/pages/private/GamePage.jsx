
import { useState, useEffect } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import { toast } from "sonner";

import {
    MapContainer,
    TileLayer,
    CircleMarker,
    Popup,
    Polyline,
    useMapEvents,
    useMap,
} from "react-leaflet";

import {
    submitGameAnswer,
    startNextRound,
} from "../../services/gameService";

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


// Ajusta o mapa para mostrar os dois pontos.
function ResultMapBounds({ selectedLocation, correctLocation }) {
    const map = useMap();

    useEffect(() => {
        if (!selectedLocation || !correctLocation) return;

        const bounds = [
            [
                selectedLocation.latitude,
                selectedLocation.longitude,
            ],
            [
                correctLocation.latitude,
                correctLocation.longitude,
            ],
        ];

        map.fitBounds(bounds, {
            padding: [40, 40],
            maxZoom: 8,
        });
    }, [map, selectedLocation, correctLocation]);

    return null;
}


function GamePage() {
    const { sessionId } = useParams();
    const location = useLocation();

    const game = location.state?.game;

    const [round, setRound] = useState(game?.round ?? null);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [roundResult, setRoundResult] = useState(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAdvancing, setIsAdvancing] = useState(false);
    const [isFinished, setIsFinished] = useState(false);

    if (!round && !isFinished) {
        return (
            <main className="game-page">
                <div className="game-page__message">
                    <h1>Ronda indisponível</h1>
                    <p>
                        Não foi possível recuperar os dados desta ronda.
                        Inicia uma nova partida a partir do teu perfil.
                    </p>
                </div>
            </main>
        );
    }

    const correctLocation = roundResult?.correct_location;

    async function handleSubmitAnswer() {
        if (!selectedLocation) {
            toast.error("Selecciona primeiro uma localização no mapa.");
            return;
        }

        if (roundResult || isSubmitting) return;

        try {
            setIsSubmitting(true);

            const result = await submitGameAnswer(
                round.id,
                selectedLocation
            );

            setRoundResult(result);

        } catch (error) {
            console.error("Erro ao submeter resposta:", error);

            toast.error(
                error.response?.data?.detail ||
                "Não foi possível submeter a tua resposta."
            );
        } finally {
            setIsSubmitting(false);
        }
    }


    async function handleNextRound() {
        if (isAdvancing || !roundResult) return;

        try {
            setIsAdvancing(true);

            const data = await startNextRound(sessionId);

            // A partida terminou.
            if (
                data.session_status === "completed" ||
                !data.round
            ) {
                setIsFinished(true);
                setRoundResult(null);
                setSelectedLocation(null);
                return;
            }

            // Preparar a próxima ronda.
            setRound(data.round);
            setSelectedLocation(null);
            setRoundResult(null);

        } catch (error) {
            console.error("Erro ao avançar de ronda:", error);

            toast.error(
                error.response?.data?.detail ||
                "Não foi possível avançar para a próxima ronda."
            );
        } finally {
            setIsAdvancing(false);
        }
    }


    if (isFinished) {
        return (
            <main className="game-page">
                <header className="game-page__header">
                    <div className="game-page__brand">
                        <Link to="/profile">
                            <span>GEOGUESS</span> ANGOLA
                        </Link>
                    </div>
                </header>

                <section className="game-page__content">
                    <div className="game-page__result">
                        <h1>Partida concluída!</h1>

                        <p>
                            Terminaste todas as rondas.
                        </p>

                        <Link
                            to="/profile"
                            className="game-page__submit-button"
                        >
                            Voltar ao perfil
                        </Link>
                    </div>
                </section>
            </main>
        );
    }


    return (
        <main className="game-page">
            <header className="game-page__header">
                <div className="game-page__brand">
                    <Link to="/profile">
                        <span>GEOGUESS</span> ANGOLA
                    </Link>
                </div>

                <div className="game-page__round-info">
                    <span>Partida {sessionId}</span>
                    <span>Ronda {round.number}</span>
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
                                    Boolean(roundResult) || isSubmitting
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
                                    <Popup>
                                        Localização escolhida
                                    </Popup>
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
                                    <Popup>
                                        Localização verdadeira
                                    </Popup>
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

                            <p>
                                Latitude: {selectedLocation.latitude.toFixed(6)}
                            </p>

                            <p>
                                Longitude: {selectedLocation.longitude.toFixed(6)}
                            </p>
                        </div>
                    )}


                    {!roundResult && (
                        <button
                            type="button"
                            className="game-page__submit-button"
                            onClick={handleSubmitAnswer}
                            disabled={!selectedLocation || isSubmitting}
                        >
                            {isSubmitting
                                ? "A submeter..."
                                : "Confirmar localização"}
                        </button>
                    )}


                    {roundResult && (
                        <div className="game-page__result">
                            <h2>Resultado da ronda</h2>

                            <div className="game-page__result-stats">
                                <div>
                                    <span>Distância</span>
                                    <strong>
                                        {roundResult.distance_km} km
                                    </strong>
                                </div>

                                <div>
                                    <span>Pontuação</span>
                                    <strong>
                                        {roundResult.score} pontos
                                    </strong>
                                </div>
                            </div>


                            {correctLocation && (
                                <div className="game-page__map-legend">
                                    <span>
                                        <i className="guess-marker" />
                                        O teu palpite
                                    </span>

                                    <span>
                                        <i className="correct-marker" />
                                        Localização verdadeira
                                    </span>
                                </div>
                            )}


                            <button
                                type="button"
                                className="game-page__submit-button game-page__next-button"
                                onClick={handleNextRound}
                                disabled={isAdvancing}
                            >
                                {isAdvancing
                                    ? "A carregar..."
                                    : "Próxima ronda"}
                            </button>
                        </div>
                    )}

                </div>
            </section>
        </main>
    );
}

export default GamePage;

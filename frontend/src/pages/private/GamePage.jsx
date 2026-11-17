
import { useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { toast } from "sonner";

import {
    MapContainer,
    TileLayer,
    CircleMarker,
    Popup,
    useMapEvents,
} from "react-leaflet";

import { submitGameAnswer } from "../../services/gameService";

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

function GamePage() {
    const { sessionId } = useParams();
    const location = useLocation();

    const game = location.state?.game;
    const round = game?.round;

    const [selectedLocation, setSelectedLocation] = useState(null);
    const [roundResult, setRoundResult] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!game || !round) {
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

    return (
        <main className="game-page">
            <header className="game-page__header">
                <div className="game-page__brand">
                    <span>GEO</span>GUESS ANGOLA
                </div>

                <div className="game-page__round-info">
                    <span>Partida #{sessionId}</span>
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
                        <h2>Selecciona a localização</h2>
                        <p>
                            Clica no mapa para colocar o teu marcador.
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
                                disabled={Boolean(roundResult) || isSubmitting}
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
                                        A tua localização escolhida
                                    </Popup>
                                </CircleMarker>
                            )}
                        </MapContainer>
                    </div>

                    {selectedLocation && (
                        <div className="game-page__selection">
                            <span>Localização seleccionada</span>

                            <p>
                                Latitude:{" "}
                                {selectedLocation.latitude.toFixed(6)}
                            </p>

                            <p>
                                Longitude:{" "}
                                {selectedLocation.longitude.toFixed(6)}
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

                            <button
                                type="button"
                                className="game-page__submit-button"
                                disabled
                                title="O endpoint da próxima ronda ainda será ligado."
                            >
                                Ronda concluída
                            </button>
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}

export default GamePage;

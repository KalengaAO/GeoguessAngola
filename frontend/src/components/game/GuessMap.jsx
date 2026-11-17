import { useEffect } from "react";
import {
    MapContainer,
    TileLayer,
    CircleMarker,
    Popup,
    Polyline,
    useMapEvents,
    useMap,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

const ANGOLA_CENTER = [-12.5, 18.5];
const ANGOLA_ZOOM = 5;

const COLORS = {
    guess: "#FFC629",
    correct: "#16A34A",
};

function MapClickHandler({ onSelect, disabled }) {
    useMapEvents({
        click(event) {
            if (disabled || !onSelect) return;

            onSelect({
                latitude: event.latlng.lat,
                longitude: event.latlng.lng,
            });
        },
    });

    return null;
}

// Ajusta o mapa para mostrar todos os pontos do resultado.
function FitBounds({ points }) {
    const map = useMap();

    useEffect(() => {
        if (points.length === 0) return;

        // Só a localização verdadeira (ex.: tempo esgotado sem palpite).
        if (points.length === 1) {
            map.setView([points[0].latitude, points[0].longitude], 7);
            return;
        }

        map.fitBounds(
            points.map((p) => [p.latitude, p.longitude]),
            { padding: [40, 40], maxZoom: 8 }
        );
    }, [map, points]);

    return null;
}

function Marker({ location, color, label }) {
    return (
        <CircleMarker
            center={[location.latitude, location.longitude]}
            radius={9}
            pathOptions={{
                color: "#FFFFFF",
                fillColor: color,
                fillOpacity: 1,
            }}
        >
            <Popup>{label}</Popup>
        </CircleMarker>
    );
}

/**
 * Mapa reutilizável.
 *
 * - selectedLocation: palpite do jogador actual
 * - correctLocation:  localização verdadeira (só depois de responder)
 * - otherGuesses:     palpites de outros jogadores (multiplayer)
 *                     [{ id, latitude, longitude, label, color }]
 * - mapKey:           muda a cada ronda para reiniciar a vista do mapa
 */
function GuessMap({
    selectedLocation,
    correctLocation = null,
    otherGuesses = [],
    onSelect,
    disabled = false,
    mapKey,
}) {
    const hasBothPoints = Boolean(selectedLocation && correctLocation);

    const boundsPoints = correctLocation
        ? [selectedLocation, correctLocation, ...otherGuesses].filter(Boolean)
        : [];

    return (
        <div className="game-page__map">
            <MapContainer
                key={mapKey}
                center={ANGOLA_CENTER}
                zoom={ANGOLA_ZOOM}
                scrollWheelZoom
                className="game-page__leaflet"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapClickHandler onSelect={onSelect} disabled={disabled} />

                {selectedLocation && (
                    <Marker
                        location={selectedLocation}
                        color={COLORS.guess}
                        label="Localização escolhida"
                    />
                )}

                {correctLocation && (
                    <Marker
                        location={correctLocation}
                        color={COLORS.correct}
                        label="Localização verdadeira"
                    />
                )}

                {otherGuesses.map((guess) => (
                    <Marker
                        key={guess.id}
                        location={guess}
                        color={guess.color || "#60A5FA"}
                        label={guess.label || "Outro jogador"}
                    />
                ))}

                {hasBothPoints && (
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
                            color: COLORS.guess,
                            weight: 3,
                            dashArray: "8 8",
                        }}
                    />
                )}

                {correctLocation && <FitBounds points={boundsPoints} />}
            </MapContainer>
        </div>
    );
}

export default GuessMap;
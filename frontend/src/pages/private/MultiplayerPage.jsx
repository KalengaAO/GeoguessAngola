import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Check,
    Clock3,
    Flag,
    LoaderCircle,
    LogOut,
    MapPin,
    Trophy,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
    CircleMarker,
    MapContainer,
    Popup,
    TileLayer,
    useMapEvents,
} from "react-leaflet";
import { useAuth } from "../../hooks/useAuth";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import BrandLogo from "../../components/BrandLogo/BrandLogo";
import {
    advanceMultiplayerRound,
    getMultiplayerMatch,
    getMultiplayerResults,
    leaveMultiplayerRoom,
    submitMultiplayerGuess,
} from "../../services/multiplayerService";
import { getApiErrorMessage } from "../../utils/apiErrors";
import "leaflet/dist/leaflet.css";
import "./MultiplayerPage.css";

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function GuessMapClick({ onSelect, disabled }) {
    useMapEvents({
        click(event) {
            if (disabled) return;
            onSelect({
                latitude: event.latlng.lat,
                longitude: event.latlng.lng,
            });
        },
    });
    return null;
}

function ActiveRound({ roomCode, match, round, isHost, onRefresh }) {
    const navigate = useNavigate();
    const matchExpired = match.seconds_remaining <= 0;
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [guessResult, setGuessResult] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAdvancing, setIsAdvancing] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    async function handleSubmitGuess() {
        if (!round || !selectedLocation || isSubmitting) return;
        setIsSubmitting(true);
        try {
            const result = await submitMultiplayerGuess(round.id, selectedLocation);
            setGuessResult(result);
            await onRefresh();
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Não foi possível submeter o palpite."));
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleAdvance() {
        if (!match?.id || isAdvancing) return;
        setIsAdvancing(true);
        try {
            await advanceMultiplayerRound(match.id);
            setGuessResult(null);
            setSelectedLocation(null);
            await onRefresh();
        } catch (error) {
            toast.error(getApiErrorMessage(error, "A ronda ainda não pode avançar."));
        } finally {
            setIsAdvancing(false);
        }
    }

    async function handleLeave() {
        if (isLeaving || isSubmitting || isAdvancing) return;
        setIsLeaving(true);
        try {
            await leaveMultiplayerRoom(roomCode);
            toast.success("Saíste da partida.");
            navigate("/games", { replace: true });
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Não foi possível sair da partida."));
        } finally {
            setIsLeaving(false);
        }
    }

    return (
        <main className="multiplayer-page">
            <header className="multiplayer-page__topbar">
                <BrandLogo to="/games" className="multiplayer-page__brand" compact />
                <div className="multiplayer-page__round-meta">
                    <Badge variant="outline">Sala {roomCode}</Badge>
                    <Badge variant="gold">Ronda {round.round_number}</Badge>
                    <span
                        className={`multiplayer-page__timer${round.status === "active" && match.seconds_remaining <= 10 ? " is-urgent" : ""}`}
                        role="timer"
                            aria-label={`Tempo restante da ronda: ${formatTime(match.seconds_remaining)}`}
                    >
                        <Clock3 size={15} aria-hidden="true" />
                        {formatTime(match.seconds_remaining)}
                    </span>
                    <Button
                        variant="outline"
                        onClick={handleLeave}
                        disabled={isLeaving || isSubmitting || isAdvancing}
                    >
                        {isLeaving ? (
                            <LoaderCircle className="animate-spin" size={16} />
                        ) : (
                            <LogOut size={16} />
                        )}
                        {isLeaving ? "A sair..." : "Sair da partida"}
                    </Button>
                </div>
            </header>

            <div className="multiplayer-page__layout">
                <section className="multiplayer-page__landscape">
                    <div className="multiplayer-page__intro">
                        <span className="app-page__eyebrow"><MapPin size={14} /> DESAFIO MULTIPLAYER</span>
                        <h1>Onde fica este lugar?</h1>
                        <p>Marca no mapa a localização desta paisagem. Vence quem acumular mais pontos.</p>
                    </div>
                    <img src={round.image_url} alt="Paisagem angolana da ronda" />
                    {guessResult && (
                        <div className="multiplayer-page__feedback" role="status">
                            <Check size={17} /> Palpite registado: {guessResult.score} pontos
                        </div>
                    )}
                </section>

                <section className="multiplayer-page__map-section">
                    <div className="multiplayer-page__map-heading">
                        <h2>{round.status === "completed" ? "Ronda concluída" : "Escolhe a localização"}</h2>
                        <span>{match.participants.length} jogadores na sala</span>
                    </div>
                    <div className="multiplayer-page__map">
                        <MapContainer center={[-12.5, 18.5]} zoom={5} scrollWheelZoom className="multiplayer-page__leaflet">
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <GuessMapClick
                                onSelect={setSelectedLocation}
                                disabled={
                                    Boolean(guessResult) ||
                                    isSubmitting ||
                                    matchExpired ||
                                    round.status !== "active"
                                }
                            />
                            {selectedLocation && (
                                <CircleMarker
                                    center={[selectedLocation.latitude, selectedLocation.longitude]}
                                    radius={9}
                                    pathOptions={{ color: "#FFFFFF", fillColor: "#FFC629", fillOpacity: 1 }}
                                >
                                    <Popup>O teu palpite</Popup>
                                </CircleMarker>
                            )}
                        </MapContainer>
                    </div>
                    {selectedLocation && !guessResult && (
                        <Button
                            onClick={handleSubmitGuess}
                            disabled={
                                isSubmitting ||
                                matchExpired ||
                                round.status !== "active"
                            }
                        >
                            {isSubmitting ? <LoaderCircle className="animate-spin" /> : <MapPin />}
                            {matchExpired ? "A terminar partida..." : "Confirmar palpite"}
                        </Button>
                    )}
                    {round.status === "completed" && isHost && (
                        <Button onClick={handleAdvance} disabled={isAdvancing}>
                            {isAdvancing ? <LoaderCircle className="animate-spin" /> : <Flag />}
                            {round.round_number >= match.total_rounds
                                ? "Ver resultados"
                                : "Próxima ronda"}
                        </Button>
                    )}
                    {round.status === "active" && !guessResult && (
                        <p className="multiplayer-page__waiting">
                            {matchExpired
                                ? "Tempo esgotado. A calcular resultados..."
                                : "A partida avança quando todos os jogadores submeterem."}
                            {isSubmitting ? <LoaderCircle className="animate-spin" size={15} /> : null}
                        </p>
                    )}
                    {round.status === "completed" && !isHost && (
                        <p className="multiplayer-page__waiting">À espera do anfitrião para avançar.</p>
                    )}
                </section>
            </div>
        </main>
    );
}

function MultiplayerPage() {
    const { roomCode } = useParams();
    const { user } = useAuth();
    const [clockNow, setClockNow] = useState(() => Date.now());
    const expiryRefreshRef = useRef(null);
    const matchQuery = useQuery({
        queryKey: ["multiplayer", "match", roomCode],
        queryFn: ({ signal }) => getMultiplayerMatch(roomCode, { signal }),
        refetchInterval: (query) =>
            query.state.data?.status === "in_progress" ? 3000 : false,
        retry: false,
    });
    const { refetch: refetchMatch } = matchQuery;
    const match = matchQuery.data;
    const rounds = match?.rounds ?? [];
    const round = rounds[rounds.length - 1];
    const isHost = match?.host_username === user?.username;
    const isCompleted = match?.status === "completed";
    const elapsedSinceMatchRefresh = Math.max(
        0,
        Math.floor((clockNow - matchQuery.dataUpdatedAt) / 1000)
    );
    const roundSecondsLeft =
        match?.status === "in_progress" &&
        Number.isFinite(match.seconds_remaining)
            ? Math.max(
                  0,
                  match.seconds_remaining - elapsedSinceMatchRefresh
              )
            : null;

    useEffect(() => {
        if (match?.status !== "in_progress") return undefined;

        const intervalId = window.setInterval(
            () => setClockNow(Date.now()),
            1000
        );
        return () => window.clearInterval(intervalId);
    }, [match?.id, match?.status]);

    useEffect(() => {
        if (
            match?.status !== "in_progress" ||
            round?.status !== "active" ||
            roundSecondsLeft !== 0 ||
            expiryRefreshRef.current === `${match.id}:${round.id}`
        ) {
            return;
        }

        expiryRefreshRef.current = `${match.id}:${round.id}`;
        refetchMatch();
    }, [
        match?.id,
        match?.status,
        round?.id,
        round?.status,
        roundSecondsLeft,
        refetchMatch,
    ]);

    const resultsQuery = useQuery({
        queryKey: ["multiplayer", "results", match?.id],
        queryFn: ({ signal }) => getMultiplayerResults(match.id, { signal }),
        enabled: Boolean(match?.id && isCompleted),
        retry: false,
    });

    if (matchQuery.isLoading) {
        return <main className="multiplayer-page"><p role="status">A ligar à partida...</p></main>;
    }

    if (matchQuery.isError || !match) {
        return (
            <main className="multiplayer-page">
                <Card className="multiplayer-page__message">
                    <h1>Partida indisponível</h1>
                    <p>Não foi possível carregar a sala {roomCode}.</p>
                    <Button asChild variant="outline"><Link to="/games">Voltar aos jogos</Link></Button>
                </Card>
            </main>
        );
    }

    if (isCompleted) {
        const results = resultsQuery.data?.results ?? [];
        return (
            <main className="multiplayer-page">
                <header className="multiplayer-page__topbar">
                    <BrandLogo to="/games" className="multiplayer-page__brand" compact />
                    <Badge variant="gold"><Trophy size={13} /> RESULTADOS</Badge>
                </header>
                <Card className="multiplayer-page__results">
                    <h1>Partida concluída</h1>
                    <p>Sala {roomCode} · classificação final</p>
                    {resultsQuery.isLoading ? (
                        <p role="status">A calcular resultados...</p>
                    ) : resultsQuery.isError ? (
                        <p role="alert">Não foi possível carregar os resultados.</p>
                    ) : (
                        <ol>
                            {results.map((entry) => (
                                <li key={entry.username}>
                                    <strong>{entry.rank}</strong>
                                    <span>{entry.username}</span>
                                    <Badge variant={entry.rank === 1 ? "gold" : "outline"}>
                                        {entry.total_score.toLocaleString("pt-PT")} pts
                                    </Badge>
                                </li>
                            ))}
                        </ol>
                    )}
                    <Button asChild><Link to="/games">Jogar outra partida</Link></Button>
                </Card>
            </main>
        );
    }

    if (!round) {
        return <main className="multiplayer-page"><p role="status">A aguardar pela primeira ronda...</p></main>;
    }

    return (
        <ActiveRound
            key={round.id}
            roomCode={roomCode}
            match={{
                ...match,
                seconds_remaining:
                    roundSecondsLeft ?? match.seconds_remaining,
            }}
            round={round}
            isHost={isHost}
            onRefresh={matchQuery.refetch}
        />
    );
}

export default MultiplayerPage;

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    BookOpenCheck,
    Check,
    Gamepad2,
    Globe2,
    LoaderCircle,
    UsersRound,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../../components/ui/card";
import {
    createMultiplayerRoom,
    getMultiplayerRoom,
    joinMultiplayerRoom,
    setMultiplayerReady,
    startMultiplayer,
} from "../../services/multiplayerService";
import { startGame } from "../../services/gameService";
import { startQuizSession } from "../../services/quizService";
import { getApiErrorMessage } from "../../utils/apiErrors";
import showcaseImages from "../../components/Profile/GameShowcase/showcaseImages";
import "../../components/Profile/GameShowcase/GameShowcase.css";

const modes = [
    {
        id: "play",
        title: "Play",
        icon: Globe2,
    },
    {
        id: "multiplayer",
        title: "Multiplayer",
        icon: UsersRound,
    },
    {
        id: "quiz",
        title: "Quiz",
        icon: BookOpenCheck,
    },
];

function GamesPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [activeMode, setActiveMode] = useState(() =>
        location.state?.openMultiplayer ? "multiplayer" : null
    );
    const [roomCode, setRoomCode] = useState("");
    const [codeInput, setCodeInput] = useState("");
    const [isHost, setIsHost] = useState(false);
    const [isBusy, setIsBusy] = useState(false);
    const [pendingMode, setPendingMode] = useState(null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    useEffect(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return undefined;
        }

        const interval = window.setInterval(() => {
            setActiveImageIndex((index) => (index + 1) % showcaseImages.length);
        }, 5000);

        return () => window.clearInterval(interval);
    }, []);

    const roomQuery = useQuery({
        queryKey: ["multiplayer", "room", roomCode],
        queryFn: ({ signal }) => getMultiplayerRoom(roomCode, { signal }),
        enabled: Boolean(roomCode),
        refetchInterval: (query) =>
            query.state.data?.status === "waiting" ? 3000 : false,
        retry: false,
    });

    useEffect(() => {
        if (roomQuery.data?.status === "in_progress") {
            navigate(`/multiplayer/${roomCode}`, {
                replace: true,
                state: { isHost },
            });
        }
    }, [isHost, navigate, roomCode, roomQuery.data?.status]);

    async function runAction(action, modeId = null) {
        setIsBusy(true);
        setPendingMode(modeId);
        try {
            await action();
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Não foi possível iniciar esta experiência."));
        } finally {
            setIsBusy(false);
            setPendingMode(null);
        }
    }

    function handleStartMode(modeId) {
        if (modeId === "multiplayer") {
            setActiveMode("multiplayer");
            return;
        }

        if (modeId === "play") {
            runAction(async () => {
                const game = await startGame();
                navigate(`/game/${game.session_id}`, { state: { game } });
            }, modeId);
            return;
        }

        runAction(async () => {
            const session = await startQuizSession();
            navigate(`/quiz/${session.session_id}`);
        }, modeId);
    }

    async function handleCreateRoom() {
        await runAction(async () => {
            const room = await createMultiplayerRoom();
            setRoomCode(room.code);
            setIsHost(true);
        });
    }

    async function handleJoinRoom(event) {
        event.preventDefault();
        await runAction(async () => {
            const participant = await joinMultiplayerRoom(codeInput.trim());
            setRoomCode(participant.room_code);
            setIsHost(false);
        });
    }

    async function handleReadyToggle() {
        if (!roomCode || !roomQuery.data) return;
        const participant = roomQuery.data.participants.find(
            (item) => item.username === user?.username
        );
        await runAction(() =>
            setMultiplayerReady(roomCode, !participant?.is_ready)
        );
        await roomQuery.refetch();
    }

    async function handleStartMatch() {
        await runAction(async () => {
            await startMultiplayer(roomCode);
            navigate(`/multiplayer/${roomCode}`, {
                state: { isHost: true },
            });
        });
    }

    const me = roomQuery.data?.participants.find(
        (participant) => participant.username === user?.username
    );
    const allReady = roomQuery.data?.participants.length >= 2 &&
        roomQuery.data.participants.every((participant) => participant.is_ready);

    return (
        <main className="app-page games-page">
            <header className="app-page__heading">
                <div>
                    <span className="app-page__eyebrow">
                        <Gamepad2 size={14} /> Escolhe como queres explorar
                    </span>
                    <h1>Modos de jogo</h1>
                    <p>Cada partida é uma nova oportunidade para descobrir Angola.</p>
                </div>
            </header>

            <section
                className="game-showcase games-page__showcase"
                aria-label="Descobre Angola"
            >
                <div className="game-showcase__images" aria-hidden="true">
                    {showcaseImages.map((item, index) => (
                        <div
                            key={item.id}
                            className={`game-showcase__image${index === activeImageIndex ? " active" : ""}`}
                            style={{ backgroundImage: `url(${item.image})` }}
                        />
                    ))}
                </div>
                <div className="game-showcase__overlay" />
                <div className="game-showcase__content">
                    <span className="game-showcase__eyebrow">
                        DESCOBRE ANGOLA
                    </span>
                    <h2>Conheces realmente Angola?</h2>
                    <p>
                        Explora paisagens, testa os teus conhecimentos e
                        desafia outros jogadores.
                    </p>
                    <div
                        className="game-showcase__actions games-page__mode-actions"
                        aria-busy={isBusy}
                    >
                        {modes.map(({ id, title, icon: Icon }) => (
                            <button
                                key={id}
                                type="button"
                                className={`game-showcase__button games-page__mode-button${id !== "play" ? ` game-showcase__button--${id}` : ""}`}
                                onClick={() => handleStartMode(id)}
                                disabled={isBusy}
                            >
                                {pendingMode === id ? (
                                    <LoaderCircle
                                        className="animate-spin"
                                        size={17}
                                        aria-hidden="true"
                                    />
                                ) : (
                                    <Icon size={17} aria-hidden="true" />
                                )}
                                {title}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="game-showcase__indicators" aria-hidden="true">
                    {showcaseImages.map((item, index) => (
                        <span
                            key={item.id}
                            className={index === activeImageIndex ? "active" : ""}
                        />
                    ))}
                </div>
            </section>

            {activeMode === "multiplayer" && (
                <section className="multiplayer-lobby" aria-live="polite">
                    {!roomCode ? (
                        <Card>
                            <CardHeader>
                                <CardTitle>Prepara a tua sala</CardTitle>
                                <CardDescription>
                                    Cria uma sala para convidar amigos ou introduz um código recebido.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="multiplayer-lobby__entry">
                                <Button onClick={handleCreateRoom} disabled={isBusy}>
                                    Criar sala
                                </Button>
                                <form onSubmit={handleJoinRoom}>
                                    <label htmlFor="room-code">Código da sala</label>
                                    <div className="multiplayer-lobby__join">
                                        <input
                                            id="room-code"
                                            value={codeInput}
                                            onChange={(event) => setCodeInput(event.target.value.toUpperCase())}
                                            maxLength={8}
                                            minLength={8}
                                            required
                                            placeholder="EX: A1B2C3D4"
                                            autoComplete="off"
                                        />
                                        <Button type="submit" variant="outline" disabled={isBusy}>
                                            Entrar
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardHeader>
                                <Badge variant="gold">Sala {roomQuery.data?.status === "in_progress" ? "em jogo" : "à espera"}</Badge>
                                <CardTitle>Código: <span className="multiplayer-lobby__code">{roomCode}</span></CardTitle>
                                <CardDescription>
                                    Partilha este código com os teus amigos. A sala actualiza-se automaticamente.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {roomQuery.isLoading ? (
                                    <p className="multiplayer-lobby__status"><LoaderCircle className="animate-spin" size={16} /> A carregar participantes...</p>
                                ) : roomQuery.isError ? (
                                    <p className="multiplayer-lobby__error" role="alert">
                                        Não foi possível actualizar a sala. Tenta novamente.
                                        <Button variant="link" onClick={() => roomQuery.refetch()}>Actualizar</Button>
                                    </p>
                                ) : (
                                    <>
                                        <div className="multiplayer-lobby__players">
                                            {roomQuery.data?.participants.map((participant) => (
                                                <div className="multiplayer-lobby__player" key={participant.id}>
                                                    <span>{participant.username === user?.username ? "Tu" : participant.username}</span>
                                                    <Badge variant={participant.is_ready ? "gold" : "outline"}>
                                                        {participant.is_ready ? <><Check size={12} /> Preparado</> : "A aguardar"}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="multiplayer-lobby__actions">
                                            <Button onClick={handleReadyToggle} disabled={isBusy || roomQuery.data?.status !== "waiting"}>
                                                {me?.is_ready ? "Cancelar preparação" : "Estou preparado"}
                                            </Button>
                                            {isHost && (
                                                <Button
                                                    variant="outline"
                                                    onClick={handleStartMatch}
                                                    disabled={isBusy || !allReady}
                                                >
                                                    Iniciar partida
                                                </Button>
                                            )}
                                            {!isHost && (
                                                <span className="multiplayer-lobby__status">
                                                    {roomQuery.isFetching ? <LoaderCircle className="animate-spin" size={15} /> : null}
                                                    À espera do anfitrião
                                                </span>
                                            )}
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </section>
            )}
        </main>
    );
}

export default GamesPage;

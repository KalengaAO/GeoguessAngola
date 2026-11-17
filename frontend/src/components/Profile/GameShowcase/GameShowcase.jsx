import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import showcaseImages from "./showcaseImages";

import { startGame } from "../../../services/gameService";
import { startQuizSession } from "../../../services/quizService";

import "./GameShowcase.css";

function GameShowcase() {
    const [activeIndex, setActiveIndex] = useState(0);
    const [loadingMode, setLoadingMode] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex((currentIndex) =>
                (currentIndex + 1) % showcaseImages.length
            );
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    async function handleStartGame() {
        try {
            setLoadingMode("geoguess");

            const game = await startGame();

            navigate(`/game/${game.session_id}`, {
                state: { game },
            });
        } catch (error) {
            console.error("Erro ao iniciar GeoGuess:", error);
            toast.error(
                error.response?.data?.detail ||
                "Não foi possível iniciar o GeoGuess."
            );
        } finally {
            setLoadingMode(null);
        }
    }

    async function handleStartMultiplayer() {
        navigate("/games", { state: { openMultiplayer: true } });
    }

    async function handleStartQuiz() {
        try {
            setLoadingMode("quiz");

            const session = await startQuizSession();

            navigate(`/quiz/${session.session_id}`, {
                state: { session },
            });
        } catch (error) {
            console.error("Erro ao iniciar Quiz:", error);
            toast.error(
                error.response?.data?.detail ||
                "Não foi possível iniciar o Quiz."
            );
        } finally {
            setLoadingMode(null);
        }
    }

    const isLoading = loadingMode !== null;

    return (
        <section className="game-showcase">

            <div className="game-showcase__images">
                {showcaseImages.map((item, index) => (
                    <div
                        key={item.id}
                        className={`game-showcase__image ${
                            index === activeIndex ? "active" : ""
                        }`}
                        style={{
                            backgroundImage: `url(${item.image})`,
                        }}
                        aria-hidden={index !== activeIndex}
                    />
                ))}
            </div>

            <div className="game-showcase__overlay" />

            <div className="game-showcase__content">
                <span className="game-showcase__eyebrow">
                    DESCOBRE ANGOLA
                </span>

                <h1 className="game-showcase__title">
                    Conheces realmente Angola?
                </h1>

                <p className="game-showcase__description">
                    Explora paisagens, testa os teus conhecimentos
                    e desafia outros jogadores.
                </p>

                <div className="game-showcase__actions">
                    <button
                        type="button"
                        className="game-showcase__button game-showcase__button--geoguess"
                        onClick={handleStartGame}
                        disabled={isLoading}
                    >
                        {loadingMode === "geoguess"
                            ? "A iniciar..."
                            : "GeoGuess"}
                    </button>

                    <button
                        type="button"
                        className="game-showcase__button game-showcase__button--multiplayer"
                        onClick={handleStartMultiplayer}
                        disabled={isLoading}
                    >
                        {loadingMode === "multiplayer"
                            ? "A iniciar..."
                            : "Multiplayer"}
                    </button>

                    <button
                        type="button"
                        className="game-showcase__button game-showcase__button--quiz"
                        onClick={handleStartQuiz}
                        disabled={isLoading}
                    >
                        {loadingMode === "quiz"
                            ? "A iniciar..."
                            : "Quiz"}
                    </button>
                </div>
            </div>

            <div className="game-showcase__indicators">
                {showcaseImages.map((item, index) => (
                    <button
                        key={item.id}
                        type="button"
                        className={
                            index === activeIndex ? "active" : ""
                        }
                        onClick={() => setActiveIndex(index)}
                        aria-label={`Mostrar imagem ${index + 1}`}
                        aria-current={index === activeIndex}
                    />
                ))}
            </div>

        </section>
    );
}

export default GameShowcase;
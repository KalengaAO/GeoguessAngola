import { useEffect, useState } from "react";
import showcaseImages from "./showcaseImages";
import "./GameShowcase.css";

function GameShowcase() {
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex((currentIndex) =>
                (currentIndex + 1) % showcaseImages.length
            );
        }, 5000);

        return () => clearInterval(interval);
    }, []);

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
                        
                <button
                    type="button"
                    className="game-showcase__button"
                >
                    Começar jogo Solo
                </button>
            </div>

            <div className="game-showcase__indicators">
                {showcaseImages.map((item, index) => (
                    <span
                        key={item.id}
                        className={
                            index === activeIndex ? "active" : ""
                        }
                    />
                ))}
            </div>

        </section>
    );
}

export default GameShowcase;

import { useEffect, useState } from "react";
import Navbar from "../Navbar/Navbar";
import landscapes from "../../config/landscapes";
import "./Header.css";

function Header() {
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex((currentIndex) => (
                (currentIndex + 1) % landscapes.length
            ));
        }, 6000);

        return () => clearInterval(interval);
    }, []);

    const activeLandscape = landscapes[activeIndex];

    return (
        <header className="header">

            <Navbar />

            <div
                className="header__background"
                style={{
                    backgroundImage: `url("${activeLandscape.image}")`,
                }}
                key={activeLandscape.id}
            />

            <div className="header__overlay" />

            <div className="header__content">
                <p className="header__eyebrow">
                    EXPLORA ANGOLA
                </p>

                <h1>
                    Angola — Mais que um país,
                    <span> uma experiência.</span>
                </h1>

                <p className="header__description">
                    Descobre os lugares, paisagens e maravilhas
                    de Angola através de um desafio de exploração
                    e conhecimento geográfico.
                </p>
            </div>

            <div className="header__location">
                {activeLandscape.name}
            </div>

        </header>
    );
}

export default Header;

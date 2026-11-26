
import { useEffect, useState } from "react";
import { ArrowRight, Gamepad2 } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import landscapes from "../../config/landscapes";
import "./Home.css";

function Home({ activeAuthPanel, onToggleAuth }) {
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
        <>
        <main className="header">

            <Navbar
                activeAuthPanel={activeAuthPanel}
                onToggleAuth={onToggleAuth}
            />

            <div
                className="header__background"
                style={{
                    backgroundImage: `url("${activeLandscape.image}")`,
                }}
                key={activeLandscape.id}
            />

            <div className="header__overlay" />

            <div className="header__content">
           
                <h1>
                    GeoGuess - Angola <br />
                </h1>
                    <p className="header__eyebrow">
                    MAIS QUE UMA EXPERIÊNCIA!
                    </p>

                <p className="header__description">
                    Descobre os lugares, paisagens e maravilhas
                    de Angola através de um desafio de exploração
                    e conhecimento geográfico.
                </p>
                <Link className="header__play-button" to="/login">
                    <Gamepad2 size={19} aria-hidden="true" />
                    Jogar agora
                    <ArrowRight size={17} aria-hidden="true" />
                </Link>
            </div>

            <div className="header__location">
                {activeLandscape.name}
            </div>

        </main>
            <Footer />
            </>
    );
}

export default Home;

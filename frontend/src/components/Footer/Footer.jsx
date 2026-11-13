
import { Link } from "react-router-dom";
import "./Footer.css";

const culturalElements = [
    {
        id: 1,
        name: "O Pensador Tchokwe",
        image: "/images/cultural/pensador.svg",
    },
    {
        id: 2,
        name: "Palanca Negra Gigante",
        image: "/images/cultural/palanca_negra.svg",
    },
    {
        id: 3,
        name: "Cristo Rei do Lubango",
        image: "/images/cultural/estatua_cristo_rei.svg",
    },
    {
        id: 4,
        name: "Pedras Negras de Pungo Andongo",
        image: "/images/cultural/pedras_negras_pungo_andongo.svg",
    },
];

function Footer() {
    return (
        <footer className="footer">

            <div className="footer__main">

                <div className="footer__identity">
                    <Link to="/" className="footer__brand">
                        GeoGuess <span>Angola</span>
                    </Link>

                    <p>
                        Descobre Angola, explora as suas paisagens
                        e testa os teus conhecimentos geográficos.
                    </p>
                </div>

                <div className="footer__navigation">
                    <h3>Navegação</h3>

                    <Link to="/">Início</Link>
                    <Link to="/game">Jogo</Link>
                    <Link to="/multiplayer">Multiplayer</Link>
                </div>

                <div className="footer__about">
                    <h3>O projeto</h3>

                    <p>
                        Uma experiência de exploração,
                        aprendizagem e descoberta de Angola.
                    </p>
                </div>

            </div>

            <div className="footer__culture">
                <div className="footer__culture-track">
                    {[...culturalElements, ...culturalElements].map(
                        (element, index) => (
                            <div
                                className="footer__culture-item"
                                key={`${element.id}-${index}`}
                            >
                                <img
                                    src={element.image}
                                    alt={element.name}
                                />
                                <span>{element.name}</span>
                            </div>
                        )
                    )}
                </div>
            </div>

            <div className="footer__bottom">
                <p>
                    © {new Date().getFullYear()} GeoGuess Angola.
                    Todos os direitos reservados.
                </p>

                <span>Feito com identidade angolana.</span>
            </div>

        </footer>
    );
}

export default Footer;

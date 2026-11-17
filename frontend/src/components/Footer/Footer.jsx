
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

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
        image: "/images/cultural/pedras_negras_pungo_andongo.png",
    },
    {
        id: 5,
        name: "Máscara Chokwe",
        image: "/images/cultural/mascara_chokwe.svg",
    },
    {
        id: 6,
        name: "Luanda",
        image: "/images/cultural/Luanda.png",
    },
    {
        id: 7,
        name: "Máscara de madeira",
        image: "/images/cultural/mascara_madeira.svg",
    },
    {
        id: 8,
        name: "Serra da Leba",
        image: "/images/cultural/serra_da_leba_estrada.svg",
    },
];

function Footer() {
    const { isAuthenticated } = useAuth();

    return (
        <footer className="footer">

            <div className="footer__main">
                {!isAuthenticated && (
                    <>
                        <div className="footer__identity">
                            <Link
                                to="/"
                                className="footer__brand"
                                aria-label="GeoGuess Angola"
                            >
                                <img
                                    src="/images/logo/logo-stacked-color-dark.svg"
                                    alt=""
                                />
                            </Link>

                            <p>
                                Descobre Angola, explora as suas paisagens
                                e testa os teus conhecimentos geográficos.
                            </p>
                        </div>

                        <div className="footer__about">
                            <h3>Sobre</h3>

                            <p>
                                O nosso projeto consiste no desenvolvimento
                                de uma plataforma interativa que combina
                                exploração geográfica e conhecimento cultural,
                                inspirada no conceito do GeoGuessr, mas com
                                um foco especial em Angola.
                            </p>
                        </div>

                        <div className="footer__about">
                            <h3>O projeto</h3>

                            <p>
                                Uma experiência de exploração,
                                aprendizagem e descoberta de Angola.
                            </p>
                        </div>
                    </>
                )}
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


import { NavLink } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
    return (
        <nav className="navbar">
            <div className="navbar__container">

                <NavLink to="/" className="navbar__brand">
                    GeoGuess <span>Angola</span>
                </NavLink>

                <div className="navbar__links">
                    <NavLink to="/" end>
                        Início
                    </NavLink>

                    <NavLink to="/game">
                        Jogo
                    </NavLink>

                    <NavLink to="/multiplayer">
                        Multiplayer
                    </NavLink>
                </div>

                <div className="navbar__actions">
                    <NavLink
                        to="/login"
                        className="navbar__login"
                    >
                        Entrar
                    </NavLink>

                    <NavLink
                        to="/register"
                        className="navbar__register"
                    >
                        Criar conta
                    </NavLink>
                </div>

            </div>
        </nav>
    );
}

export default Navbar;

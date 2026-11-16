
import { Link } from "react-router-dom";
import "./Navbar.css";

function Navbar({ activeAuthPanel, onToggleAuth }) {
    return (
        <nav className="navbar">
            <div className="navbar__container">

                <Link to="/" className="navbar__brand">
                    GeoGuess <span>Angola</span>
                </Link>

                <div className="navbar__actions">
                    <button
                        type="button"
                        className="navbar__login"
                        aria-controls="auth-panel"
                        aria-expanded={activeAuthPanel === "login"}
                        onClick={() => onToggleAuth("login")}
                    >
                        Entrar
                    </button>
                    <button
                        type="button"
                        className="navbar__register"
                        aria-controls="auth-panel"
                        aria-expanded={activeAuthPanel === "register"}
                        onClick={() => onToggleAuth("register")}
                    >
                        Criar conta
                    </button>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;


import BrandLogo from "../BrandLogo/BrandLogo";
import "./Navbar.css";

function Navbar({ activeAuthPanel, onToggleAuth }) {
    return (
        <nav className="navbar">
            <div className="navbar__container">

                <BrandLogo to="/" className="navbar__brand" />

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

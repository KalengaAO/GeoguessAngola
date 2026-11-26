import {
    Gamepad2,
    Trophy,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import "./AuthenticatedLayout.css";


const navigation = [
    {
        to: "/games",
        label: "Jogar",
        description: "Escolhe um modo e começa uma partida.",
        icon: Gamepad2,
    },
    {
        to: "/leaderboard",
        label: "Classificação",
        description: "Vê os melhores exploradores.",
        icon: Trophy,
    },
];

export function AsideNav() {
    return (
       <aside className="app-shell__sidebar">
                    <nav
                        className="app-shell__navigation"
                        aria-label="Navegação principal"
                    >
                        {navigation.map(({ to, label, description, icon: Icon }) => (
                            <NavLink
                                key={to}
                                to={to}
                                className={({ isActive }) =>
                                    `app-shell__nav-link${isActive ? " is-active" : ""}${to === "/games" ? " app-shell__nav-link--play" : ""}`
                                }
                            >
                                <Icon size={19} aria-hidden="true" />
                                <span className="app-shell__nav-copy">
                                    <span className="app-shell__nav-label">{label}</span>
                                    <small className="app-shell__nav-description">
                                        {description}
                                    </small>
                                </span>
                            </NavLink>
                        ))}
                    </nav>
                </aside>
    );
}
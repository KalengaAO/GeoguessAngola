import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
    ChevronDown,
    Gamepad2,
    LogOut,
    Settings2,
    Trophy,
    UserRound,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import BrandLogo from "../BrandLogo/BrandLogo";
import GlitterWrap from "../GlitterWrap/GlitterWrap";
import FriendsDialog from "./FriendsDialog";
import InviteNotifications from "./InviteNotifications";
import ActiveMultiplayerRoomProvider from "../../contexts/ActiveMultiplayerRoomProvider";
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

function AccountMenu({ user, onLogout, menuId }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    const triggerRef = useRef(null);
    const initial = user?.username?.charAt(0).toUpperCase() || "J";

    useEffect(() => {
        if (!isOpen) return undefined;

        function handlePointerDown(event) {
            if (!containerRef.current?.contains(event.target)) {
                setIsOpen(false);
            }
        }

        function handleKeyDown(event) {
            if (event.key === "Escape") {
                setIsOpen(false);
                triggerRef.current?.focus();
            }
        }

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);

    function closeMenu() {
        setIsOpen(false);
    }

    return (
        <div className="app-shell__account-menu" ref={containerRef}>
            <button
                ref={triggerRef}
                type="button"
                className="app-shell__account-trigger"
                aria-label={`Menu da conta de ${user?.username || "Jogador"}`}
                aria-expanded={isOpen}
                aria-controls={`${menuId}-panel`}
                onClick={() => setIsOpen((open) => !open)}
            >
                <span className="app-shell__avatar" aria-hidden="true">
                    {user?.avatar ? (
                        <img src={user.avatar} alt="" />
                    ) : (
                        initial
                    )}
                </span>
                <span className="app-shell__account-name">
                    {user?.username || "Jogador"}
                </span>
                <ChevronDown
                    className="app-shell__account-chevron"
                    size={16}
                    aria-hidden="true"
                />
            </button>

            {isOpen && (
                <div
                    className="app-shell__account-dropdown"
                    id={`${menuId}-panel`}
                >
                    <div className="app-shell__account-heading">
                        <strong>{user?.username || "Jogador"}</strong>
                        <span>Explorador de Angola</span>
                    </div>
                    <NavLink
                        to="/profile"
                        className="app-shell__account-item"
                        onClick={closeMenu}
                    >
                        <UserRound size={17} aria-hidden="true" />
                        Perfil
                    </NavLink>
                    <NavLink
                        to="/settings"
                        className="app-shell__account-item"
                        onClick={closeMenu}
                    >
                        <Settings2 size={17} aria-hidden="true" />
                        Configurações
                    </NavLink>
                    <div className="app-shell__account-divider" />
                    <button
                        type="button"
                        className="app-shell__account-item app-shell__account-item--logout"
                        onClick={onLogout}
                    >
                        <LogOut size={17} aria-hidden="true" />
                        Terminar sessão
                    </button>
                </div>
            )}
        </div>
    );
}

function AuthenticatedLayout() {
    const { user, logout } = useAuth();
    const { pathname } = useLocation();
    const navigate = useNavigate();

    function handleLogout() {
        logout();
        navigate("/", { replace: true });
    }

    return (
        <ActiveMultiplayerRoomProvider>
            <div className="app-shell">
                {pathname === "/games" || pathname === "/leaderboard" ? <GlitterWrap /> : null}
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

                <div className="app-shell__content">
                    <header className="app-shell__topbar">
                        <BrandLogo
                            to="/games"
                            className="app-shell__brand"
                            compact
                        />
                        <div className="app-shell__header-actions">
                            <FriendsDialog />
                            <InviteNotifications />
                            <AccountMenu
                                user={user}
                                onLogout={handleLogout}
                                menuId="account-menu"
                            />
                        </div>
                    </header>

                    <nav
                        className="app-shell__mobile-navigation"
                        aria-label="Navegação principal"
                    >
                        {navigation.map(({ to, label, icon: Icon }) => (
                            <NavLink
                                key={to}
                                to={to}
                                aria-label={label}
                                title={label}
                                className={({ isActive }) =>
                                    `app-shell__mobile-link${isActive ? " is-active" : ""}${to === "/games" ? " app-shell__mobile-link--play" : ""}`
                                }
                            >
                                <Icon size={19} aria-hidden="true" />
                                <span>{label}</span>
                            </NavLink>
                        ))}
                    </nav>
                    <Outlet />
                </div>
            </div>
        </ActiveMultiplayerRoomProvider>
    );
}

export default AuthenticatedLayout;

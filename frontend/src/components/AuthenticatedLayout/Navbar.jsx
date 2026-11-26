import { useEffect, useRef, useState } from "react";
import BrandLogo from "../BrandLogo/BrandLogo";
import FriendsDialog from "./FriendsDialog";
import InviteNotifications from "./InviteNotifications";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
    ChevronDown,
    FileText,
    LogOut,
    Settings2,
    ShieldCheck,
    UserRound,
} from "lucide-react";
import "./AuthenticatedLayout.css";

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
                        <UserRound   size={17} aria-hidden="true" />
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
                    <NavLink
                        to="/privacy-policy"
                        className="app-shell__account-item"
                        onClick={closeMenu}
                    >
                        <ShieldCheck size={17} aria-hidden="true" />
                        Política de Privacidade
                    </NavLink>
                    <NavLink
                        to="/terms-of-service"
                        className="app-shell__account-item"
                        onClick={closeMenu}
                    >
                        <FileText size={17} aria-hidden="true" />
                        Termos de Serviço
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

export function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
 function handleLogout() {
        logout();
        navigate("/", { replace: true });
    }
    return (
        <>
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
        </>
    );
}
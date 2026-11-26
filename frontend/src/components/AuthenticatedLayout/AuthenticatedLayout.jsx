import { Outlet, useLocation } from "react-router-dom";
import GlitterWrap from "../GlitterWrap/GlitterWrap";
import ActiveMultiplayerRoomProvider from "../../contexts/ActiveMultiplayerRoomProvider";
import { AsideNav } from "./AsideNav";
import {Navbar} from "./Navbar";
import "./AuthenticatedLayout.css";

function AuthenticatedLayout() {

    const { pathname } = useLocation();

    return (
        <ActiveMultiplayerRoomProvider>
            <div className="app-shell">
                {pathname === "/games" || pathname === "/leaderboard" ? <GlitterWrap /> : null}
                {/* <aside className="app-shell__sidebar">
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
                </aside> */}
                <AsideNav/>

                <div className="app-shell__content">
                    {/* <header className="app-shell__topbar">
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
                    </header> */}
                    <Navbar/>

                    <Outlet />
                </div>
            </div>
        </ActiveMultiplayerRoomProvider>
    );
}

export default AuthenticatedLayout;

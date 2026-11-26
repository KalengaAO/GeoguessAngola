import { Outlet, useLocation } from "react-router-dom";
import GlitterWrap from "../GlitterWrap/GlitterWrap";
import ActiveMultiplayerRoomProvider from "../../contexts/ActiveMultiplayerRoomProvider";
import { AsideNav } from "./AsideNav";
import {Navbar} from "./Navbar";
import "./AuthenticatedLayout.css";

function AuthenticatedLayout() {
    const { pathname } = useLocation();
    const showAsideNav = !(
        pathname.startsWith("/game/") ||
        pathname.startsWith("/quiz/") ||
        pathname.startsWith("/multiplayer/")
    );

    return (
        <ActiveMultiplayerRoomProvider>
            <div className="app-shell">
                {pathname === "/games" || pathname === "/leaderboard" ? <GlitterWrap /> : null}
                {showAsideNav && <AsideNav />}
                <div
                    className={`app-shell__content${showAsideNav ? "" : " app-shell__content--no-sidebar"}`}
                >
                    <Navbar/>
                    <Outlet />
                </div>
            </div>
        </ActiveMultiplayerRoomProvider>
    );
}

export default AuthenticatedLayout;

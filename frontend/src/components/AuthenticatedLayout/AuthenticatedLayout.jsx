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
                <AsideNav/>
                <div className="app-shell__content">
                    <Navbar/>
                    <Outlet />
                </div>
            </div>
        </ActiveMultiplayerRoomProvider>
    );
}

export default AuthenticatedLayout;

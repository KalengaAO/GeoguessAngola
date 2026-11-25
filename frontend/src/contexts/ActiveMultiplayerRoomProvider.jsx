import { useMemo, useState } from "react";
import ActiveMultiplayerRoomContext from "./ActiveMultiplayerRoomContext";

function ActiveMultiplayerRoomProvider({ children }) {
    const [roomCode, setRoomCode] = useState("");
    const [isHost, setIsHost] = useState(false);
    const value = useMemo(
        () => ({ roomCode, setRoomCode, isHost, setIsHost }),
        [roomCode, isHost]
    );

    return (
        <ActiveMultiplayerRoomContext.Provider value={value}>
            {children}
        </ActiveMultiplayerRoomContext.Provider>
    );
}

export default ActiveMultiplayerRoomProvider;

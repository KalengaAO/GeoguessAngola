import { useContext } from "react";
import ActiveMultiplayerRoomContext from "../contexts/ActiveMultiplayerRoomContext";

function useActiveMultiplayerRoom() {
    const context = useContext(ActiveMultiplayerRoomContext);
    if (!context) {
        throw new Error(
            "useActiveMultiplayerRoom must be used within its provider."
        );
    }

    return context;
}

export default useActiveMultiplayerRoom;

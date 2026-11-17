
import api from "./api";

// Inicia uma partida Multiplayer.
export async function startMultiplayer(payload = {}) {
    const response = await api.post(
        "/multiplayer/rooms/start/",
        payload
    );

    return response.data;
}

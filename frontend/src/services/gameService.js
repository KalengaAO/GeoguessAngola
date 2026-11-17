
import api from "./api";

export async function getGameStats() {
    const response = await api.get("/game/stats/");
    return response.data;
}

export async function startGame() {
    const response = await api.post("/game/start/");
    return response.data;
}

export async function submitGameAnswer(roundId, coordinates) {
    const response = await api.post(
        `/game/rounds/${roundId}/answer/`,
        {
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
        }
    );

    return response.data;
}

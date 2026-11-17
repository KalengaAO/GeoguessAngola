import api from "./api"; // <- ajusta para a tua instância do axios

// Prefixo onde incluíste o urls.py desta app (ex.: path("api/game/", include(...))).
const GAME_BASE = "/game";

export async function startGame() {
    const { data } = await api.post(`${GAME_BASE}/start/`);
    return data;
}

export async function getGameStats(sessionId) {
    const { data } = await api.get(`${GAME_BASE}/${sessionId}/status/`);
    return data;
}

export async function submitGameAnswer(roundId, location) {
    const { data } = await api.post(
        `${GAME_BASE}/rounds/${roundId}/answer/`,
        {
            latitude: location.latitude,
            longitude: location.longitude,
        }
    );
    return data;
}

// O tempo acabou e o jogador não escolheu nenhuma localização.
export async function timeoutRound(roundId) {
    const { data } = await api.post(`${GAME_BASE}/rounds/${roundId}/timeout/`);
    return data;
}

export async function startNextRound(sessionId) {
    const { data } = await api.post(`${GAME_BASE}/${sessionId}/next/`);
    return data;
}

export async function getPlayerStats() {
    const { data } = await api.get(`${GAME_BASE}/stats/`);
    return data;
}
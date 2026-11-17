import api from "./api";

const GAME_BASE = "/game";

export async function startGame() {
    const { data } = await api.post(`${GAME_BASE}/start/`);
    return data;
}

export async function submitGameAnswer(roundId, location) {
    const { data } = await api.post(`${GAME_BASE}/rounds/${roundId}/answer/`, {
        latitude: location.latitude,
        longitude: location.longitude,
    });
    return data;
}

export async function timeoutRound(roundId) {
    const { data } = await api.post(`${GAME_BASE}/rounds/${roundId}/timeout/`);
    return data;
}

export async function startNextRound(sessionId) {
    const { data } = await api.post(`${GAME_BASE}/${sessionId}/next/`);
    return data;
}

export async function getGameStats() {
    const { data } = await api.get(`${GAME_BASE}/stats/`);
    return data;
}

export async function getLeaderboard(options = {}) {
    const { data } = await api.get(`${GAME_BASE}/leaderboard/`, options);
    return data;
}

export async function getGameStatus(sessionId) {
    const { data } = await api.get(`${GAME_BASE}/${sessionId}/status/`);
    return data;
}

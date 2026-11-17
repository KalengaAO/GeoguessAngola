
import api from "./api";

export async function createMultiplayerRoom(maxPlayers = 5) {
    const { data } = await api.post("/multiplayer/rooms/", {
        max_players: maxPlayers,
    });
    return data;
}

export async function joinMultiplayerRoom(code) {
    const { data } = await api.post("/multiplayer/rooms/join/", { code });
    return data;
}

export async function getMultiplayerRoom(code, options = {}) {
    const { data } = await api.get(`/multiplayer/rooms/${code}/`, options);
    return data;
}

export async function setMultiplayerReady(code, isReady) {
    const { data } = await api.patch("/multiplayer/rooms/ready/", {
        room_code: code,
        is_ready: isReady,
    });
    return data;
}

export async function startMultiplayer(code) {
    const { data } = await api.post("/multiplayer/rooms/start/", { code });
    return data;
}

export async function getMultiplayerMatch(code, options = {}) {
    const { data } = await api.get(
        `/multiplayer/rooms/${code}/match/`,
        options
    );
    return data;
}

export async function submitMultiplayerGuess(roundId, location) {
    const { data } = await api.post(
        `/multiplayer/rounds/${roundId}/guess/`,
        {
            guessed_latitude: location.latitude,
            guessed_longitude: location.longitude,
        }
    );
    return data;
}

export async function advanceMultiplayerRound(matchId) {
    const { data } = await api.post(
        `/multiplayer/matches/${matchId}/advance/`
    );
    return data;
}

export async function getMultiplayerResults(matchId, options = {}) {
    const { data } = await api.get(
        `/multiplayer/matches/${matchId}/results/`,
        options
    );
    return data;
}

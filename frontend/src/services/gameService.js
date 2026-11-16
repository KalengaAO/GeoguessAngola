
import api from "./api"; // Ajustar ao caminho da tua instância Axios

export async function getGameStats() {
    const response = await api.get("/game/stats/");
    return response.data;
}
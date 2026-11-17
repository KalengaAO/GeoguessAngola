
import api from "./api";

// Cria uma nova sessão de Quiz.
export async function startQuizSession() {
    const response = await api.post("/quiz/sessions/");
    return response.data;
}

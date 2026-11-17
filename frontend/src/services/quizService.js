
import api from "./api";

// Cria uma nova sessão de Quiz.
export async function startQuizSession() {
    const response = await api.post("/quiz/sessions/");
    return response.data;
}

export async function getQuizQuestions(sessionId, options = {}) {
    const response = await api.get(
        `/quiz/sessions/${sessionId}/questions/`,
        options
    );
    return response.data;
}

export async function submitQuizAnswer(sessionId, questionId, optionId) {
    const response = await api.post(
        `/quiz/sessions/${sessionId}/questions/${questionId}/answer/`,
        { option_id: optionId }
    );
    return response.data;
}

export async function endQuizSession(sessionId) {
    const response = await api.post(`/quiz/sessions/${sessionId}/end/`);
    return response.data;
}

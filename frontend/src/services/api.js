
import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Cliente separado para renovar tokens.
// Não possui os interceptors da instância api.
const refreshClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Evita múltiplos pedidos de renovação simultâneos.
let refreshPromise = null;

// INTERCEPTOR DE PEDIDOS
api.interceptors.request.use(
    (config) => {
        const accessToken = sessionStorage.getItem("access_token");

        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// INTERCEPTOR DE RESPOSTAS
api.interceptors.response.use(
    (response) => response,

    async (error) => {
        const originalRequest = error.config;

        if (
            error.response?.status !== 401 ||
            !originalRequest ||
            originalRequest._retry
        ) {
            return Promise.reject(error);
        }

        // Não tentar renovar tokens em pedidos de autenticação.
        const url = originalRequest.url ?? "";

        if (url.includes("/token/") || url.includes("/register/")) {
            return Promise.reject(error);
        }

        const refreshToken = sessionStorage.getItem("refresh_token");

        if (!refreshToken) {
            sessionStorage.removeItem("access_token");
            sessionStorage.removeItem("refresh_token");

            return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
            // Reutiliza uma renovação que já esteja em andamento.
            if (!refreshPromise) {
                refreshPromise = refreshClient
                    .post("/token/refresh/", {
                        refresh: refreshToken,
                    })
                    .then((response) => {
                        const { access, refresh } = response.data;

                        sessionStorage.setItem("access_token", access);

                        // Só existe se a rotação de refresh tokens
                        // estiver configurada no backend.
                        if (refresh) {
                            sessionStorage.setItem("refresh_token", refresh);
                        }

                        return access;
                    })
                    .finally(() => {
                        refreshPromise = null;
                    });
            }

            const newAccessToken = await refreshPromise;

            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

            // Repete o pedido original com o novo access token.
            return api(originalRequest);

        } catch (refreshError) {
            sessionStorage.removeItem("access_token");
            sessionStorage.removeItem("refresh_token");

            return Promise.reject(refreshError);
        }
    }
);

export default api;


import api from "./api";
import {
    clearAuthTokens,
    getAccessToken,
    setAuthTokens,
} from "../utils/storage";

// Registo de utilizador
export async function registerUser(userData) {
    const response = await api.post("/account/register/", userData);
    return response.data;
}

// Autenticação
export async function loginUser(credentials) {
    const response = await api.post("/login/", credentials);

    const { access, refresh } = response.data;

    setAuthTokens({ access, refresh });

    return response.data;
}

// Obter utilizador autenticado
export async function getCurrentUser() {
    const response = await api.get("/account/profile/");
    return response.data;
}

// Atualizar perfil
export async function updateCurrentUser(profileData) {
    const response = await api.patch(
        "/account/profile/",
        profileData
    );

    return response.data;
}

// Encerrar sessão local
export function logoutUser() {
    clearAuthTokens();
}

// Obter access token
export { getAccessToken };

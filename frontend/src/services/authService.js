
import api from "./api";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

// Registo de utilizador
export async function registerUser(userData) {
    const response = await api.post("/account/register/", userData);
    return response.data;
}

// Autenticação
export async function loginUser(credentials) {
    const response = await api.post("/token/", credentials);

    const { access, refresh } = response.data;

    sessionStorage.setItem(ACCESS_TOKEN_KEY, access);
    sessionStorage.setItem(REFRESH_TOKEN_KEY, refresh);

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
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

// Obter access token
export function getAccessToken() {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

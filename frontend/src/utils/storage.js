export const AUTH_SESSION_EXPIRED_EVENT = "geoguess:auth-session-expired";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

export function getAccessToken() {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
    return sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setAuthTokens({ access, refresh }) {
    if (!access || !refresh) {
        throw new Error("A resposta de autenticação não contém os tokens necessários.");
    }

    sessionStorage.setItem(ACCESS_TOKEN_KEY, access);
    sessionStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}

export function setAccessToken(access) {
    if (!access) {
        throw new Error("O access token não pode estar vazio.");
    }

    sessionStorage.setItem(ACCESS_TOKEN_KEY, access);
}

export function setRefreshToken(refresh) {
    if (!refresh) {
        throw new Error("O refresh token não pode estar vazio.");
    }

    sessionStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}

export function clearAuthTokens() {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function notifyAuthSessionExpired() {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
    }
}

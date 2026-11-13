
import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

import {
    loginUser,
    logoutUser,
    getAccessToken,
    getCurrentUser,
    updateCurrentUser,
} from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Restaurar a sessão quando a aplicação iniciar.
    useEffect(() => {
        const token = getAccessToken();

        if (token) {
            setIsAuthenticated(true);
        }

        setIsLoading(false);
    }, []);

    // Autenticar utilizador.
    async function login(credentials) {
        const data = await loginUser(credentials);

        setIsAuthenticated(true);

        return data;
    }

    // Terminar sessão.
    function logout() {
        logoutUser();
        setUser(null);
        setIsAuthenticated(false);
    }

    async function updateProfile(profileData) {
        const updatedUser = await updateCurrentUser(profileData);

        setUser(updatedUser);

        return updatedUser;
    }
    
    const value = {
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        updateProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// Hook para consumir o contexto.
export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth deve ser utilizado dentro de AuthProvider."
        );
    }

    return context;
}

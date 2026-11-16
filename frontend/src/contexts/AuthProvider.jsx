
import { useEffect, useState } from "react";
import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import AuthContext from "./authContext";
import {
    loginUser,
    logoutUser,
    getCurrentUser,
    updateCurrentUser,
} from "../services/authService";
import {
    AUTH_SESSION_EXPIRED_EVENT,
    getAccessToken,
} from "../utils/storage";
import { CURRENT_USER_QUERY_KEY } from "../utils/queryKeys";

export function AuthProvider({ children }) {
    const queryClient = useQueryClient();
    const [accessToken, setAccessToken] = useState(getAccessToken);
    const userQuery = useQuery({
        queryKey: CURRENT_USER_QUERY_KEY,
        queryFn: getCurrentUser,
        enabled: Boolean(accessToken),
        retry: false,
    });
    const loginMutation = useMutation({ mutationFn: loginUser });
    const updateProfileMutation = useMutation({
        mutationFn: updateCurrentUser,
        onSuccess: (updatedUser) => {
            queryClient.setQueryData(CURRENT_USER_QUERY_KEY, updatedUser);
        },
    });

    const user = userQuery.data ?? null;
    const isAuthenticated = Boolean(accessToken && user);
    const isLoading = Boolean(accessToken && userQuery.isLoading);
    const authError =
        accessToken && userQuery.isError ? userQuery.error : null;

    useEffect(() => {
        function handleSessionExpired() {
            setAccessToken(null);
            queryClient.clear();
            toast.error("A sessão expirou. Inicia sessão novamente.");
        }

        window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
        return () => {
            window.removeEventListener(
                AUTH_SESSION_EXPIRED_EVENT,
                handleSessionExpired
            );
        };
    }, [queryClient]);

    // Autenticar utilizador.
    async function login(credentials) {
        const data = await loginMutation.mutateAsync(credentials);
        const token = getAccessToken();
        setAccessToken(token);

        try {
            const loggedInUser = await queryClient.fetchQuery({
                queryKey: CURRENT_USER_QUERY_KEY,
                queryFn: getCurrentUser,
                staleTime: 0,
            });

            return { ...data, user: loggedInUser };
        } catch (error) {
            logoutUser();
            setAccessToken(null);
            queryClient.clear();
            throw error;
        }
    }

    // Terminar sessão.
    function logout() {
        logoutUser();
        setAccessToken(null);
        queryClient.clear();
        toast.success("Sessão terminada.");
    }

    async function updateProfile(profileData) {
        return updateProfileMutation.mutateAsync(profileData);
    }
    
    const value = {
        user,
        isAuthenticated,
        isLoading,
        authError,
        retrySession: userQuery.refetch,
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

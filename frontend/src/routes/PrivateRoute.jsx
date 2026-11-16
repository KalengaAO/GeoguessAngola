import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import AuthSessionStatus from "../components/Auth/AuthSessionStatus/AuthSessionStatus";

function PrivateRoute() {
    const { isAuthenticated, isLoading, authError, retrySession } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <p role="status">A verificar sessão...</p>;
    }

    if (authError) {
        return <AuthSessionStatus onRetry={retrySession} />;
    }

    if (!isAuthenticated) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: location }}
            />
        );
    }

    return <Outlet />;
}

export default PrivateRoute;

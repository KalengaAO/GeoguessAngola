import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import AuthSessionStatus from "../components/Auth/AuthSessionStatus/AuthSessionStatus";

function PublicRoute({ children }) {
    const { isAuthenticated, isLoading, authError, retrySession } = useAuth();

    if (isLoading) {
        return <p role="status">A verificar sessão...</p>;
    }

    if (authError) {
        return <AuthSessionStatus onRetry={retrySession} />;
    }

    if (isAuthenticated) {
        return <Navigate to="/profile" replace />;
    }

    return children;
}

export default PublicRoute;

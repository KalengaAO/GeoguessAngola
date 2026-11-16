import "./AuthSessionStatus.css";

function AuthSessionStatus({ onRetry }) {
    return (
        <main className="auth-session-status">
            <p role="alert">
                Não foi possível verificar a sessão. Verifica a ligação e tenta
                novamente.
            </p>
            <button type="button" onClick={() => onRetry()}>
                Tentar novamente
            </button>
        </main>
    );
}

export default AuthSessionStatus;

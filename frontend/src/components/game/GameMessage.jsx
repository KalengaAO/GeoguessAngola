/** Mensagem centrada (loading, erros, etc.). */
function GameMessage({ title, text, children }) {
    return (
        <div className="game-page__message">
            <h1>{title}</h1>
            {text && <p>{text}</p>}
            {children}
        </div>
    );
}

export default GameMessage;

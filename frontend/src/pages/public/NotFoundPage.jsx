import { Link } from "react-router-dom";

function NotFoundPage() {
    return (
        <main className="profile-page">
            <section className="profile">
                <span className="profile__eyebrow">GEOGUESS ANGOLA</span>
                <h1>Página não encontrada</h1>
                <p>Esta página não existe.</p>
                <Link to="/">Voltar ao início</Link>
            </section>
        </main>
    );
}

export default NotFoundPage;

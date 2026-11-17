import { Link } from "react-router-dom";
import BrandLogo from "../../components/BrandLogo/BrandLogo";

function NotFoundPage() {
    return (
        <main className="profile-page">
            <section className="profile">
                <BrandLogo to="/" />
                <h1>Página não encontrada</h1>
                <p>Esta página não existe.</p>
                <Link to="/">Voltar ao início</Link>
            </section>
        </main>
    );
}

export default NotFoundPage;

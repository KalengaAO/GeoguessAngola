
import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login({ onSuccess }) {
    const { login } = useAuth();

    const [formData, setFormData] = useState({
        username: "",
        password: "",
    });
    
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    function handleChange(event) {
        const { name, value } = event.target;

        setFormData((previousData) => ({
            ...previousData,
            [name]: value,
        }));

        setError("");
    }

    async function handleSubmit(event) {
        event.preventDefault();

        setError("");
        setIsLoading(true);

        try {
           await login(formData);

            setFormData({
                username: "",
                password: "",
            });

            navigate("/profile", { replace: true });
        } catch (error) {
            const responseData = error.response?.data;

            setError(
                responseData?.detail ||
                "Não foi possível iniciar sessão. Verifica as tuas credenciais."
            );
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="login-page">
            <section className="login">
                <header className="login__header">
                    <h2>
                        <span className="login__eyebrow">
                            GEOGUESS ANGOLA
                        </span>
                        <p>
                            Inicia sessão para continuares a explorar Angola.
                        </p>
                    </h2>
                </header>

                <form className="login__form" onSubmit={handleSubmit}>
                    <div className="login__field">
                        <label htmlFor="login-username">
                            Nome de utilizador
                        </label>

                        <input
                            id="login-username"
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="nome de utilizador (a)"
                            autoComplete="username"
                            required
                        />
                    </div>

                    <div className="login__field">
                        <label htmlFor="login-password">
                            Palavra-passe
                        </label>

                        <input
                            id="login-password"
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="palavra-passe"
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    <div className="login__header">

</div>
                    {error && (
                        <p className="login__error" role="alert">
                            {error}
                        </p>
                    )}

                    <button
                        className="login__submit"
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading ? "A entrar..." : "Entrar"}
                    </button>
                </form>
            </section>
        </div>
    );
}

export default Login;


import { useState } from "react";
import { registerUser } from "../../../services/authService";
import "./Register.css";

function Register() {
    const [formData, setFormData] = useState({
        username: "",
        password: "",
    });

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    function handleChange(event) {
        const { name, value } = event.target;

        setFormData((previousData) => ({
            ...previousData,
            [name]: value,
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();

        setMessage("");
        setError("");
        setIsLoading(true);

        try {
            const response = await registerUser(formData);

            setMessage(
                response.detail || "Utilizador criado com sucesso."
            );

            setFormData({
                username: "",
                password: "",
            });
        } catch (error) {
            const data = error.response?.data;

            if (data && typeof data === "object") {
                setError(
                    Object.entries(data)
                        .map(([field, messages]) =>
                            `${field}: ${
                                Array.isArray(messages)
                                    ? messages.join(", ")
                                    : messages
                            }`
                        )
                        .join(" | ")
                );
            } else {
                setError("Não foi possível concluir o registo.");
            }
        } finally {
            setIsLoading(false);
        }
    }
 
return (
    <section className="register-page">
        <div className="register">
            <div className="register__header">
                
                <p>
                    Junta-te à comunidade.
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="register__field">
                    <label htmlFor="username">
                        Nome de utilizador
                    </label>

                    <input
                        id="username"
                        name="username"
                        type="text"
                        placeholder="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="register__field">
                    <label htmlFor="password">
                        Palavra-passe
                    </label>

                    <input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="palavra-passe"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                >
                    {isLoading ? "A criar conta..." : "Criar conta"}
                </button>
            </form>

            {message && (
                <p className="register__success">{message}</p>
            )}

            {error && (
                <p className="register__error">{error}</p>
            )}
        </div>
    </section>
);

}

export default Register;

import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../../hooks/useAuth";
import { useAppForm } from "../../../hooks/useAppForm";
import { getApiErrorMessage } from "../../../utils/apiErrors";
import { loginSchema } from "../../../schemas/authSchemas";
import "./LoginForm.css";

const defaultValues = {
    username: "",
    password: "",
};

function LoginForm() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const { form, handleSubmit, isSubmitting, fieldError } = useAppForm({
        schema: loginSchema,
        defaultValues,
        onSubmit: async (credentials) => {
            try {
                const session = await login(credentials);
                toast.success(`Bem-vindo, ${session.user.username}.`);
                form.reset(defaultValues);
                navigate(location.state?.from?.pathname || "/games", {
                    replace: true,
                });
            } catch (requestError) {
                toast.error(
                    getApiErrorMessage(
                        requestError,
                        "Não foi possível iniciar sessão. Verifica as tuas credenciais."
                    )
                );
            }
        },
    });

    return (
        <div className="login-page">
            <section className="login">
                <header className="login__header">
                    <span className="login__eyebrow">GEOGUESS ANGOLA</span>
                    <p>Inicia sessão para continuares a explorar Angola.</p>
                </header>

                <form className="login__form" onSubmit={handleSubmit} noValidate>
                    <div className="login__field">
                        <label htmlFor="login-username">
                            Nome de utilizador
                        </label>
                        <input
                            id="login-username"
                            type="text"
                            autoComplete="username"
                            placeholder="nome de utilizador (a)"
                            {...form.register("username")}
                            aria-invalid={Boolean(fieldError("username"))}
                        />
                        {fieldError("username") && (
                            <p className="login__field-error" role="alert">
                                {fieldError("username")}
                            </p>
                        )}
                    </div>

                    <div className="login__field">
                        <label htmlFor="login-password">Palavra-passe</label>
                        <input
                            id="login-password"
                            type="password"
                            autoComplete="current-password"
                            placeholder="palavra-passe"
                            {...form.register("password")}
                            aria-invalid={Boolean(fieldError("password"))}
                        />
                        {fieldError("password") && (
                            <p className="login__field-error" role="alert">
                                {fieldError("password")}
                            </p>
                        )}
                    </div>

                    <button
                        className="login__submit"
                        type="submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "A entrar..." : "Entrar"}
                    </button>
                </form>
            </section>
        </div>
    );
}

export default LoginForm;

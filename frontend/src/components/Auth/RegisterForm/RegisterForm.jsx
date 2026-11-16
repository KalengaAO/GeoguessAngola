import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { registerUser } from "../../../services/authService";
import { useAppForm } from "../../../hooks/useAppForm";
import { getApiErrorMessage } from "../../../utils/apiErrors";
import { registerSchema } from "../../../schemas/authSchemas";
import "./RegisterForm.css";

const defaultValues = {
    username: "",
    password: "",
};

function RegisterForm() {
    const registerMutation = useMutation({ mutationFn: registerUser });

    const { form, handleSubmit, isSubmitting, fieldError } = useAppForm({
        schema: registerSchema,
        defaultValues,
        onSubmit: async (userData) => {
            try {
                const response = await registerMutation.mutateAsync(userData);
                toast.success(
                    response.detail || "Utilizador criado com sucesso."
                );
                form.reset(defaultValues);
            } catch (requestError) {
                toast.error(
                    getApiErrorMessage(
                        requestError,
                        "Não foi possível concluir o registo."
                    )
                );
            }
        },
    });

    return (
        <section className="register-page">
            <div className="register">
                <header className="register__header">
                    <p>Junta-te à comunidade.</p>
                </header>

                <form onSubmit={handleSubmit} noValidate>
                    <div className="register__field">
                        <label htmlFor="register-username">
                            Nome de utilizador
                        </label>
                        <input
                            id="register-username"
                            autoComplete="username"
                            placeholder="username"
                            {...form.register("username")}
                            aria-invalid={Boolean(fieldError("username"))}
                        />
                        {fieldError("username") && (
                            <p className="register__field-error" role="alert">
                                {fieldError("username")}
                            </p>
                        )}
                    </div>

                    <div className="register__field">
                        <label htmlFor="register-password">Palavra-passe</label>
                        <input
                            id="register-password"
                            type="password"
                            autoComplete="new-password"
                            placeholder="palavra-passe"
                            {...form.register("password")}
                            aria-invalid={Boolean(fieldError("password"))}
                        />
                        {fieldError("password") && (
                            <p className="register__field-error" role="alert">
                                {fieldError("password")}
                            </p>
                        )}
                    </div>

                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "A criar conta..." : "Criar conta"}
                    </button>
                </form>
            </div>
        </section>
    );
}

export default RegisterForm;

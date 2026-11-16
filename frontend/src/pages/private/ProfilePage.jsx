import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../../hooks/useAuth";
import { getApiErrorMessage } from "../../utils/apiErrors";
import "../../components/Profile/Profile.css";

function ProfilePage() {
    const navigate = useNavigate();
    const { user, updateProfile, logout } = useAuth();
    const [formData, setFormData] = useState({
        email: user?.email || "",
        bio: user?.bio || "",
    });

    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    function handleChange(event) {
        const { name, value } = event.target;

        setFormData((previousData) => ({
            ...previousData,
            [name]: value,
        }));

    }

    function handleLogout() {
        logout();
        navigate("/", { replace: true });
    }

    async function handleSubmit(event) {
        event.preventDefault();

        setIsLoading(true);
        try {
            await updateProfile(formData);
            toast.success("Perfil atualizado com sucesso.");
            setIsEditing(false);
        } catch (requestError) {
            toast.error(
                getApiErrorMessage(
                    requestError,
                    "Não foi possível atualizar o perfil."
                )
            );
        } finally {
            setIsLoading(false);
        }
    }

    function handleCancel() {
        setFormData({
            email: user?.email || "",
            bio: user?.bio || "",
        });

        setIsEditing(false);
    }

    return (
        <section className="profile-page">
            <div className="profile">
                <header className="profile__header">
                    <span className="profile__eyebrow">GEOGUESS ANGOLA</span>
                    <h1>O teu perfil</h1>
                    <p>Gere as tuas informações de jogador.</p>
                </header>

                <div className="profile__identity">
                    <div className="profile__avatar">
                        {user?.avatar ? (
                            <img
                                src={user.avatar}
                                alt="Avatar do jogador"
                            />
                        ) : (
                            <span>
                                {user?.username?.charAt(0).toUpperCase()}
                            </span>
                        )}
                    </div>

                    <div className="profile__identity-info">
                        <h2>{user?.username}</h2>
                        <span>Jogador GeoGuess Angola</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="profile__field">
                        <label htmlFor="profile-email">Email</label>
                        <input
                            id="profile-email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={!isEditing}
                        />
                    </div>

                    <div className="profile__field">
                        <label htmlFor="profile-bio">Biografia</label>
                        <textarea
                            id="profile-bio"
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            disabled={!isEditing}
                            rows={4}
                            placeholder="Conta-nos um pouco sobre ti..."
                        />
                    </div>

                    {!isEditing ? (
                        <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                        >
                            Editar perfil
                        </button>
                    ) : (
                        <div className="profile__actions">
                            <button type="submit" disabled={isLoading}>
                                {isLoading
                                    ? "A guardar..."
                                    : "Guardar alterações"}
                            </button>
                            <button
                                type="button"
                                className="profile__cancel"
                                onClick={handleCancel}
                                disabled={isLoading}
                            >
                                Cancelar
                            </button>
                        </div>
                    )}
                </form>

                <button
                    type="button"
                    className="profile__logout"
                    onClick={handleLogout}
                >
                    Terminar sessão
                </button>
            </div>
        </section>
    );
}

export default ProfilePage;

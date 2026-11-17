import { useState } from "react";
import { toast } from "sonner";

import { useAuth } from "../../../hooks/useAuth";
import { getApiErrorMessage } from "../../../utils/apiErrors";

import "./ProfileSidebar.css";

function ProfileSidebar() {
    const { user, updateProfile } = useAuth();

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

    function handleCancel() {
        setFormData({
            email: user?.email || "",
            bio: user?.bio || "",
        });

        setIsEditing(false);
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

    return (
        <aside className="profile-sidebar">

            <div className="profile-sidebar__header">
                <span className="profile-sidebar__eyebrow">
                    PLAYER ACCOUNT
                </span>

                <h2>O teu perfil</h2>
            </div>

            <div className="profile-sidebar__identity">

                <div className="profile-sidebar__avatar">
                    {user?.avatar ? (
                        <img
                            src={user.avatar}
                            alt={`Avatar de ${user.username}`}
                        />
                    ) : (
                        <span>
                            {user?.username?.charAt(0).toUpperCase()}
                        </span>
                    )}
                </div>

                <h3>{user?.username}</h3>

                <span className="profile-sidebar__role">
                    Jogador GeoGuess Angola
                </span>

            </div>

            <form
                className="profile-sidebar__form"
                onSubmit={handleSubmit}
            >

                <div className="profile-sidebar__field">
                    <label htmlFor="profile-email">
                        Email
                    </label>

                    <input
                        id="profile-email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={!isEditing || isLoading}
                    />
                </div>

                <div className="profile-sidebar__field">
                    <label htmlFor="profile-bio">
                        Biografia
                    </label>

                    <textarea
                        id="profile-bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        disabled={!isEditing || isLoading}
                        rows={4}
                        placeholder="Conta-nos um pouco sobre ti..."
                    />
                </div>

                {!isEditing ? (
                    <button
                        type="button"
                        className="profile-sidebar__edit"
                        onClick={() => setIsEditing(true)}
                    >
                        Editar perfil
                    </button>
                ) : (
                    <div className="profile-sidebar__actions">

                        <button
                            type="submit"
                            className="profile-sidebar__save"
                            disabled={isLoading}
                        >
                            {isLoading ? "A guardar..." : "Guardar alterações"}
                        </button>

                        <button
                            type="button"
                            className="profile-sidebar__cancel"
                            onClick={handleCancel}
                            disabled={isLoading}
                        >
                            Cancelar
                        </button>

                    </div>
                )}

            </form>

        </aside>
    );
}

export default ProfileSidebar;
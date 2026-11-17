import {
    CalendarDays,
    Crown,
    Gamepad2,
    MapPinned,
    Pencil,
    Sparkles,
    UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useFetch } from "../../hooks/useFetch";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import "./ProfilePage.css";

const profileStats = [
    { key: "total_score", label: "Pontos acumulados", icon: Sparkles },
    { key: "games_played", label: "Partidas jogadas", icon: Gamepad2 },
    { key: "best_score", label: "Melhor pontuação", icon: Crown },
    { key: "completed_rounds", label: "Rondas concluídas", icon: MapPinned },
];

function ProfilePage() {
    const { user } = useAuth();
    const {
        data: stats,
        isLoading,
        isError,
    } = useFetch("/game/stats/", {
        queryKey: ["game", "stats"],
        retry: false,
    });
    const joinedDate = user?.created_at
        ? new Date(user.created_at).toLocaleDateString("pt-PT")
        : "—";
    const initial = user?.username?.charAt(0).toUpperCase() || "J";

    return (
        <main className="app-page profile-page">
            <header className="app-page__heading">
                <div>
                    <span className="app-page__eyebrow">
                        <UserRound size={14} /> Conta de jogador
                    </span>
                    <h1>O teu perfil</h1>
                    <p>A tua identidade e o teu percurso em GeoGuess Angola.</p>
                </div>
                <Button asChild>
                    <Link to="/settings">
                        <Pencil size={16} /> Editar perfil
                    </Link>
                </Button>
            </header>

            <Card className="profile-page__identity">
                <div className="profile-page__avatar" aria-hidden="true">
                    {user?.avatar ? (
                        <img src={user.avatar} alt="" />
                    ) : (
                        initial
                    )}
                </div>
                <div className="profile-page__identity-copy">
                    <Badge variant="gold">EXPLORADOR DE ANGOLA</Badge>
                    <h2>{user?.username || "Jogador"}</h2>
                    <p>
                        {user?.bio || "Adiciona uma biografia para te apresentares à comunidade."}
                    </p>
                </div>
                <div className="profile-page__account-details">
                    <span><UserRound size={15} /> {user?.email || "Email não definido"}</span>
                    <span><CalendarDays size={15} /> Membro desde {joinedDate}</span>
                </div>
            </Card>

            <section className="profile-page__stats" aria-label="Estatísticas de jogo">
                {profileStats.map(({ key, label, icon: Icon }) => (
                    <Card className="profile-page__stat" key={key}>
                        <span className="profile-page__stat-label">
                            {label}
                            <Icon size={17} aria-hidden="true" />
                        </span>
                        <strong>
                            {isLoading
                                ? "—"
                                : (stats?.[key] ?? 0).toLocaleString("pt-PT")}
                        </strong>
                    </Card>
                ))}
            </section>

            {isError && (
                <p className="app-page__error" role="status">
                    Não foi possível carregar as estatísticas do perfil.
                </p>
            )}
        </main>
    );
}

export default ProfilePage;
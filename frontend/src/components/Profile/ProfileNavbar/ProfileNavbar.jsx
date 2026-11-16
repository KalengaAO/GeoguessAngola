
import { useEffect, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { getGameStats } from "../../../services/gameService";

import "./ProfileNavbar.css";

function ProfileNavbar() {
    const { user } = useAuth();

    const [stats, setStats] = useState({
        total_score: 0,
        games_played: 0,
        best_score: 0,
        completed_rounds: 0,
    });

    const [isLoading, setIsLoading] = useState(true);
    const [statsError, setStatsError] = useState(false);

    const createdAt = user?.created_at
        ? new Date(user.created_at).toLocaleDateString("pt-PT")
        : "—";

    useEffect(() => {
        async function fetchGameStats() {
            try {
                setStatsError(false);

                const data = await getGameStats();
                setStats(data);
            } catch (error) {
                console.error("Erro ao carregar estatísticas:", error);
                setStatsError(true);
            } finally {
                setIsLoading(false);
            }
        }

        fetchGameStats();
    }, []);

    return (
        <nav className="profile-navbar">

            <div className="profile-navbar__brand">
                GEOGUESS ANGOLA
            </div>

            <div className="profile-navbar__status">

                <div className="profile-navbar__item">
                    <span className="profile-navbar__label">
                        JOGADOR
                    </span>

                    <span className="profile-navbar__value">
                        {user?.username || "—"}
                    </span>
                </div>

                <div className="profile-navbar__item">
                    <span className="profile-navbar__label">
                        PONTUAÇÃO TOTAL
                    </span>

                    <span className="profile-navbar__value">
                        {isLoading ? "..." : stats.total_score}
                    </span>
                </div>

                <div className="profile-navbar__item">
                    <span className="profile-navbar__label">
                        JOGOS
                    </span>

                    <span className="profile-navbar__value">
                        {isLoading ? "..." : stats.games_played}
                    </span>
                </div>

                <div className="profile-navbar__item">
                    <span className="profile-navbar__label">
                        MELHOR PONTUAÇÃO
                    </span>

                    <span className="profile-navbar__value">
                        {isLoading ? "..." : stats.best_score}
                    </span>
                </div>

                <div className="profile-navbar__item">
                    <span className="profile-navbar__label">
                        RONDAS CONCLUÍDAS
                    </span>

                    <span className="profile-navbar__value">
                        {isLoading ? "..." : stats.completed_rounds}
                    </span>
                </div>

                <div className="profile-navbar__item">
                    <span className="profile-navbar__label">
                        MEMBRO DESDE
                    </span>

                    <span className="profile-navbar__value">
                        {createdAt}
                    </span>
                </div>

            </div>

            {statsError && (
                <span className="profile-navbar__error">
                    Não foi possível carregar as estatísticas.
                </span>
            )}

        </nav>
    );
}

export default ProfileNavbar;

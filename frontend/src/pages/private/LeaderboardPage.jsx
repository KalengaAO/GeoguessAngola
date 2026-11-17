import { useFetch } from "../../hooks/useFetch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Trophy } from "lucide-react";

function LeaderboardPage() {
    const { data, isLoading, isError } = useFetch("/game/leaderboard/", {
        queryKey: ["game", "leaderboard"],
        retry: false,
    });
    const entries = data?.results ?? [];

    return (
        <main className="app-page">
            <header className="app-page__heading">
                <div>
                    <span className="app-page__eyebrow">
                        <Trophy size={14} /> Os exploradores em destaque
                    </span>
                    <h1>Classificação</h1>
                    <p>Ranking geral ordenado pela pontuação total no GeoGuess.</p>
                </div>
                <Badge variant="gold">Classificação geral</Badge>
            </header>

            <Card className="leaderboard-card">
                <CardHeader>
                    <CardTitle>Melhores exploradores</CardTitle>
                    <CardDescription>
                        A pontuação considera todas as rondas concluídas em partidas individuais.
                    </CardDescription>
                </CardHeader>
                {isLoading ? (
                    <p className="page-empty-state" role="status">A carregar classificação...</p>
                ) : isError ? (
                    <p className="page-empty-state" role="alert">
                        Não foi possível carregar a classificação. Tenta novamente mais tarde.
                    </p>
                ) : entries.length === 0 ? (
                    <div className="page-empty-state">
                        <h2>A classificação ainda está vazia</h2>
                        <p>Joga uma partida GeoGuess para apareceres aqui.</p>
                    </div>
                ) : (
                    <CardContent className="leaderboard-table-wrap">
                        <table className="leaderboard-table">
                            <thead>
                                <tr>
                                    <th scope="col">Posição</th>
                                    <th scope="col">Explorador</th>
                                    <th scope="col">Pontuação total</th>
                                    <th scope="col">Melhor partida</th>
                                    <th scope="col">Partidas</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entries.map((entry) => (
                                    <tr key={entry.username}>
                                        <td className="leaderboard-table__rank">
                                            {entry.rank === 1 ? "♛ " : ""}{entry.rank}
                                        </td>
                                        <td className="leaderboard-table__player">{entry.username}</td>
                                        <td>{entry.total_score.toLocaleString("pt-PT")}</td>
                                        <td>{entry.best_score.toLocaleString("pt-PT")}</td>
                                        <td>{entry.games_played}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                )}
            </Card>
        </main>
    );
}

export default LeaderboardPage;

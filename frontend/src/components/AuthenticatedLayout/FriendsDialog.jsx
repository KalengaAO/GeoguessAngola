import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, UserRoundPlus, UsersRound, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../hooks/useAuth";
import useActiveMultiplayerRoom from "../../hooks/useActiveMultiplayerRoom";
import { Button } from "../ui/button";
import {
    getFriends,
    searchPlayers,
    sendFriendRequest,
} from "../../services/authService";
import { sendRoomInvitation } from "../../services/multiplayerService";
import { getApiErrorMessage } from "../../utils/apiErrors";
import { socialQueryKeys } from "../../utils/queryKeys";
import "./InviteNotifications.css";

function FriendsDialog() {
    const { user } = useAuth();
    const { roomCode } = useActiveMultiplayerRoom();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [isBusy, setIsBusy] = useState(false);
    const [playerQuery, setPlayerQuery] = useState("");
    const [playerResults, setPlayerResults] = useState([]);
    const [searchedQuery, setSearchedQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [playerSearchError, setPlayerSearchError] = useState(false);
    const dialogRef = useRef(null);
    const friendsQueryKey = socialQueryKeys.friends(user?.username);
    const friendRequestsQueryKey = socialQueryKeys.friendRequests(
        user?.username
    );

    const friendsQuery = useQuery({
        queryKey: friendsQueryKey,
        queryFn: () => getFriends("accepted"),
        enabled: Boolean(isOpen && user?.username),
        refetchOnWindowFocus: true,
        retry: false,
    });
    const friendRequestsQuery = useQuery({
        queryKey: friendRequestsQueryKey,
        queryFn: () => getFriends("pending"),
        enabled: Boolean(isOpen && user?.username),
        refetchOnWindowFocus: true,
        retry: false,
    });

    const friends = friendsQuery.data ?? [];
    const friendRequests = friendRequestsQuery.data ?? [];

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (isOpen && !dialog.open) {
            dialog.showModal();
        } else if (!isOpen && dialog.open) {
            dialog.close();
        }
    }, [isOpen]);

    useEffect(() => {
        const query = playerQuery.trim();
        if (!isOpen || query.length < 2) return undefined;

        let cancelled = false;
        const timeoutId = window.setTimeout(async () => {
            try {
                const results = await searchPlayers(query);
                if (!cancelled) {
                    setPlayerResults(results);
                    setSearchedQuery(query);
                    setPlayerSearchError(false);
                }
            } catch {
                if (!cancelled) {
                    setPlayerResults([]);
                    setSearchedQuery(query);
                    setPlayerSearchError(true);
                }
            } finally {
                if (!cancelled) setIsSearching(false);
            }
        }, 300);

        return () => {
            cancelled = true;
            window.clearTimeout(timeoutId);
        };
    }, [isOpen, playerQuery]);

    async function runAction(action) {
        setIsBusy(true);
        try {
            await action();
            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: friendsQueryKey,
                }),
                queryClient.invalidateQueries({
                    queryKey: friendRequestsQueryKey,
                }),
            ]);
        } catch (error) {
            toast.error(
                getApiErrorMessage(error, "Não foi possível concluir a acção.")
            );
        } finally {
            setIsBusy(false);
        }
    }

    function handleFriendRequest(username) {
        return runAction(async () => {
            await sendFriendRequest(username);
            toast.success(`Pedido enviado para ${username}.`);
        });
    }

    function handleRoomInvitation(username) {
        return runAction(async () => {
            await sendRoomInvitation(roomCode, username);
            toast.success(`Convite de sala enviado para ${username}.`);
        });
    }

    function getRelationship(username) {
        if (friends.some((friend) => friend.username === username)) {
            return "friend";
        }
        return friendRequests.find(
            (request) => request.username === username
        )?.direction;
    }

    function renderPlayerActions(player) {
        const relationship = getRelationship(player.username);

        return (
            <div>
                <Button
                    variant="outline"
                    onClick={() => handleFriendRequest(player.username)}
                    disabled={
                        isBusy ||
                        friendsQuery.isLoading ||
                        friendRequestsQuery.isLoading ||
                        Boolean(relationship)
                    }
                >
                    {relationship === "friend"
                        ? "Amigo"
                        : relationship === "sent"
                          ? "Pedido enviado"
                          : relationship === "received"
                            ? "Pedido recebido"
                            : "Adicionar amigo"}
                </Button>
                {roomCode && relationship === "friend" && (
                    <Button
                        variant="outline"
                        onClick={() =>
                            handleRoomInvitation(player.username)
                        }
                        disabled={isBusy}
                    >
                        Convidar para a sala
                    </Button>
                )}
            </div>
        );
    }

    const query = playerQuery.trim();
    const visiblePlayers = playerResults.filter(
        (player) => player.username !== user?.username
    );
    const hasError = friendsQuery.isError || friendRequestsQuery.isError;

    return (
        <div className="friends-manager">
            <button
                type="button"
                className="friends-manager__trigger"
                aria-label="Amigos"
                aria-haspopup="dialog"
                aria-expanded={isOpen}
                onClick={() => setIsOpen(true)}
            >
                <UsersRound size={19} aria-hidden="true" />
                <span>Amigos</span>
            </button>
            <dialog
                ref={dialogRef}
                className="friends-invites-dialog"
                aria-labelledby="friends-title"
                aria-describedby="friends-description"
                onCancel={() => setIsOpen(false)}
                onClose={() => setIsOpen(false)}
            >
                <header className="friends-invites-dialog__header">
                    <div>
                        <span className="app-page__eyebrow">
                            <UsersRound size={14} /> COMUNIDADE
                        </span>
                        <h2 id="friends-title">Amigos</h2>
                        <p id="friends-description">
                            Pesquisa jogadores, envia pedidos e convida amigos
                            para a tua sala.
                        </p>
                    </div>
                    <button
                        type="button"
                        className="friends-invites-dialog__close"
                        aria-label="Fechar amigos"
                        onClick={() => setIsOpen(false)}
                    >
                        <X size={19} />
                    </button>
                </header>
                <div className="friends-invites-dialog__content">
                    {hasError && (
                        <p className="friends-invites-dialog__error" role="alert">
                            Não foi possível carregar a lista de amigos.
                        </p>
                    )}
                    <section className="friends-invites-dialog__section">
                        <h3>Pesquisar jogadores</h3>
                        <label htmlFor="friends-player-search">
                            Nome de utilizador
                        </label>
                        <div className="friends-manager__search">
                            <Search size={17} aria-hidden="true" />
                            <input
                                id="friends-player-search"
                                value={playerQuery}
                                onChange={(event) => {
                                    const value = event.target.value;
                                    setPlayerQuery(value);
                                    setPlayerResults([]);
                                    setSearchedQuery("");
                                    setPlayerSearchError(false);
                                    setIsSearching(
                                        value.trim().length >= 2
                                    );
                                }}
                                placeholder="Introduz pelo menos 2 caracteres"
                                minLength={2}
                            />
                        </div>
                        {playerSearchError && (
                            <p
                                className="friends-invites-dialog__error"
                                role="alert"
                            >
                                Não foi possível pesquisar jogadores.
                            </p>
                        )}
                        {isSearching && (
                            <p role="status">A pesquisar jogadores...</p>
                        )}
                        {!isSearching &&
                            query.length >= 2 &&
                            searchedQuery === query &&
                            !playerSearchError &&
                            visiblePlayers.length === 0 && (
                                <p>Nenhum jogador encontrado.</p>
                            )}
                        {query.length >= 2 &&
                            visiblePlayers.map((player) => (
                                <div
                                    className="friends-invites-dialog__row"
                                    key={player.username}
                                >
                                    <span>{player.username}</span>
                                    {renderPlayerActions(player)}
                                </div>
                            ))}
                    </section>
                    <section className="friends-invites-dialog__section">
                        <h3>Os teus amigos ({friends.length})</h3>
                        {friendsQuery.isLoading ? (
                            <p role="status">A carregar amigos...</p>
                        ) : friends.length === 0 ? (
                            <p>Ainda não tens amigos adicionados.</p>
                        ) : (
                            friends.map((friend) => (
                                <div
                                    className="friends-invites-dialog__row"
                                    key={friend.username}
                                >
                                    <span>{friend.username}</span>
                                    {roomCode && (
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                handleRoomInvitation(
                                                    friend.username
                                                )
                                            }
                                            disabled={isBusy}
                                        >
                                            <UserRoundPlus
                                                size={16}
                                                aria-hidden="true"
                                            />
                                            Convidar para a sala
                                        </Button>
                                    )}
                                </div>
                            ))
                        )}
                    </section>
                </div>
            </dialog>
        </div>
    );
}

export default FriendsDialog;

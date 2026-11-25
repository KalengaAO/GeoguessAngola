import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../hooks/useAuth";
import useActiveMultiplayerRoom from "../../hooks/useActiveMultiplayerRoom";
import { Button } from "../ui/button";
import {
    getFriends,
    respondToFriendRequest,
} from "../../services/authService";
import {
    getRoomInvitations,
    respondToRoomInvitation,
} from "../../services/multiplayerService";
import { getApiErrorMessage } from "../../utils/apiErrors";
import { socialQueryKeys } from "../../utils/queryKeys";
import "./InviteNotifications.css";

function getReceivedInvitations(friendRequests, roomInvitations) {
    return [
        ...(friendRequests ?? [])
            .filter((request) => request.direction === "received")
            .map((request) => ({
                id: `friend-${request.id}`,
                label: `Novo pedido de amizade de ${request.username}.`,
            })),
        ...(roomInvitations ?? [])
            .filter((invitation) => invitation.direction === "received")
            .map((invitation) => ({
                id: `room-${invitation.id}`,
                label: `${invitation.sender} convidou-te para a sala ${invitation.room_code}.`,
            })),
    ];
}

function InviteNotifications() {
    const { user } = useAuth();
    const { setRoomCode, setIsHost } = useActiveMultiplayerRoom();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [isBusy, setIsBusy] = useState(false);
    const dialogRef = useRef(null);
    const previousInvitationsRef = useRef(null);
    const friendRequestsQueryKey = socialQueryKeys.friendRequests(
        user?.username
    );
    const roomInvitationsQueryKey = socialQueryKeys.roomInvitations(
        user?.username
    );

    const friendRequestsQuery = useQuery({
        queryKey: friendRequestsQueryKey,
        queryFn: () => getFriends("pending"),
        enabled: Boolean(user?.username),
        refetchInterval: 15_000,
        refetchOnWindowFocus: true,
        retry: false,
    });
    const roomInvitationsQuery = useQuery({
        queryKey: roomInvitationsQueryKey,
        queryFn: () => getRoomInvitations("pending"),
        enabled: Boolean(user?.username),
        refetchInterval: 15_000,
        refetchOnWindowFocus: true,
        retry: false,
    });

    const friendRequests = friendRequestsQuery.data ?? [];
    const roomInvitations = roomInvitationsQuery.data ?? [];
    const receivedInvitations = getReceivedInvitations(
        friendRequests,
        roomInvitations
    );

    useEffect(() => {
        if (!friendRequestsQuery.data || !roomInvitationsQuery.data) return;

        const currentInvitations = getReceivedInvitations(
            friendRequestsQuery.data,
            roomInvitationsQuery.data
        );
        if (previousInvitationsRef.current !== null) {
            currentInvitations
                .filter(
                    (invitation) =>
                        !previousInvitationsRef.current.has(invitation.id)
                )
                .forEach((invitation) => toast.info(invitation.label));
        }
        previousInvitationsRef.current = new Set(
            currentInvitations.map((invitation) => invitation.id)
        );
    }, [friendRequestsQuery.data, roomInvitationsQuery.data]);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (isOpen && !dialog.open) {
            dialog.showModal();
        } else if (!isOpen && dialog.open) {
            dialog.close();
        }
    }, [isOpen]);

    async function runAction(action) {
        setIsBusy(true);
        try {
            await action();
            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: friendRequestsQueryKey,
                }),
                queryClient.invalidateQueries({
                    queryKey: roomInvitationsQueryKey,
                }),
                queryClient.invalidateQueries({
                    queryKey: socialQueryKeys.friends(user?.username),
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

    function handleFriendAction(friendshipId, action) {
        return runAction(async () => {
            await respondToFriendRequest(friendshipId, action);
            toast.success(
                action === "accept"
                    ? "Pedido de amizade aceite."
                    : "Pedido de amizade recusado."
            );
        });
    }

    function handleRoomInvitationAction(invitationId, action) {
        return runAction(async () => {
            const invitation = await respondToRoomInvitation(
                invitationId,
                action
            );
            if (action === "accept") {
                setRoomCode(invitation.room_code);
                setIsHost(false);
                setIsOpen(false);
                navigate("/games", {
                    replace: true,
                    state: {
                        openMultiplayer: true,
                        roomCode: invitation.room_code,
                    },
                });
            } else {
                toast.success("Convite de sala recusado.");
            }
        });
    }

    const hasPendingInvitations = receivedInvitations.length > 0;
    const isLoading =
        friendRequestsQuery.isLoading || roomInvitationsQuery.isLoading;
    const hasError =
        friendRequestsQuery.isError || roomInvitationsQuery.isError;

    return (
        <div className="invite-notifications">
            <button
                type="button"
                className="invite-notifications__trigger"
                aria-label={
                    hasPendingInvitations
                        ? `Notificações: ${receivedInvitations.length} convites pendentes`
                        : "Notificações"
                }
                aria-haspopup="dialog"
                aria-expanded={isOpen}
                onClick={() => setIsOpen(true)}
            >
                <Bell size={19} aria-hidden="true" />
                <span>Notificações</span>
                {hasPendingInvitations && (
                    <span
                        className="invite-notifications__badge"
                        aria-hidden="true"
                    >
                        {receivedInvitations.length > 9
                            ? "9+"
                            : receivedInvitations.length}
                    </span>
                )}
            </button>
            <dialog
                ref={dialogRef}
                className="friends-invites-dialog"
                aria-labelledby="notifications-title"
                aria-describedby="notifications-description"
                onCancel={() => setIsOpen(false)}
                onClose={() => setIsOpen(false)}
            >
                <header className="friends-invites-dialog__header">
                    <div>
                        <span className="app-page__eyebrow">
                            <Bell size={14} /> NOTIFICAÇÕES
                        </span>
                        <h2 id="notifications-title">Notificações</h2>
                        <p id="notifications-description">
                            Aceita ou recusa pedidos de amizade e convites de
                            sala.
                        </p>
                    </div>
                    <button
                        type="button"
                        className="friends-invites-dialog__close"
                        aria-label="Fechar notificações"
                        onClick={() => setIsOpen(false)}
                    >
                        <X size={19} />
                    </button>
                </header>
                <div className="friends-invites-dialog__content">
                    {hasError && (
                        <p className="friends-invites-dialog__error" role="alert">
                            Não foi possível carregar as notificações.
                        </p>
                    )}
                    {isLoading ? (
                        <p role="status">A carregar notificações...</p>
                    ) : (
                        <>
                            {friendRequests.some(
                                (request) => request.direction === "received"
                            ) && (
                                <section className="friends-invites-dialog__section">
                                    <h3>Pedidos de amizade</h3>
                                    {friendRequests
                                        .filter(
                                            (request) =>
                                                request.direction === "received"
                                        )
                                        .map((request) => (
                                            <div
                                                className="friends-invites-dialog__row"
                                                key={request.id}
                                            >
                                                <span>
                                                    Pedido de amizade de{" "}
                                                    <strong>
                                                        {request.username}
                                                    </strong>
                                                </span>
                                                <div>
                                                    <Button
                                                        onClick={() =>
                                                            handleFriendAction(
                                                                request.id,
                                                                "accept"
                                                            )
                                                        }
                                                        disabled={isBusy}
                                                    >
                                                        Aceitar
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() =>
                                                            handleFriendAction(
                                                                request.id,
                                                                "reject"
                                                            )
                                                        }
                                                        disabled={isBusy}
                                                    >
                                                        Recusar
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                </section>
                            )}
                            {roomInvitations.some(
                                (invitation) =>
                                    invitation.direction === "received"
                            ) && (
                                <section className="friends-invites-dialog__section">
                                    <h3>Convites de sala</h3>
                                    {roomInvitations
                                        .filter(
                                            (invitation) =>
                                                invitation.direction ===
                                                "received"
                                        )
                                        .map((invitation) => (
                                            <div
                                                className="friends-invites-dialog__row"
                                                key={invitation.id}
                                            >
                                                <span>
                                                    {invitation.sender} convidou-te
                                                    para a sala{" "}
                                                    {invitation.room_code}
                                                </span>
                                                <div>
                                                    <Button
                                                        onClick={() =>
                                                            handleRoomInvitationAction(
                                                                invitation.id,
                                                                "accept"
                                                            )
                                                        }
                                                        disabled={isBusy}
                                                    >
                                                        Entrar
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() =>
                                                            handleRoomInvitationAction(
                                                                invitation.id,
                                                                "decline"
                                                            )
                                                        }
                                                        disabled={isBusy}
                                                    >
                                                        Recusar
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                </section>
                            )}
                            {!hasPendingInvitations && !hasError && (
                                <p>Não tens notificações pendentes.</p>
                            )}
                        </>
                    )}
                </div>
            </dialog>
        </div>
    );
}

export default InviteNotifications;

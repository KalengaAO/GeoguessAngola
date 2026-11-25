export const CURRENT_USER_QUERY_KEY = ["auth", "current-user"];

export const socialQueryKeys = {
    friends: (username) => ["social", "friends", username],
    friendRequests: (username) => ["social", "friend-requests", username],
    roomInvitations: (username) => ["social", "room-invitations", username],
};

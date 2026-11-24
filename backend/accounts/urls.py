from django.urls import path
from .views import (
    AccountDeleteView,
    PasswordChangeView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    PlayerSearchView,
    ProfileView,
    PublicPlayerProfileView,
    RegisterView,
    FriendRequestView,
    FriendActionView,
    FriendListView,
)

urlpatterns = [
    path(
        "register/",
        RegisterView.as_view(),
        name="register",
    ),
    path("profile/", ProfileView.as_view(), name="profile"),
    path("password/change/", PasswordChangeView.as_view(), name="password-change"),
    path("password/reset/", PasswordResetRequestView.as_view(), name="password-reset"),
    path(
        "password/reset/confirm/",
        PasswordResetConfirmView.as_view(),
        name="password-reset-confirm",
    ),
    path("delete/", AccountDeleteView.as_view(), name="account-delete"),
    path("players/", PlayerSearchView.as_view(), name="player-search"),
    path(
        "players/<str:username>/",
        PublicPlayerProfileView.as_view(),
        name="public-player-profile",
    ),
    path("friends/", FriendListView.as_view(), name="friend-list"),
    path(
        "friends/request/<str:username>/",
        FriendRequestView.as_view(),
        name="friend-request",
    ),
    path(
        "friends/<int:friendship_id>/<str:action>/",
        FriendActionView.as_view(),
        name="friend-action",
    ),
]
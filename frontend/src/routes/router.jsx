
import { Navigate, Route, Routes } from "react-router-dom";

import HomePage from "../pages/public/HomePage";
import NotFoundPage from "../pages/public/NotFoundPage";

import AuthenticatedLayout from "../components/AuthenticatedLayout/AuthenticatedLayout";
import GamesPage from "../pages/private/GamesPage";
import LeaderboardPage from "../pages/private/LeaderboardPage";
import SettingsPage from "../pages/private/SettingsPage";
import ProfilePage from "../pages/private/ProfilePage";
import GamePage from "../pages/private/GamePage";
import QuizPage from "../pages/private/QuizPage";
import MultiplayerPage from "../pages/private/MultiplayerPage";

import PrivateRoute from "./PrivateRoute";
import PublicRoute from "./PublicRoute";

function Router() {
    return (
        <Routes>
            {/* Public routes */}
            <Route
                path="/"
                element={
                    <PublicRoute>
                        <HomePage />
                    </PublicRoute>
                }
            />

            <Route
                path="/login"
                element={
                    <PublicRoute>
                        <HomePage />
                    </PublicRoute>
                }
            />

            <Route
                path="/register"
                element={
                    <PublicRoute>
                        <HomePage />
                    </PublicRoute>
                }
            />

            {/* Private routes */}
            <Route element={<PrivateRoute />}>
                <Route element={<AuthenticatedLayout />}>
                    <Route
                        path="/dashboard"
                        element={<Navigate to="/games" replace />}
                    />
                    <Route path="/games" element={<GamesPage />} />
                    <Route path="/leaderboard" element={<LeaderboardPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                </Route>

                <Route path="/game/:sessionId" element={<GamePage />} />
                <Route path="/quiz/:sessionId" element={<QuizPage />} />
                <Route
                    path="/multiplayer/:roomCode"
                    element={<MultiplayerPage />}
                />
            </Route>

            {/* Fallback */}
            <Route
                path="*"
                element={<NotFoundPage />}
            />
        </Routes>
    );
}

export default Router;


import { Route, Routes } from "react-router-dom";

import HomePage from "../pages/public/HomePage";
import NotFoundPage from "../pages/public/NotFoundPage";

import ProfilePage from "../pages/private/ProfilePage";
import GamePage from "../pages/private/GamePage";

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
                <Route
                    path="/profile"
                    element={<ProfilePage />}
                />

                <Route
                    path="/game/:sessionId"
                    element={<GamePage />}
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

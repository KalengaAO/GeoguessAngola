import { Route, Routes } from "react-router-dom";
import HomePage from "../pages/public/HomePage";
import NotFoundPage from "../pages/public/NotFoundPage";
import ProfilePage from "../pages/private/ProfilePage";
import PrivateRoute from "./PrivateRoute";
import PublicRoute from "./PublicRoute";

function Router() {
    return (
        <Routes>
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
            <Route element={<PrivateRoute />}>
                <Route path="/profile" element={<ProfilePage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}

export default Router;

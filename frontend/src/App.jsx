
import { Routes, Route, Navigate } from "react-router-dom";

import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";

import Login from "./components/Auth/Login/Login";
import Register from "./components/Auth/Register/Register";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import Profile from "./components/Profile/Profile";

function App() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <p>A verificar sessão...</p>;
    }

    return (
        <>

            <main>
                <Routes>
                    <Route
                        path="/"
                        element={
                            isAuthenticated
                            ? <Navigate to="/profile" replace />
                            : <div>{/* Página inicial */}</div>
                        }
                    />

                    <Route
                        path="/login"
                        element={
                            isAuthenticated
                            ? <Navigate to="/profile" replace />
                            : <Login />
                        }
                        />

                    <Route
                        path="/register"
                        element={
                            isAuthenticated
                            ? <Navigate to="/profile" replace />
                            : <Register />
                        }
                        />

                    <Route element={<ProtectedRoute />}>
                        <Route
                            path="/profile"
                            element={<Profile />}
                            />
                    </Route>
                </Routes>
            </main>
            {!isAuthenticated && <Header />}
            <Footer />
        </>
    );
}

export default App;

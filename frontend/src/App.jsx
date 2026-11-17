
import Footer from "./components/Footer/Footer";
import Router from "./routes/router";
import { useAuth } from "./hooks/useAuth";

function App() {
    const { isAuthenticated } = useAuth();

    return (
        <>
            <Router />
            {!isAuthenticated && <Footer />}
        </>
    );
}

export default App;

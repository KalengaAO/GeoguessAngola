import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Home from "../../components/Home/Home";
import LoginForm from "../../components/Auth/LoginForm/LoginForm";
import RegisterForm from "../../components/Auth/RegisterForm/RegisterForm";
import "./HomePage.css";

function panelFromPath(pathname) {
    if (pathname === "/login") {
        return "login";
    }

    if (pathname === "/register") {
        return "register";
    }

    return null;
}

function HomePage() {
    const location = useLocation();
    const navigate = useNavigate();
    const authPanelRef = useRef(null);
    const activePanel = panelFromPath(location.pathname);
    const [displayedPanel, setDisplayedPanel] = useState(activePanel);
    const panelToRender = activePanel || displayedPanel;

    useEffect(() => {
        if (!activePanel) {
            return undefined;
        }

        const frame = window.requestAnimationFrame(() => {
            const prefersReducedMotion = window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            ).matches;

            authPanelRef.current?.scrollIntoView({
                behavior: prefersReducedMotion ? "auto" : "smooth",
                block: "start",
            });
        });

        return () => window.cancelAnimationFrame(frame);
    }, [activePanel]);

    function toggleAuthPanel(panel) {
        const nextPanel = activePanel === panel ? null : panel;
        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        setDisplayedPanel(
            nextPanel || (prefersReducedMotion ? null : activePanel)
        );
        navigate(nextPanel ? `/${nextPanel}` : "/", {
            replace: true,
            state: location.state,
        });
    }

    function handleAuthTransitionEnd(event) {
        if (
            event.target === event.currentTarget &&
            event.propertyName === "grid-template-rows" &&
            !activePanel
        ) {
            setDisplayedPanel(null);
        }
    }

    return (
        <main className="home-page">
            <section
                className="home-page__auth"
                id="auth-panel"
                ref={authPanelRef}
                aria-label="Autenticação"
                aria-hidden={!activePanel}
                inert={!activePanel}
                data-open={Boolean(activePanel)}
                onTransitionEnd={handleAuthTransitionEnd}
            >
                {panelToRender && (
                    <div className="home-page__auth-content">
                        {panelToRender === "login" ? (
                            <LoginForm />
                        ) : (
                            <RegisterForm />
                        )}
                    </div>
                )}
            </section>

            <Home
                activeAuthPanel={activePanel}
                onToggleAuth={toggleAuthPanel}
            />
          
        </main>
    );
}

export default HomePage;

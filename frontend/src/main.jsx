import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/AuthProvider";
import App from "./App.jsx";
import queryClient from "./query/queryClient";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </BrowserRouter>
            <Toaster position="top-right" richColors />
        </QueryClientProvider>
    </StrictMode>
);






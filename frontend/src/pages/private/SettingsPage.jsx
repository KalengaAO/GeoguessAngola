import { CalendarDays, ShieldCheck } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import ProfileSidebar from "../../components/Profile/ProfileSidebar/ProfileSidebar";
import { Card } from "../../components/ui/card";

function SettingsPage() {
    const { user } = useAuth();
    const joinedDate = user?.created_at
        ? new Date(user.created_at).toLocaleDateString("pt-PT")
        : "—";

    return (
        <main className="app-page">
            <header className="app-page__heading">
                <div>
                    <span className="app-page__eyebrow">
                        <ShieldCheck size={14} /> A tua conta
                    </span>
                    <h1>Configurações</h1>
                    <p>Gere os teus dados pessoais e a forma como apareces na comunidade.</p>
                </div>
            </header>

            <div className="settings-page__grid">
                <ProfileSidebar />
                <Card className="settings-summary">
                    <h2>Informação da conta</h2>
                    <div className="settings-summary__row">
                        <span>Nome de utilizador</span>
                        <strong>{user?.username || "—"}</strong>
                    </div>
                    <div className="settings-summary__row">
                        <span>Email</span>
                        <strong>{user?.email || "Não definido"}</strong>
                    </div>
                    <div className="settings-summary__row">
                        <span>Estado</span>
                        <strong>Conta activa</strong>
                    </div>
                    <div className="settings-summary__row">
                        <span><CalendarDays size={14} /> Membro desde</span>
                        <strong>{joinedDate}</strong>
                    </div>
                </Card>
            </div>
        </main>
    );
}

export default SettingsPage;

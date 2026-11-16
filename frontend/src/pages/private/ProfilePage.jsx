import ProfileNavbar from "../../components/Profile/ProfileNavbar/ProfileNavbar";
import ProfileSidebar from "../../components/Profile/ProfileSidebar/ProfileSidebar";
import GameShowcase from "../../components/Profile/GameShowcase/GameShowcase";
import "../../components/Profile/Profile.css";

function ProfilePage() {
    return (
        <section className="profile-page">

            <ProfileNavbar />

            <div className="profile-dashboard">

                <main className="profile-dashboard__main">
                    <GameShowcase />
                    {/* GameShowcase, GameModes, PlayerStats e Ranking */}
                </main>

                <aside className="profile-dashboard__sidebar">
                    <ProfileSidebar />
                </aside>

            </div>

        </section>
    );
}

export default ProfilePage;
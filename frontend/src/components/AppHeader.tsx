import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.ts';

const navClass = ({ isActive }: { isActive: boolean }) =>
    `px-2 py-3 underline-offset-4 ${isActive ? 'font-semibold underline' : 'hover:underline'}`;

function AppHeader() {
    const { user, logout } = useAuth();
    return (
        <header className="flex w-full max-w-3xl flex-wrap items-center justify-between gap-x-4">
            <Link to="/play" className="text-2xl font-medium sm:text-3xl">Blackjack</Link>
            <nav aria-label="Main" className="flex items-center gap-1">
                <NavLink to="/play" className={navClass}>Play</NavLink>
                <NavLink to="/leaderboard" className={navClass}>Leaderboard</NavLink>
                {user ? (
                    <button type="button" onClick={logout} className="cursor-pointer px-2 py-3 hover:underline">
                        Log out
                    </button>
                ) : (
                    <NavLink to="/login" className={navClass}>Log in</NavLink>
                )}
            </nav>
        </header>
    );
}

export default AppHeader;

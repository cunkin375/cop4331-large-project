import { useEffect, useState } from 'react';
import { getLeaderboard, type LeaderboardEntry } from '../api/leaderboard.ts';
import AppHeader from '../components/AppHeader.tsx';

const LeaderboardPage = () => {
    const [players, setPlayers] = useState<LeaderboardEntry[] | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        getLeaderboard()
            .then(({ players }) => setPlayers(players))
            .catch((e) => setError(e instanceof Error ? e.message : 'Could not load the leaderboard.'));
    }, []);

    return (
        <div className="flex min-h-svh flex-col items-center gap-6 px-4 pt-2 pb-8">
            <AppHeader />
            <main className="w-full max-w-lg">
                <h1 className="mb-1 text-center text-2xl font-semibold">Leaderboard</h1>
                <p className="mb-6 text-center text-chalk/75">Best score from a completed 10-round attempt.</p>

                {error && <p role="alert" className="text-center font-semibold text-danger">{error}</p>}
                {!error && !players && <p className="text-center">Loading…</p>}
                {players?.length === 0 && <p className="text-center">No completed attempts yet. Be the first!</p>}

                {players && players.length > 0 && (
                    <table className="w-full border-collapse tabular-nums">
                        <thead>
                            <tr className="border-b border-white/30 text-left">
                                <th scope="col" className="py-2 pr-4">Rank</th>
                                <th scope="col" className="py-2 pr-4">Player</th>
                                <th scope="col" className="py-2 text-right">Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {players.map((p) => (
                                <tr key={p.username} className="border-b border-white/10">
                                    <td className="py-3 pr-4">{p.rank}</td>
                                    <td className="py-3 pr-4 break-all">{p.username}</td>
                                    <td className="py-3 text-right">{p.score}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </main>
        </div>
    );
};

export default LeaderboardPage;

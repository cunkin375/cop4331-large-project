import { useEffect, useState } from 'react';
import { getLeaderboard, type LeaderboardEntry } from '../api/leaderboard.ts';
import AppHeader from '../components/AppHeader.tsx';

const LeaderboardPage = () => {
    const [players, setPlayers] = useState<LeaderboardEntry[] | null>(null);
    const [error, setError] = useState('');
    const [query, setQuery] = useState('');
    const [resultQuery, setResultQuery] = useState('');

    useEffect(() => {
        let active = true;
        const load = () => {
            setError('');
            getLeaderboard(query)
                .then(({ players }) => {
                    if (active) { setPlayers(players); setResultQuery(query.trim()); }
                })
                .catch((e) => {
                    if (active) setError(e instanceof Error ? e.message : 'Could not load the leaderboard.');
                });
        };
        if (!query) load();
        const timer = query ? window.setTimeout(load, 250) : undefined;
        return () => { active = false; window.clearTimeout(timer); };
    }, [query]);

    return (
        <div className="flex min-h-svh flex-col items-center gap-6 px-4 pt-2 pb-8">
            <AppHeader />
            <main className="w-full max-w-lg">
                <h1 className="mb-1 text-center text-2xl font-semibold">Leaderboard</h1>
                <p className="mb-6 text-center text-chalk/75">Best score from a completed 10-round attempt.</p>
                <label htmlFor="player-search" className="mb-2 block">Search players</label>
                <input id="player-search" type="search" maxLength={30} value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Enter part of a username"
                    className="mb-4 w-full rounded border border-white/30 bg-black/20 px-3 py-2" />
                <p className="mb-4 text-sm text-chalk/75">Ranks are within the matching results.</p>

                {error && <p role="alert" className="text-center font-semibold text-danger">{error}</p>}
                {!error && !players && <p className="text-center">Loading…</p>}
                {players?.length === 0 && <p className="text-center">{resultQuery ? 'No players match.' : 'No completed attempts yet.'}</p>}

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

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMe, getMyAttempts, type Attempt } from '../api/profile.ts';
import AppHeader from '../components/AppHeader.tsx';
import ChangePasswordForm from '../components/ChangePasswordForm.tsx';
import type { User } from '../types/user.ts';

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

// Wins, ties and losses across the 10 rounds of one attempt.
function tally(attempt: Attempt) {
    const count = { win: 0, tie: 0, loss: 0 };
    for (const round of attempt.rounds) count[round.outcome]++;
    return count;
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex-1 rounded-lg border border-white/15 bg-felt-dark/70 p-4 text-center">
            <p className="text-3xl font-semibold tabular-nums">{value}</p>
            <p className="text-sm text-chalk/75">{label}</p>
        </div>
    );
}

const ProfilePage = () => {
    const [user, setUser] = useState<User | null>(null);
    const [attempts, setAttempts] = useState<Attempt[] | null>(null);
    const [bestScore, setBestScore] = useState(0);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        Promise.all([getMe(), getMyAttempts()])
            .then(([me, mine]) => {
                if (!active) return;
                setUser(me);
                setAttempts(mine.attempts);
                setBestScore(mine.bestScore);
            })
            .catch((e) => {
                if (active) setError(e instanceof Error ? e.message : 'Could not load your stats.');
            });
        return () => { active = false; };
    }, []);

    const average = attempts?.length
        ? (attempts.reduce((sum, attempt) => sum + attempt.score, 0) / attempts.length).toFixed(1)
        : '–';

    return (
        <div className="flex min-h-svh flex-col items-center gap-6 px-4 pt-2 pb-8">
            <AppHeader />
            <main className="w-full max-w-lg">
                <h1 className="mb-6 text-center text-2xl font-semibold">My stats</h1>

                {error && <p role="alert" className="text-center font-semibold text-danger">{error}</p>}
                {!error && !user && <p className="text-center">Loading…</p>}

                {user && attempts && (
                    <>
                        <section aria-label="Account" className="mb-6 rounded-lg border border-white/15 bg-felt-dark/70 p-4">
                            <p className="text-xl font-semibold break-all">{user.username}</p>
                            <p className="break-all text-chalk/75">{user.email}</p>
                        </section>

                        <section aria-label="Totals" className="mb-8 flex gap-3">
                            <Stat label="Best score / 30" value={attempts.length ? String(bestScore) : '–'} />
                            <Stat label="Attempts" value={String(attempts.length)} />
                            <Stat label="Average score" value={average} />
                        </section>

                        <h2 className="mb-3 text-lg font-semibold">Past attempts</h2>
                        {attempts.length === 0 ? (
                            <div className="grid gap-4 text-center">
                                <p>No finished attempts yet. Play all 10 rounds to get a score.</p>
                                <Link to="/play" className="btn btn-primary">Play an attempt</Link>
                            </div>
                        ) : (
                            <table className="w-full border-collapse tabular-nums">
                                <thead>
                                    <tr className="border-b border-white/30 text-left">
                                        <th scope="col" className="py-2 pr-4">Finished</th>
                                        <th scope="col" className="py-2 pr-4">Win · Tie · Loss</th>
                                        <th scope="col" className="py-2 text-right">Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attempts.map((attempt) => {
                                        const count = tally(attempt);
                                        const best = attempt.score === bestScore;
                                        return (
                                            <tr key={attempt._id} className="border-b border-white/10">
                                                <td className="py-3 pr-4">{dateFormat.format(new Date(attempt.completedAt))}</td>
                                                <td className="py-3 pr-4">{count.win} · {count.tie} · {count.loss}</td>
                                                <td className={`py-3 text-right ${best ? 'font-semibold text-gold' : ''}`}>
                                                    {attempt.score}{best && <span className="sr-only"> (best)</span>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}

                        <div className="mt-8">
                            <ChangePasswordForm />
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default ProfilePage;

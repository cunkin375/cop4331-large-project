import { useState, type FormEvent } from 'react';
import { changePassword } from '../api/profile.ts';
import FormField from './FormField.tsx';
import FormMessage from './FormMessage.tsx';

function ChangePasswordForm() {
    const [current, setCurrent] = useState('');
    const [next, setNext] = useState('');
    const [confirm, setConfirm] = useState('');
    const [pending, setPending] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        setError('');
        setSuccess('');
        if (next !== confirm) {
            setError('New passwords do not match.');
            return;
        }
        setPending(true);
        try {
            setSuccess((await changePassword(current, next)).message);
            setCurrent('');
            setNext('');
            setConfirm('');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not change your password.');
        } finally {
            setPending(false);
        }
    }

    return (
        <section aria-labelledby="change-password-heading" className="rounded-lg border border-white/15 bg-felt-dark/70 p-4">
            <h2 id="change-password-heading" className="mb-3 text-lg font-semibold">Change password</h2>
            <form onSubmit={handleSubmit} className="grid gap-4">
                <FormField label="Current password" type="password" autoComplete="current-password" required
                    value={current} onChange={(e) => setCurrent(e.target.value)} />
                <FormField label="New password" type="password" autoComplete="new-password" required
                    minLength={12} maxLength={128} hint="At least 12 characters."
                    value={next} onChange={(e) => setNext(e.target.value)} />
                <FormField label="Confirm new password" type="password" autoComplete="new-password" required
                    value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                <FormMessage error={error} success={success} />
                <button type="submit" className="btn btn-primary" disabled={pending}>
                    {pending ? 'Saving…' : 'Change password'}
                </button>
            </form>
        </section>
    );
}

export default ChangePasswordForm;

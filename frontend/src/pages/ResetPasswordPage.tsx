import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../api/auth.ts';
import AuthLayout from '../components/AuthLayout.tsx';
import FormField from '../components/FormField.tsx';
import FormMessage from '../components/FormMessage.tsx';

// Landing page for the link in the reset email: /reset-password?token=...
const ResetPasswordPage = () => {
    const [params] = useSearchParams();
    const token = params.get('token');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [pending, setPending] = useState(false);
    const [error, setError] = useState(token ? '' : 'This reset link is missing its token.');
    const [done, setDone] = useState(false);

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        if (!token) return;
        if (password !== confirm) {
            setError('Passwords do not match.');
            return;
        }
        setPending(true);
        setError('');
        try {
            await resetPassword(token, password);
            setDone(true);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not reset your password.');
        } finally {
            setPending(false);
        }
    }

    if (done) {
        return (
            <AuthLayout title="Password updated">
                <p className="mb-6 text-center">Your password has been changed. Log in with your new password.</p>
                <Link to="/login" className="btn btn-primary w-full">Go to log in</Link>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout title="Choose a new password">
            <form onSubmit={handleSubmit} className="grid gap-4">
                <FormField label="New password" type="password" autoComplete="new-password" required
                    minLength={12} maxLength={128} hint="At least 12 characters."
                    value={password} onChange={(e) => setPassword(e.target.value)} />
                <FormField label="Confirm new password" type="password" autoComplete="new-password" required
                    value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                <FormMessage error={error} />
                <button type="submit" className="btn btn-primary" disabled={pending || !token}>
                    {pending ? 'Saving…' : 'Update password'}
                </button>
            </form>
        </AuthLayout>
    );
};

export default ResetPasswordPage;

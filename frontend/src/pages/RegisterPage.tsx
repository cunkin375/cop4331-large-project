import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { register } from '../api/auth.ts';
import AuthLayout from '../components/AuthLayout.tsx';
import FormField from '../components/FormField.tsx';
import FormMessage from '../components/FormMessage.tsx';

const RegisterPage = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [pending, setPending] = useState(false);
    const [error, setError] = useState('');
    const [sentTo, setSentTo] = useState('');

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        if (password !== confirm) {
            setError('Passwords do not match.');
            return;
        }
        setPending(true);
        setError('');
        try {
            await register(username, email, password);
            setSentTo(email);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Registration failed.');
        } finally {
            setPending(false);
        }
    }

    // Accounts can't log in until the emailed verification link is opened.
    if (sentTo) {
        return (
            <AuthLayout title="Check your email">
                <p className="mb-6 text-center">
                    We sent a verification link to <strong>{sentTo}</strong>. Open it to activate your account,
                    then log in.
                </p>
                <Link to="/login" className="btn btn-primary w-full">Go to log in</Link>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout title="Create an account">
            <form onSubmit={handleSubmit} className="grid gap-4">
                <FormField label="Username" autoComplete="username" required minLength={3} maxLength={30}
                    pattern="[A-Za-z0-9_]+" hint="3–30 letters, numbers, or underscores."
                    value={username} onChange={(e) => setUsername(e.target.value)} />
                <FormField label="Email" type="email" autoComplete="email" required
                    value={email} onChange={(e) => setEmail(e.target.value)} />
                <FormField label="Password" type="password" autoComplete="new-password" required
                    minLength={12} maxLength={128} hint="At least 12 characters."
                    value={password} onChange={(e) => setPassword(e.target.value)} />
                <FormField label="Confirm password" type="password" autoComplete="new-password" required
                    value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                <FormMessage error={error} />
                <button type="submit" className="btn btn-primary" disabled={pending}>
                    {pending ? 'Creating account…' : 'Create account'}
                </button>
            </form>
            <p className="mt-6 text-center">
                Already have an account? <Link to="/login" className="link">Log in</Link>
            </p>
        </AuthLayout>
    );
};

export default RegisterPage;

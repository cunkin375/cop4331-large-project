import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { resendVerification } from '../api/auth.ts';
import { ApiError } from '../api/client.ts';
import { useAuth } from '../auth/AuthContext.ts';
import AuthLayout from '../components/AuthLayout.tsx';
import FormField from '../components/FormField.tsx';
import FormMessage from '../components/FormMessage.tsx';

const LoginPage = () => {
    const { user, login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as { from?: string } | null)?.from ?? '/play';
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [pending, setPending] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [unverified, setUnverified] = useState(false);

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        setPending(true);
        setError('');
        setSuccess('');
        try {
            await login(identifier, password);
            navigate(from, { replace: true });
        } catch (e) {
            // 403 means the password was right but the email hasn't been verified yet.
            setUnverified(e instanceof ApiError && e.status === 403);
            setError(e instanceof Error ? e.message : 'Login failed.');
        } finally {
            setPending(false);
        }
    }

    async function handleResend() {
        setError('');
        try {
            setSuccess((await resendVerification(identifier.trim())).message);
            setUnverified(false);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not resend the email.');
        }
    }

    if (user) return <Navigate to={from} replace />;

    return (
        <AuthLayout title="Log in">
            <form onSubmit={handleSubmit} className="grid gap-4">
                <FormField label="Username or email" autoComplete="username" autoCapitalize="none"
                    spellCheck={false} required
                    value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
                <FormField label="Password" type="password" autoComplete="current-password" required
                    value={password} onChange={(e) => setPassword(e.target.value)} />
                <FormMessage error={error} success={success} />
                {/* Resending needs the email address, which a username login doesn't give us. */}
                {unverified && (identifier.includes('@') ? (
                    <button type="button" className="link text-left" onClick={handleResend}>
                        Resend verification email
                    </button>
                ) : (
                    <p>Need a new link? Log in with your email to resend it.</p>
                ))}
                <button type="submit" className="btn btn-primary" disabled={pending}>
                    {pending ? 'Logging in…' : 'Log in'}
                </button>
            </form>
            <div className="mt-6 grid gap-2 text-center">
                <Link to="/forgot-password" className="link">Forgot your password?</Link>
                <p>New here? <Link to="/register" className="link">Create an account</Link></p>
            </div>
        </AuthLayout>
    );
};

export default LoginPage;

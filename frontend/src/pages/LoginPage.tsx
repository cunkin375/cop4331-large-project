import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { resendVerification } from '../api/auth.ts';
import { ApiError } from '../api/client.ts';
import { useAuth } from '../auth/AuthContext.ts';
import AuthLayout from '../components/AuthLayout.tsx';
import FormField from '../components/FormField.tsx';
import FormMessage from '../components/FormMessage.tsx';

const LoginPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
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
            await login(email, password);
            navigate('/play');
        } catch (e) {
            // 403 means the account exists but the email hasn't been verified yet.
            setUnverified(e instanceof ApiError && e.status === 403);
            setError(e instanceof Error ? e.message : 'Login failed.');
        } finally {
            setPending(false);
        }
    }

    async function handleResend() {
        setError('');
        try {
            setSuccess((await resendVerification(email)).message);
            setUnverified(false);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not resend the email.');
        }
    }

    return (
        <AuthLayout title="Log in">
            <form onSubmit={handleSubmit} className="grid gap-4">
                <FormField label="Email" type="email" autoComplete="email" required
                    value={email} onChange={(e) => setEmail(e.target.value)} />
                <FormField label="Password" type="password" autoComplete="current-password" required
                    value={password} onChange={(e) => setPassword(e.target.value)} />
                <FormMessage error={error} success={success} />
                {unverified && (
                    <button type="button" className="link text-left" onClick={handleResend}>
                        Resend verification email
                    </button>
                )}
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

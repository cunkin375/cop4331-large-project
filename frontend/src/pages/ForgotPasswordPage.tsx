import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api/auth.ts';
import AuthLayout from '../components/AuthLayout.tsx';
import FormField from '../components/FormField.tsx';
import FormMessage from '../components/FormMessage.tsx';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [pending, setPending] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        setPending(true);
        setError('');
        try {
            await forgotPassword(email);
            // Same message whether or not the account exists, so emails can't be probed.
            setSuccess('If an account uses that email, a reset link is on its way.');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not send the reset email.');
        } finally {
            setPending(false);
        }
    }

    return (
        <AuthLayout title="Reset your password">
            <form onSubmit={handleSubmit} className="grid gap-4">
                <FormField label="Email" type="email" autoComplete="email" required
                    value={email} onChange={(e) => setEmail(e.target.value)} />
                <FormMessage error={error} success={success} />
                <button type="submit" className="btn btn-primary" disabled={pending}>
                    {pending ? 'Sending…' : 'Send reset link'}
                </button>
            </form>
            <p className="mt-6 text-center"><Link to="/login" className="link">Back to log in</Link></p>
        </AuthLayout>
    );
};

export default ForgotPasswordPage;

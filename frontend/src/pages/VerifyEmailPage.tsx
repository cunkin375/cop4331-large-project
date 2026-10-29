import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { verifyEmail } from '../api/auth.ts';
import AuthLayout from '../components/AuthLayout.tsx';
import FormMessage from '../components/FormMessage.tsx';

// Landing page for the link in the verification email: /verify-email?token=...
const VerifyEmailPage = () => {
    const [params] = useSearchParams();
    const token = params.get('token');
    const [error, setError] = useState(token ? '' : 'This verification link is missing its token.');
    const [success, setSuccess] = useState('');
    const sent = useRef(false);

    useEffect(() => {
        // Tokens are single-use, so don't resend when StrictMode re-runs effects.
        if (!token || sent.current) return;
        sent.current = true;
        verifyEmail(token)
            .then(({ message }) => setSuccess(message || 'Your email is verified. You can log in now.'))
            .catch((e) => setError(e instanceof Error ? e.message : 'Verification failed.'));
    }, [token]);

    return (
        <AuthLayout title="Verify email">
            {!error && !success && <p className="text-center">Verifying your email…</p>}
            <FormMessage error={error} success={success} />
            <Link to="/login" className="btn btn-primary mt-4 w-full">Go to log in</Link>
        </AuthLayout>
    );
};

export default VerifyEmailPage;

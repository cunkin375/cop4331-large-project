import type { ReactNode } from 'react';

// Shared frame for the login, register, verify, and password pages.
function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
    return (
        <main className="flex min-h-svh items-center justify-center px-4 py-8">
            <div className="w-full max-w-sm">
                <p className="mb-6 text-center text-3xl font-medium">Blackjack</p>
                <h1 className="mb-6 text-center text-xl font-semibold">{title}</h1>
                {children}
            </div>
        </main>
    );
}

export default AuthLayout;

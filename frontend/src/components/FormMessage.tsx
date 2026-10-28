// Announces form errors and confirmations to screen readers as they appear.
function FormMessage({ error, success }: { error?: string; success?: string }) {
    return (
        <div role="status" aria-live="polite" className="min-h-6 font-semibold">
            {error ? <p className="text-danger">{error}</p> : success && <p>{success}</p>}
        </div>
    );
}

export default FormMessage;

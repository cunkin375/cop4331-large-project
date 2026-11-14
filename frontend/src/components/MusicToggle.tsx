// Turns the table music on or off. The speaker icon shows the current state.
function MusicToggle({ on, onChange }: { on: boolean; onChange: (on: boolean) => void }) {
    return (
        <button type="button" aria-pressed={on} onClick={() => onChange(!on)}
            className="-my-1 inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded px-1 text-chalk/75
                hover:text-chalk">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 5 6 9H3v6h3l5 4z" />
                {on ? (
                    <>
                        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                        <path d="M18.5 5.5a9 9 0 0 1 0 13" />
                    </>
                ) : (
                    <path d="m16 9 5 6m0-6-5 6" />
                )}
            </svg>
            Music
        </button>
    );
}

export default MusicToggle;

const LEGEND = [
    { points: 3, label: 'Win', meaning: 'Beat the dealer, or the dealer busts' },
    { points: 1, label: 'Tie (push)', meaning: 'Same total as the dealer' },
    { points: 0, label: 'Loss', meaning: 'You bust, or the dealer is closer to 21' },
];

// Explains how each round adds to the attempt score.
function PointsLegend() {
    return (
        <section aria-labelledby="points-legend-heading" className="w-full max-w-90 text-left text-sm">
            <h2 id="points-legend-heading" className="mb-1 font-semibold">How points add up</h2>
            <dl className="grid gap-1">
                {LEGEND.map(({ points, label, meaning }) => (
                    <div key={label} className="flex gap-2">
                        <dt className="w-14 shrink-0 font-semibold tabular-nums">+{points} {points === 1 ? 'pt' : 'pts'}</dt>
                        <dd><span className="font-semibold">{label}:</span> {meaning}</dd>
                    </div>
                ))}
            </dl>
        </section>
    );
}

export default PointsLegend;

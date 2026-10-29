import type { Ref } from 'react';
import PlayingCard from './PlayingCard.tsx';

// Decorative stack of face-down cards that every dealt card flies out of.
function Deck({ ref }: { ref: Ref<HTMLDivElement> }) {
    return (
        <div aria-hidden="true" className="relative w-(--deck-w) aspect-[95/130] [--card-w:var(--deck-w)]">
            {[3, 2, 1].map((layer) => (
                <div key={layer} className="absolute inset-0"
                    style={{ transform: `translate(${layer * -2}px, ${layer * -2}px)` }}>
                    <PlayingCard card={null} />
                </div>
            ))}
            <div ref={ref} className="absolute inset-0">
                <PlayingCard card={null} />
            </div>
        </div>
    );
}

export default Deck;

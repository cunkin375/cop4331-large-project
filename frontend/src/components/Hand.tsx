import type { Card } from '../types/game.ts';
import PlayingCard from './PlayingCard.tsx';

interface HandProps {
    title: string;
    cards: (Card | null)[];
    total: number;
    totalLabel: string;
}

function Hand({ title, cards, total, totalLabel }: HandProps) {
    const headingId = `${title.replace(/\W+/g, '-').toLowerCase()}-heading`;
    return (
        <section aria-labelledby={headingId}>
            <h2 id={headingId} className="mb-2 text-xl">{title}</h2>
            {/* Cards overlap on narrow screens so long hands still fit. */}
            <ul className="flex justify-center sm:gap-2.5">
                {cards.map((card, i) => (
                    <li
                        key={card ? `${card.rank}-${card.suit}` : `hidden-${i}`}
                        className="not-first:-ml-[calc(var(--card-w)*0.4)] sm:not-first:ml-0"
                    >
                        <PlayingCard card={card} />
                    </li>
                ))}
            </ul>
            <p className="mt-2 tabular-nums">{totalLabel}: {total}</p>
        </section>
    );
}

export default Hand;

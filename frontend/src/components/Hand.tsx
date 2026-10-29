import type { CSSProperties } from 'react';
import type { CardSlot } from '../game/useDealAnimation.ts';
import TableCard from './TableCard.tsx';

interface HandProps {
    title: string;
    slots: CardSlot[];
    total: number | null; // null hides the total until the animation finishes
    totalLabel: string;
    sweeping: boolean;
    dealId: number;
}

function Hand({ title, slots, total, totalLabel, sweeping, dealId }: HandProps) {
    const headingId = `${title.replace(/\W+/g, '-').toLowerCase()}-heading`;
    return (
        <section aria-labelledby={headingId} className="w-full">
            <h2 id={headingId} className="mb-2 text-xl">{title}</h2>
            {/* Cards overlap just enough for the whole hand to fit (see .hand-card). */}
            <ul className="flex min-h-[calc(var(--card-w)*130/95)] justify-center"
                style={{ '--n': slots.length } as CSSProperties}>
                {/* Keyed by deal and position: a card keeps its element when it flips over, and a new round starts fresh. */}
                {slots.map((slot, i) => (
                    <li key={`${dealId}-${i}`} className="hand-card shrink-0">
                        <TableCard slot={slot} index={i} sweeping={sweeping} />
                    </li>
                ))}
            </ul>
            <p className="mt-2 tabular-nums">{total === null ? ' ' : `${totalLabel}: ${total}`}</p>
        </section>
    );
}

export default Hand;

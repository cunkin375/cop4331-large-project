import { useContext, useEffect, useLayoutEffect, useRef } from 'react';
import {
    FLIGHT_MS, SWEEP_MS, SWEEP_STAGGER_MS, prefersReducedMotion, type CardSlot,
} from '../game/useDealAnimation.ts';
import PlayingCard from './PlayingCard.tsx';
import { TableRefsContext } from './tableRefs.ts';

const SHIFT_MS = 250;

// Offset and scale that move `el` onto `target` (center to center).
function deltaTo(el: HTMLElement, target: HTMLElement) {
    const from = el.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    return {
        dx: to.left + to.width / 2 - (from.left + from.width / 2),
        dy: to.top + to.height / 2 - (from.top + from.height / 2),
        scale: to.width / from.width,
    };
}

// One card on the table. Animations use transform and opacity only (FLIP), so they stay smooth on phones.
function TableCard({ slot, index, sweeping }: { slot: CardSlot; index: number; sweeping: boolean }) {
    const refs = useContext(TableRefsContext);
    const el = useRef<HTMLDivElement>(null);
    const fromDeck = useRef(slot.fromDeck);
    const lastLeft = useRef<number | null>(null);
    const flight = useRef<Animation | null>(null);

    // Fly in from the deck with a slight arc and turn.
    useLayoutEffect(() => {
        const card = el.current;
        const deck = refs?.deck.current;
        if (!card) return;
        lastLeft.current = card.offsetLeft;
        if (!fromDeck.current || !deck || prefersReducedMotion()) return;
        const { dx, dy, scale } = deltaTo(card, deck);
        const lift = Math.min(48, 16 + Math.abs(dx) * 0.1);
        flight.current = card.animate([
            { transform: `translate(${dx}px, ${dy}px) scale(${scale}) rotate(-12deg)` },
            { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - lift}px) scale(${(1 + scale) / 2}) rotate(-5deg)`, offset: 0.5 },
            { transform: 'none' },
        ], { duration: FLIGHT_MS, easing: 'cubic-bezier(0.22, 0.8, 0.3, 1)' });
    }, [refs]);

    // When the hand re-centers around a new card, glide to the new spot instead of jumping.
    useLayoutEffect(() => {
        const card = el.current;
        if (!card) return;
        const left = card.offsetLeft;
        const previous = lastLeft.current;
        lastLeft.current = left;
        if (previous === null || Math.abs(previous - left) < 1 || sweeping || prefersReducedMotion()) return;
        if (flight.current?.playState === 'running') return;
        card.animate([{ transform: `translateX(${previous - left}px)` }, { transform: 'none' }],
            { duration: SHIFT_MS, easing: 'ease-out' });
    });

    // Clear the table: slide toward the discard spot and fade out.
    useEffect(() => {
        const card = el.current;
        const discard = refs?.discard.current;
        if (!sweeping || !card || !discard || prefersReducedMotion()) return;
        const { dx, dy, scale } = deltaTo(card, discard);
        card.animate([
            { transform: 'none', opacity: 1 },
            { transform: `translate(${dx}px, ${dy}px) scale(${scale}) rotate(8deg)`, opacity: 0 },
        ], { duration: SWEEP_MS, delay: index * SWEEP_STAGGER_MS, easing: 'ease-in', fill: 'forwards' });
    }, [sweeping, refs, index]);

    // Both faces stay mounted so the hole card can flip in place (rotateY) when it's revealed.
    return (
        <div ref={el} className="relative w-(--card-w) aspect-[95/130] perspective-[800px]">
            <div className={`relative size-full transition-transform duration-450 ease-out transform-3d
                motion-reduce:transition-none ${slot.faceUp ? '' : 'rotate-y-180'}`}>
                {slot.card && (
                    <div className="absolute inset-0 backface-hidden">
                        <PlayingCard card={slot.card} />
                    </div>
                )}
                <div aria-hidden={slot.faceUp} className="absolute inset-0 rotate-y-180 backface-hidden">
                    <PlayingCard card={null} />
                </div>
            </div>
        </div>
    );
}

export default TableCard;

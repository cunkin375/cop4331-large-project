import type { Card, Rank } from '../types/game.ts';

const RANK_NAMES: Record<Rank, string> = {
    A: 'ace', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven',
    8: 'eight', 9: 'nine', 10: 'ten', J: 'jack', Q: 'queen', K: 'king',
};

// Matches the 95x130 ace and number card images.
const CARD_SIZE = 'block w-(--card-w) aspect-[95/130] rounded-[7%/5%] shadow-md shadow-black/40';
const FACE_RANKS: Rank[] = ['J', 'Q', 'K'];

// card === null renders the face-down hole card.
function PlayingCard({ card }: { card: Card | null }) {
    if (!card) {
        return (
            <div
                role="img"
                aria-label="Face-down card"
                className={`${CARD_SIZE} border-4 border-white bg-card-back
                    bg-[repeating-linear-gradient(45deg,rgb(255_255_255/0.18)_0_3px,transparent_3px_9px)]`}
            />
        );
    }
    const label = `${RANK_NAMES[card.rank]} of ${card.suit}`;
    const image = (
        <img
            className={FACE_RANKS.includes(card.rank) ? 'size-full select-none object-contain' : `${CARD_SIZE} select-none`}
            src={`/cards/${RANK_NAMES[card.rank]}_of_${card.suit}.png`}
            alt={label.charAt(0).toUpperCase() + label.slice(1)}
            draggable={false}
        />
    );
    // Ace and number images include their own border. Face card art is
    // borderless, so give it a white margin that keeps the corner index off the edge.
    if (!FACE_RANKS.includes(card.rank)) return image;
    return (
        <div className={`${CARD_SIZE} bg-white px-[calc(var(--card-w)*0.04)] py-[calc(var(--card-w)*0.05)] ring-1 ring-black/15`}>
            {image}
        </div>
    );
}

export default PlayingCard;

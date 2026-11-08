import { createContext } from 'react';

// Where cards fly from (the deck) and where cleared cards go (the discard spot).
// Functions rather than refs, because the page shows a different deck on phones and desktop.
export interface TableRefs {
    deck: () => HTMLElement | null;
    discard: () => HTMLElement | null;
}

export const TableRefsContext = createContext<TableRefs | null>(null);

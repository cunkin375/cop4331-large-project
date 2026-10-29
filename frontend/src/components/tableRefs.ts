import { createContext, type RefObject } from 'react';

// Where cards fly from (the deck) and where cleared cards go (the discard spot).
export interface TableRefs {
    deck: RefObject<HTMLDivElement | null>;
    discard: RefObject<HTMLDivElement | null>;
}

export const TableRefsContext = createContext<TableRefs | null>(null);

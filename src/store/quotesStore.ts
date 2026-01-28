import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Quote, QuoteItem, QuoteService } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface QuotesStore {
  quotes: Quote[];
  nextNumber: number;
  addQuote: (quote: Omit<Quote, 'id' | 'number' | 'createdAt' | 'updatedAt'>) => Quote;
  updateQuote: (id: string, data: Partial<Quote>) => void;
  deleteQuote: (id: string) => void;
  getQuoteById: (id: string) => Quote | undefined;
}

export const useQuotesStore = create<QuotesStore>()(
  persist(
    (set, get) => ({
      quotes: [],
      nextNumber: 1,
      addQuote: (quoteData) => {
        const now = new Date().toISOString();
        const newQuote: Quote = {
          ...quoteData,
          id: uuidv4(),
          number: get().nextNumber,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          quotes: [newQuote, ...state.quotes],
          nextNumber: state.nextNumber + 1,
        }));
        return newQuote;
      },
      updateQuote: (id, data) =>
        set((state) => ({
          quotes: state.quotes.map((q) =>
            q.id === id ? { ...q, ...data, updatedAt: new Date().toISOString() } : q
          ),
        })),
      deleteQuote: (id) =>
        set((state) => ({
          quotes: state.quotes.filter((q) => q.id !== id),
        })),
      getQuoteById: (id) => get().quotes.find((q) => q.id === id),
    }),
    {
      name: 'orcamento-quotes',
    }
  )
);

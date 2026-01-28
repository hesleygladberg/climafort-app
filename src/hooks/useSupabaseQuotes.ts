import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QuotesService } from '@/services/quotesService';
import { Quote } from '@/types';

export function useQuotes() {
    return useQuery({
        queryKey: ['quotes'],
        queryFn: QuotesService.getAll,
    });
}

export function useQuote(id: string) {
    return useQuery({
        queryKey: ['quotes', id],
        queryFn: () => QuotesService.getById(id),
        enabled: !!id,
    });
}

export function useCreateQuote() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: QuotesService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
        },
    });
}

export function useDeleteQuote() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: QuotesService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
        },
    });
}

export function useUpdateQuote() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Quote> }) =>
            QuotesService.update(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
            queryClient.invalidateQueries({ queryKey: ['quotes', variables.id] });
        },
    });
}

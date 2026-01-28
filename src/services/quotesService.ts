import { supabase } from '@/lib/supabase';
import { Quote, QuoteItem, QuoteService, QuoteStatus } from '@/types';

export const QuotesService = {
    async getAll(): Promise<Quote[]> {
        const { data: quotes, error } = await supabase
            .from('quotes')
            .select(`
        *,
        items:quote_items(*)
      `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching quotes:', error);
            throw error;
        }

        return quotes.map(mapSupabaseToQuote);
    },

    async getById(id: string): Promise<Quote | undefined> {
        const { data: quote, error } = await supabase
            .from('quotes')
            .select(`
        *,
        items:quote_items(*)
      `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching quote:', error);
            return undefined;
        }

        return mapSupabaseToQuote(quote);
    },

    async create(quote: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>): Promise<Quote> {
        // 1. Insert Quote
        const { data: newQuote, error: quoteError } = await supabase
            .from('quotes')
            .insert({
                // number: quote.number, // let Supabase handle SERIAL
                client_id: quote.clientId || null, // Optional connection
                client_info: {
                    name: quote.clientName,
                    phone: quote.clientPhone,
                    address: quote.clientAddress,
                    // ... other client fields
                },
                status: quote.status,
                total: quote.total,
                notes: quote.internalNotes
            })
            .select()
            .single();

        if (quoteError) throw quoteError;

        // 2. Insert Items (Mixed types: material/service)
        // We map frontend 'items' and 'services' to single 'quote_items' table
        const dbItems = [
            ...quote.items.map(i => ({
                quote_id: newQuote.id,
                description: i.name,
                quantity: i.quantity,
                unit_price: i.unitPrice,
                total: i.total,
                type: 'material',
                metadata: {
                    unit: i.unit,
                    isCopperTube: i.isCopperTube,
                    copperWeightPerMeter: i.copperWeightPerMeter
                }
            })),
            ...quote.services.map(s => ({
                quote_id: newQuote.id,
                description: s.name,
                quantity: s.quantity,
                unit_price: s.unitPrice,
                total: s.price,
                type: 'service',
                metadata: {}
            }))
        ];

        if (dbItems.length > 0) {
            const { error: itemsError } = await supabase
                .from('quote_items')
                .insert(dbItems);

            if (itemsError) throw itemsError;
        }

        // Refetch to get complete object
        return QuotesService.getById(newQuote.id) as Promise<Quote>;
    },

    async update(id: string, quote: Partial<Quote>) {
        // For MVP, we might just update main fields.
        // Full update logic requires diffing items or delete-and-insert.
        // Implementing basic status update for now.
        const { error } = await supabase
            .from('quotes')
            .update({
                status: quote.status,
                total: quote.total,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) throw error;
    },

    async delete(id: string) {
        const { error } = await supabase.from('quotes').delete().eq('id', id);
        if (error) throw error;
    }
};

// Helper: Map DB structure to Frontend Type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSupabaseToQuote(dbQuote: any): Quote {
    // Extract items vs services from flattened 'items' array
    const allItems = dbQuote.items || [];

    const materials: QuoteItem[] = allItems
        .filter((i: any) => i.type === 'material')
        .map((i: any) => ({
            id: i.id,
            name: i.description,
            quantity: Number(i.quantity),
            unitPrice: Number(i.unit_price),
            total: Number(i.total),
            unit: i.metadata?.unit || 'un',
            materialId: 'legacy', // Default
            ...i.metadata
        }));

    const services: QuoteService[] = allItems
        .filter((i: any) => i.type === 'service')
        .map((i: any) => ({
            id: i.id,
            name: i.description,
            quantity: Number(i.quantity),
            unitPrice: Number(i.unit_price),
            price: Number(i.total),
            serviceId: 'legacy'
        }));

    return {
        id: dbQuote.id,
        number: dbQuote.number,
        version: 1, // Default
        status: dbQuote.status as QuoteStatus,
        clientName: dbQuote.client_info?.name || '',
        clientPhone: dbQuote.client_info?.phone || '',
        clientAddress: dbQuote.client_info?.address || '',
        items: materials,
        services: services,
        total: Number(dbQuote.total),
        internalNotes: dbQuote.notes || '',
        createdAt: dbQuote.created_at,
        updatedAt: dbQuote.updated_at,
        // Defaults for missing columns in lightweight schema
        discount: 0,
        discountType: 'fixed',
        subtotalMaterials: 0,
        subtotalServices: 0,
        clientNotes: '',
        validityDays: 15,
        paymentConditions: ''
    };
}

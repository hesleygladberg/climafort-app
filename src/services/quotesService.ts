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
                client_id: quote.clientId || null,
                client_info: {
                    name: quote.clientName,
                    phone: quote.clientPhone,
                    address: quote.clientAddress,
                },
                status: quote.status,
                total: quote.total,
                notes: quote.internalNotes,
                // New Phase 2 columns
                discount: quote.discount,
                discount_type: quote.discountType,
                subtotal_materials: quote.subtotalMaterials,
                subtotal_services: quote.subtotalServices,
                client_notes: quote.clientNotes,
                validity_days: quote.validityDays,
                payment_conditions: quote.paymentConditions
            })
            .select()
            .single();

        if (quoteError) throw quoteError;

        // 2. Insert Items
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
                    materialId: i.materialId,
                    isCopperTube: i.isCopperTube,
                    copperSize: i.copperSize,
                    copperWeightPerMeter: i.copperWeightPerMeter,
                    copperTotalWeight: i.copperTotalWeight,
                    copperPricePerKg: i.copperPricePerKg
                }
            })),
            ...quote.services.map(s => ({
                quote_id: newQuote.id,
                description: s.name,
                quantity: s.quantity,
                unit_price: s.unitPrice,
                total: s.price,
                type: 'service',
                metadata: {
                    serviceId: s.serviceId
                }
            }))
        ];

        if (dbItems.length > 0) {
            const { error: itemsError } = await supabase
                .from('quote_items')
                .insert(dbItems);

            if (itemsError) throw itemsError;
        }

        return QuotesService.getById(newQuote.id) as Promise<Quote>;
    },

    async update(id: string, quote: Partial<Quote>) {
        // 1. Update main record
        const updatePayload: any = {
            updated_at: new Date().toISOString()
        };

        if (quote.status) updatePayload.status = quote.status;
        if (quote.total !== undefined) updatePayload.total = quote.total;
        if (quote.clientName) {
            updatePayload.client_info = {
                name: quote.clientName,
                phone: quote.clientPhone,
                address: quote.clientAddress
            };
        }
        if (quote.discount !== undefined) updatePayload.discount = quote.discount;
        if (quote.discountType !== undefined) updatePayload.discount_type = quote.discountType;
        if (quote.subtotalMaterials !== undefined) updatePayload.subtotal_materials = quote.subtotalMaterials;
        if (quote.subtotalServices !== undefined) updatePayload.subtotal_services = quote.subtotalServices;
        if (quote.clientNotes !== undefined) updatePayload.client_notes = quote.clientNotes;
        if (quote.validityDays !== undefined) updatePayload.validity_days = quote.validityDays;
        if (quote.paymentConditions !== undefined) updatePayload.payment_conditions = quote.paymentConditions;

        const { error } = await supabase
            .from('quotes')
            .update(updatePayload)
            .eq('id', id);

        if (error) throw error;

        // 2. Update items (Simple atomic replacement for MVP)
        if (quote.items || quote.services) {
            // Fetch current items to preserve them if only one array is provided
            const currentQuote = await QuotesService.getById(id);
            if (!currentQuote) return;

            const finalMaterials = quote.items || currentQuote.items;
            const finalServices = quote.services || currentQuote.services;

            // Delete existing
            await supabase.from('quote_items').delete().eq('quote_id', id);

            // Re-insert
            const dbItems = [
                ...finalMaterials.map(i => ({
                    quote_id: id,
                    description: i.name,
                    quantity: i.quantity,
                    unit_price: i.unitPrice,
                    total: i.total,
                    type: 'material',
                    metadata: {
                        unit: i.unit,
                        materialId: i.materialId,
                        isCopperTube: i.isCopperTube,
                        copperSize: i.copperSize,
                        copperWeightPerMeter: i.copperWeightPerMeter,
                        copperTotalWeight: i.copperTotalWeight,
                        copperPricePerKg: i.copperPricePerKg
                    }
                })),
                ...finalServices.map(s => ({
                    quote_id: id,
                    description: s.name,
                    quantity: s.quantity,
                    unit_price: s.unitPrice,
                    total: s.price,
                    type: 'service',
                    metadata: {
                        serviceId: s.serviceId
                    }
                }))
            ];

            if (dbItems.length > 0) {
                const { error: itemsError } = await supabase
                    .from('quote_items')
                    .insert(dbItems);
                if (itemsError) throw itemsError;
            }
        }
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
        // Phase 2 columns from DB
        discount: Number(dbQuote.discount) || 0,
        discountType: dbQuote.discount_type || 'fixed',
        subtotalMaterials: Number(dbQuote.subtotal_materials) || 0,
        subtotalServices: Number(dbQuote.subtotal_services) || 0,
        clientNotes: dbQuote.client_notes || '',
        validityDays: Number(dbQuote.validity_days) || 15,
        paymentConditions: dbQuote.payment_conditions || ''
    };
}

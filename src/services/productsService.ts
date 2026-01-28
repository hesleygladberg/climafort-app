import { supabase } from '@/lib/supabase';
import { Material, Service } from '@/types';

// Shared interface for DB Product
export interface DbProduct {
    id: string;
    name: string;
    description?: string;
    price: number;
    unit: string;
    category: string;
    type: 'product' | 'service';
    created_at?: string;
}

export const ProductsService = {
    async getAll(): Promise<DbProduct[]> {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('name');

        if (error) throw error;
        return data || [];
    },

    async create(product: Omit<DbProduct, 'id' | 'created_at'>): Promise<DbProduct> {
        const { data, error } = await supabase
            .from('products')
            .insert(product)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id: string, updates: Partial<DbProduct>): Promise<DbProduct> {
        const { data, error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Helper to bulk insert defaults if table is empty
    async seed(products: Omit<DbProduct, 'id' | 'created_at'>[]): Promise<DbProduct[]> {
        const { count } = await supabase.from('products').select('*', { count: 'exact', head: true });

        if (count === 0) {
            console.log('Seeding products...');
            const { data, error } = await supabase
                .from('products')
                .insert(products)
                .select();

            if (error) {
                console.error('Error seeding products:', error);
                throw error;
            }
            return data || [];
        }
        return [];
    }
};

import { supabase } from '@/lib/supabase';
import { Company } from '@/types';

export const CompanyService = {
    async getSettings(): Promise<Company | null> {
        const { data, error } = await supabase
            .from('company_settings')
            .select('*')
            .single();

        if (error) {
            // PGRST116 means no rows found (not really an error, just new user)
            if (error.code === 'PGRST116') return null;
            console.error('Error fetching company settings:', error);
            return null;
        }

        // Map DB columns to Company type
        return {
            id: data.id,
            name: data.name || '',
            document: data.document || '',
            phone: data.phone || '',
            address: data.address || '',
            logo: data.logo || '',
            footerText: data.footer_text || '',
            copperPricePerKg: Number(data.copper_price_per_kg) || 75.00
        };
    },

    async saveSettings(settings: Omit<Company, 'id'>): Promise<Company> {
        // We strive for one row per user.
        // Upsert based on user_id check via RLS or checking existence.
        // Since we enabled RLS 'insert with check (auth.uid() = user_id)', we can just insert/update.
        // However, the ID might not be known if we don't have it.
        // Best strategy: Get current user, try update, if fail insert?
        // Or just use `upsert` on a unique constraint. We added `unique(user_id)`.

        // Get current user to ensure we attach it even if RLS fills it (good practice)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const dbPayload = {
            user_id: user.id,
            name: settings.name,
            document: settings.document,
            phone: settings.phone,
            address: settings.address,
            logo: settings.logo,
            footer_text: settings.footerText,
            copper_price_per_kg: settings.copperPricePerKg
        };

        const { data, error } = await supabase
            .from('company_settings')
            .upsert(dbPayload, { onConflict: 'user_id' })
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            name: data.name || '',
            document: data.document || '',
            phone: data.phone || '',
            address: data.address || '',
            logo: data.logo || '',
            footerText: data.footer_text || '',
            copperPricePerKg: Number(data.copper_price_per_kg)
        };
    }
};

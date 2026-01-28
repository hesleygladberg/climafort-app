import { create } from 'zustand';
import { Company } from '@/types';
import { CompanyService } from '@/services/companyService';
import { v4 as uuidv4 } from 'uuid';

interface CompanyStore {
  company: Company;
  isLoading: boolean;
  fetchCompany: () => Promise<void>;
  updateCompany: (data: Partial<Company>) => Promise<void>;
}

const defaultCompany: Company = {
  id: uuidv4(),
  name: '',
  document: '',
  phone: '',
  address: '',
  logo: '',
  footerText: 'Garantia de 90 dias para serviços executados. Orçamento válido por 15 dias.',
  copperPricePerKg: 75,
};

export const useCompanyStore = create<CompanyStore>((set, get) => ({
  company: defaultCompany,
  isLoading: false,

  fetchCompany: async () => {
    set({ isLoading: true });
    try {
      const settings = await CompanyService.getSettings();
      if (settings) {
        set({ company: settings });
      }
    } catch (error) {
      console.error('Failed to fetch company settings:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  updateCompany: async (data) => {
    // Optimistic update
    const newSettings = { ...get().company, ...data };
    set({ company: newSettings });

    try {
      await CompanyService.saveSettings(newSettings);
    } catch (error) {
      console.error('Failed to save company settings:', error);
      throw error; // Propagate to UI
    }
  },
}));

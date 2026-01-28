import { create } from 'zustand';
import { Service } from '@/types';
import { ProductsService, DbProduct } from '@/services/productsService';
import { v4 as uuidv4 } from 'uuid';

interface ServicesStore {
  services: Service[];
  isLoading: boolean;
  fetchServices: () => Promise<void>;
  addService: (service: Omit<Service, 'id'>) => Promise<void>;
  updateService: (id: string, data: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
}

const defaultServices: Omit<DbProduct, 'id' | 'created_at'>[] = [
  // Instalação
  { name: 'Instalação Split 9.000 BTUs', unit: 'un', price: 350, category: 'Instalação', type: 'service' },
  { name: 'Instalação Split 12.000 BTUs', unit: 'un', price: 400, category: 'Instalação', type: 'service' },
  { name: 'Instalação Split 18.000 BTUs', unit: 'un', price: 500, category: 'Instalação', type: 'service' },
  { name: 'Instalação Split 24.000 BTUs', unit: 'un', price: 600, category: 'Instalação', type: 'service' },

  // Limpeza
  { name: 'Limpeza Completa (Evap + Cond)', unit: 'un', price: 180, category: 'Limpeza', type: 'service' },

  // Consertos
  { name: 'Manutenção Preventiva', unit: 'un', price: 150, category: 'Consertos', type: 'service' },
  { name: 'Carga de Gás', unit: 'un', price: 120, category: 'Consertos', type: 'service' },
  { name: 'Diagnóstico/Visita Técnica', unit: 'un', price: 80, category: 'Consertos', type: 'service' },
  { name: 'Desinstalação', unit: 'un', price: 150, category: 'Consertos', type: 'service' },
];

export const useServicesStore = create<ServicesStore>((set) => ({
  services: [],
  isLoading: false,

  fetchServices: async () => {
    set({ isLoading: true });
    try {
      let dbProducts = await ProductsService.getAll();
      const servicesOnly = dbProducts.filter(p => p.type === 'service');

      // Auto-Seed if empty
      if (servicesOnly.length === 0) {
        console.log('Seeding default services...');
        await ProductsService.seed(defaultServices);
        // Refetch after seed
        dbProducts = await ProductsService.getAll();
      }

      set({
        services: dbProducts
          .filter(p => p.type === 'service')
          .map(p => ({
            id: p.id,
            name: p.name,
            cost: 0, // Not persisted
            price: p.price,
            category: p.category
          }))
      });
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addService: async (service) => {
    try {
      const newProduct = await ProductsService.create({
        name: service.name,
        unit: 'un', // Service default unit
        price: service.price,
        category: service.category || 'Outros',
        type: 'service'
      });

      set(state => ({
        services: [...state.services, {
          id: newProduct.id,
          name: newProduct.name,
          cost: 0,
          price: newProduct.price,
          category: newProduct.category
        }]
      }));
    } catch (error) {
      console.error('Failed to add service:', error);
      throw error;
    }
  },

  updateService: async (id, data) => {
    // Optimistic update
    set(state => ({
      services: state.services.map(s => s.id === id ? { ...s, ...data } : s)
    }));

    try {
      await ProductsService.update(id, {
        name: data.name,
        price: data.price,
        category: data.category
      });
    } catch (error) {
      console.error('Failed to update service:', error);
    }
  },

  deleteService: async (id) => {
    // Optimistic delete
    set(state => ({
      services: state.services.filter(s => s.id !== id)
    }));

    try {
      await ProductsService.delete(id);
    } catch (error) {
      console.error('Failed to delete service:', error);
    }
  }
}));

import { create } from 'zustand';
import { Material } from '@/types';
import { ProductsService, DbProduct } from '@/services/productsService';
import { v4 as uuidv4 } from 'uuid';

interface MaterialsStore {
  materials: Material[];
  isLoading: boolean;
  fetchMaterials: () => Promise<void>;
  addMaterial: (material: Omit<Material, 'id'>) => Promise<void>;
  updateMaterial: (id: string, data: Partial<Material>) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
}

const defaultMaterials: Omit<DbProduct, 'id' | 'created_at'>[] = [
  // Outros
  { name: 'Gás R-410A (kg)', unit: 'kg', price: 150, category: 'Outros', type: 'product' },
  { name: 'Gás R-22 (kg)', unit: 'kg', price: 120, category: 'Outros', type: 'product' },

  // Tubulação e tubo isolante
  { name: 'Tubo de Cobre 1/4"', unit: 'm', price: 45, category: 'Tubulação e tubo isolante', type: 'product' },
  { name: 'Tubo de Cobre 3/8"', unit: 'm', price: 60, category: 'Tubulação e tubo isolante', type: 'product' },
  { name: 'Tubo de Cobre 1/2"', unit: 'm', price: 80, category: 'Tubulação e tubo isolante', type: 'product' },
  { name: 'Tubo de Cobre 5/8"', unit: 'm', price: 100, category: 'Tubulação e tubo isolante', type: 'product' },
  { name: 'Tubo de Cobre 3/4"', unit: 'm', price: 130, category: 'Tubulação e tubo isolante', type: 'product' },
  { name: 'Isolamento Térmico', unit: 'm', price: 7, category: 'Tubulação e tubo isolante', type: 'product' },

  // Cabos elétricos
  { name: 'Cabo PP 3x1.5mm', unit: 'm', price: 12, category: 'Cabos elétricos', type: 'product' },

  // Suportes e fitas
  { name: 'Suporte para Condensadora', unit: 'un', price: 90, category: 'Suportes e fitas', type: 'product' },
  { name: 'Dreno Corrugado', unit: 'm', price: 8, category: 'Suportes e fitas', type: 'product' },
];

export const useMaterialsStore = create<MaterialsStore>((set, get) => ({
  materials: [],
  isLoading: false,

  fetchMaterials: async () => {
    set({ isLoading: true });
    try {
      let dbProducts = await ProductsService.getAll();
      const materialsOnly = dbProducts.filter(p => p.type === 'product');

      // Auto-Seed if empty
      if (materialsOnly.length === 0) {
        console.log('Seeding default materials...');
        await ProductsService.seed(defaultMaterials);
        // Refetch after seed
        dbProducts = await ProductsService.getAll();
      }

      set({
        materials: dbProducts
          .filter(p => p.type === 'product')
          .map(p => ({
            id: p.id,
            name: p.name,
            unit: p.unit,
            price: p.price,
            category: p.category,
            cost: 0 // Not persisted yet
          }))
      });
    } catch (error) {
      console.error('Failed to fetch materials:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addMaterial: async (material) => {
    try {
      const newProduct = await ProductsService.create({
        name: material.name,
        unit: material.unit,
        price: material.price,
        category: material.category || 'Outros',
        type: 'product'
      });

      set(state => ({
        materials: [...state.materials, {
          id: newProduct.id,
          name: newProduct.name,
          unit: newProduct.unit,
          price: newProduct.price,
          category: newProduct.category,
          cost: 0
        }]
      }));
    } catch (error) {
      console.error('Failed to add material:', error);
      throw error;
    }
  },

  updateMaterial: async (id, data) => {
    // Optimistic update
    set(state => ({
      materials: state.materials.map(m => m.id === id ? { ...m, ...data } : m)
    }));

    try {
      await ProductsService.update(id, {
        name: data.name,
        unit: data.unit,
        price: data.price,
        category: data.category
      });
    } catch (error) {
      console.error('Failed to update material:', error);
      // Revert if needed (omitted for simplicity for now)
    }
  },

  deleteMaterial: async (id) => {
    // Optimistic delete
    set(state => ({
      materials: state.materials.filter(m => m.id !== id)
    }));

    try {
      await ProductsService.delete(id);
    } catch (error) {
      console.error('Failed to delete material:', error);
    }
  }
}));

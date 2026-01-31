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
  { name: 'Gás R-410A (kg)', unit: 'kg', price: 150, cost: 0, category: 'Outros', type: 'product' },
  { name: 'Gás R-22 (kg)', unit: 'kg', price: 120, cost: 0, category: 'Outros', type: 'product' },

  // Tubulações
  { name: 'Tubo de Cobre 1/4"', unit: 'm', price: 45, cost: 0, category: 'Tubulações', type: 'product' },
  { name: 'Tubo de Cobre 3/8"', unit: 'm', price: 60, cost: 0, category: 'Tubulações', type: 'product' },
  { name: 'Tubo de Cobre 1/2"', unit: 'm', price: 80, cost: 0, category: 'Tubulações', type: 'product' },
  { name: 'Tubo de Cobre 5/8"', unit: 'm', price: 100, cost: 0, category: 'Tubulações', type: 'product' },
  { name: 'Tubo de Cobre 3/4"', unit: 'm', price: 130, cost: 0, category: 'Tubulações', type: 'product' },

  // Esponjoso e fitas
  { name: 'Isolamento Térmico', unit: 'm', price: 7, cost: 0, category: 'Esponjoso e fitas', type: 'product' },
  { name: 'Fita Vinyl', unit: 'un', price: 15, cost: 0, category: 'Esponjoso e fitas', type: 'product' },

  // Cabos elétricos
  { name: 'Cabo PP 3x1.5mm', unit: 'm', price: 12, cost: 0, category: 'Cabos elétricos', type: 'product' },

  // Suportes e fitas -> Esponjoso e fitas (migrating default items)
  { name: 'Suporte para Condensadora', unit: 'un', price: 90, cost: 0, category: 'Esponjoso e fitas', type: 'product' },
  { name: 'Dreno Corrugado', unit: 'm', price: 8, cost: 0, category: 'Esponjoso e fitas', type: 'product' },
];

export const useMaterialsStore = create<MaterialsStore>((set, get) => ({
  materials: [],
  isLoading: false,

  fetchMaterials: async () => {
    set({ isLoading: true });
    try {
      let dbProducts = await ProductsService.getAll();
      let materialsOnly = dbProducts.filter(p => p.type === 'product');

      // Auto-Seed if empty
      if (materialsOnly.length === 0) {
        console.log('Seeding default materials...');
        await ProductsService.seed(defaultMaterials);
        // Refetch after seed
        dbProducts = await ProductsService.getAll();
        materialsOnly = dbProducts.filter(p => p.type === 'product');
      }

      // Migration: Update categories to new ones
      let needsMigration = false;
      const migratedMaterials = materialsOnly.map(p => {
        let newCategory = p.category;
        if (p.category === 'Tubulação e tubo isolante') {
          // Detect if it's a tube or insulation
          const lowerName = p.name.toLowerCase();
          if (lowerName.includes('tubo') || lowerName.includes('cobre')) {
            newCategory = 'Tubulações';
          } else {
            newCategory = 'Esponjoso e fitas';
          }
        } else if (p.category === 'Suportes e fitas') {
          newCategory = 'Esponjoso e fitas';
        }

        if (newCategory !== p.category) {
          needsMigration = true;
          // We don't update DB here to avoid too many writes during fetch,
          // but we map it locally. User can save it later or we can do it background.
          return { ...p, category: newCategory };
        }
        return p;
      });

      // If we migrated something, let's update the DB in background for each
      if (needsMigration) {
        migratedMaterials.forEach(async (p) => {
          const original = materialsOnly.find(o => o.id === p.id);
          if (original && original.category !== p.category) {
            try {
              await ProductsService.update(p.id, { category: p.category });
            } catch (err) {
              console.error(`Failed to migrate category for ${p.name}`, err);
            }
          }
        });
      }

      set({
        materials: migratedMaterials
          .map(p => ({
            id: p.id,
            name: p.name,
            unit: p.unit,
            price: p.price,
            category: p.category,
            cost: Number(p.cost) || 0
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
        cost: material.cost,
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
          cost: Number(newProduct.cost) || 0
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
        cost: data.cost,
        category: data.category
      });
    } catch (error) {
      console.error('Failed to update material:', error);
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

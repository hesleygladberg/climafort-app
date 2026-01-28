export interface Company {
  id: string;
  name: string;
  document: string;
  phone: string;
  address: string;
  logo: string;
  footerText: string;
  copperPricePerKg: number; // Preço do kg do cobre
}

export interface Material {
  id: string;
  name: string;
  unit: string;
  cost: number;
  price: number;
  category?: string;
}

export interface Service {
  id: string;
  name: string;
  cost: number;
  price: number;
  category?: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  addresses: string[];
  internalNotes: string;
  createdAt: string;
}

export interface QuoteItem {
  id: string;
  materialId: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
  // Campos específicos para cálculo de cobre
  isCopperTube?: boolean;
  copperSize?: string;
  copperWeightPerMeter?: number;
  copperTotalWeight?: number;
  copperPricePerKg?: number;
}

export interface QuoteService {
  id: string;
  serviceId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  price: number; // total = unitPrice * quantity
}

export type QuoteStatus = 'draft' | 'sent' | 'approved' | 'cancelled';

export interface Quote {
  id: string;
  number: number;
  version: number;
  status: QuoteStatus;
  clientId?: string;
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  items: QuoteItem[];
  services: QuoteService[];
  discount: number;
  discountType: 'fixed' | 'percentage';
  subtotalMaterials: number;
  subtotalServices: number;
  total: number;
  internalNotes: string;
  clientNotes: string;
  validityDays: number;
  paymentConditions: string;
  createdAt: string;
  updatedAt: string;
}

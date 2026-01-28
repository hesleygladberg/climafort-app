// Tabela de peso por metro (kg/m) para tubos de cobre
export const COPPER_TUBE_WEIGHTS: Record<string, number> = {
  '1/4': 0.198,
  '1/4"': 0.198,
  '1/4\'': 0.198,
  '3/8': 0.308,
  '3/8"': 0.308,
  '3/8\'': 0.308,
  '1/2': 0.454,
  '1/2"': 0.454,
  '1/2\'': 0.454,
  '5/8': 0.620,
  '5/8"': 0.620,
  '5/8\'': 0.620,
  '3/4': 0.830,
  '3/4"': 0.830,
  '3/4\'': 0.830,
};

// Lista de bitolas disponíveis para seleção
export const COPPER_TUBE_SIZES = [
  { value: '1/4"', label: '1/4"', weightPerMeter: 0.198 },
  { value: '3/8"', label: '3/8"', weightPerMeter: 0.308 },
  { value: '1/2"', label: '1/2"', weightPerMeter: 0.454 },
  { value: '5/8"', label: '5/8"', weightPerMeter: 0.620 },
  { value: '3/4"', label: '3/4"', weightPerMeter: 0.830 },
];

/**
 * Detecta se o nome do material é um tubo de cobre e extrai a bitola
 */
export function detectCopperTube(materialName: string): { isCopperTube: boolean; size: string | null; weightPerMeter: number | null } {
  const lowerName = materialName.toLowerCase();
  
  // Verifica se é tubo de cobre
  if (!lowerName.includes('tubo') || !lowerName.includes('cobre')) {
    return { isCopperTube: false, size: null, weightPerMeter: null };
  }
  
  // Procura pela bitola no nome
  for (const [size, weight] of Object.entries(COPPER_TUBE_WEIGHTS)) {
    if (materialName.includes(size)) {
      return { isCopperTube: true, size, weightPerMeter: weight };
    }
  }
  
  return { isCopperTube: false, size: null, weightPerMeter: null };
}

/**
 * Calcula o preço do tubo de cobre baseado no peso
 */
export function calculateCopperPrice(
  meters: number, 
  weightPerMeter: number, 
  pricePerKg: number
): { totalWeight: number; totalPrice: number } {
  const totalWeight = meters * weightPerMeter;
  const totalPrice = totalWeight * pricePerKg;
  
  return {
    totalWeight: Math.round(totalWeight * 1000) / 1000, // 3 casas decimais
    totalPrice: Math.round(totalPrice * 100) / 100, // 2 casas decimais
  };
}

/**
 * Formata o peso para exibição
 */
export function formatWeight(kg: number): string {
  return `${kg.toFixed(3)} kg`;
}

import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { EmptyState } from '@/components/EmptyState';
import { useMaterialsStore } from '@/store/materialsStore';
import { useCompanyStore } from '@/store/companyStore';
import { Material } from '@/types';
import { Package, Pencil, Trash2, X, Check, Scale, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { detectCopperTube, calculateCopperPrice } from '@/lib/copperCalculator';

export default function Materials() {
  const { materials, addMaterial, updateMaterial, deleteMaterial } = useMaterialsStore();
  const { company } = useCompanyStore();
  const copperPricePerKg = company.copperPricePerKg || 75;
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Omit<Material, 'id'>>({
    name: '',
    unit: 'un',
    cost: 0,
    price: 0,
    category: 'Outros',
  });

  const handleSubmit = () => {
    if (!formData.name.trim()) return;

    if (isEditing) {
      updateMaterial(isEditing, formData);
      setIsEditing(null);
    } else {
      addMaterial(formData);
    }

    setFormData({ name: '', unit: 'un', cost: 0, price: 0, category: 'Outros' });
    setShowForm(false);
  };

  const handleEdit = (material: Material) => {
    setFormData({
      name: material.name,
      unit: material.unit,
      cost: material.cost,
      price: material.price,
      category: material.category || 'Outros',
    });
    setIsEditing(material.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setFormData({ name: '', unit: 'un', cost: 0, price: 0 });
    setIsEditing(null);
    setShowForm(false);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const calcMargin = (cost: number, price: number) => {
    if (cost === 0) return 0;
    return ((price - cost) / cost * 100).toFixed(0);
  };

  return (
    <Layout title="Materiais" showBack>
      <div className="p-4">
        {/* Form */}
        {showForm && (
          <div className="bg-card rounded-lg border border-border p-4 mb-4 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">
                {isEditing ? 'Editar Material' : 'Novo Material'}
              </h3>
              <button
                onClick={handleCancel}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Nome</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Gás R-410A"
                  className="w-full h-12 px-4 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Categoria</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full h-12 px-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="Tubulação e tubo isolante">Tubulação e tubo isolante</option>
                    <option value="Cabos elétricos">Cabos elétricos</option>
                    <option value="Suportes e fitas">Suportes e fitas</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Unidade</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full h-12 px-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="un">un</option>
                    <option value="m">m</option>
                    <option value="kg">kg</option>
                    <option value="cx">cx</option>
                    <option value="pc">pc</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Custo</label>
                  <input
                    type="number"
                    value={formData.cost || ''}
                    onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                    placeholder="0,00"
                    className="w-full h-12 px-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Preço</label>
                  <input
                    type="number"
                    value={formData.price || ''}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    placeholder="0,00"
                    className="w-full h-12 px-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!formData.name.trim()}
                className="w-full h-12 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                {isEditing ? 'Salvar' : 'Adicionar'}
              </button>
            </div>
          </div>
        )}

        {/* Materials List */}
        {materials.length === 0 ? (
          <EmptyState
            icon={<Package className="w-8 h-8 text-muted-foreground" />}
            title="Nenhum material"
            description="Adicione materiais para usar nos seus orçamentos."
          />
        ) : (
          <div className="space-y-2">
            {materials.map((material) => {
              const copperInfo = detectCopperTube(material.name);
              const displayPrice = copperInfo.isCopperTube && copperInfo.weightPerMeter
                ? calculateCopperPrice(1, copperInfo.weightPerMeter, copperPricePerKg).totalPrice
                : material.price;

              return (
                <div
                  key={material.id}
                  className={cn(
                    "bg-card rounded-lg border p-4 flex items-center justify-between gap-3",
                    copperInfo.isCopperTube ? "border-warning/50" : "border-border"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-foreground truncate">{material.name}</h4>
                      <span className="text-2xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {material.unit}
                      </span>
                      {copperInfo.isCopperTube && (
                        <span className="text-2xs text-warning bg-warning/10 px-2 py-0.5 rounded flex items-center gap-1">
                          <Scale className="w-3 h-3" />
                          Auto
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {copperInfo.isCopperTube && copperInfo.weightPerMeter ? (
                        <>
                          <span className="text-xs text-warning">
                            {copperInfo.weightPerMeter} kg/m × R$ {copperPricePerKg}/kg
                          </span>
                          <span className="text-sm font-medium text-warning">
                            = {formatCurrency(displayPrice)}/m
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-sm text-muted-foreground">
                            Custo: {formatCurrency(material.cost)}
                          </span>
                          <span className="text-sm font-medium text-foreground">
                            Venda: {formatCurrency(displayPrice)}
                          </span>
                          <span className="text-2xs text-success font-medium">
                            +{calcMargin(material.cost, displayPrice)}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {copperInfo.isCopperTube ? (
                      <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-muted/50 text-muted-foreground cursor-help" title="Item gerenciado automaticamente pelo sistema">
                        <Lock className="w-4 h-4" />
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(material)}
                          className="p-2 rounded-lg hover:bg-muted transition-colors"
                          title="Editar material"
                        >
                          <Pencil className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => deleteMaterial(material.id)}
                          className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                          title="Excluir material"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!showForm && (
        <FloatingActionButton onClick={() => setShowForm(true)} />
      )}
    </Layout>
  );
}

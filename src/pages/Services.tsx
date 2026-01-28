import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { EmptyState } from '@/components/EmptyState';
import { useServicesStore } from '@/store/servicesStore';
import { Service } from '@/types';
import { Wrench, Pencil, Trash2, X, Check } from 'lucide-react';

export default function Services() {
  const { services, addService, updateService, deleteService } = useServicesStore();
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Omit<Service, 'id'>>({
    name: '',
    cost: 0,
    price: 0,
    category: 'Outros',
  });

  const handleSubmit = () => {
    if (!formData.name.trim()) return;

    if (isEditing) {
      updateService(isEditing, formData);
      setIsEditing(null);
    } else {
      addService(formData);
    }

    setFormData({ name: '', cost: 0, price: 0, category: 'Outros' });
    setShowForm(false);
  };

  const handleEdit = (service: Service) => {
    setFormData({
      name: service.name,
      cost: service.cost,
      price: service.price,
      category: service.category || 'Outros',
    });
    setIsEditing(service.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setFormData({ name: '', cost: 0, price: 0, category: 'Outros' });
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
    <Layout title="Serviços" showBack>
      <div className="p-4">
        {/* Form */}
        {showForm && (
          <div className="bg-card rounded-lg border border-border p-4 mb-4 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">
                {isEditing ? 'Editar Serviço' : 'Novo Serviço'}
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
                <label className="text-sm font-medium text-foreground mb-1.5 block">Nome do Serviço</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Instalação Split 12.000 BTUs"
                  className="w-full h-12 px-4 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Categoria</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full h-12 px-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="Instalação">Instalação</option>
                  <option value="Limpeza">Limpeza</option>
                  <option value="Consertos">Consertos</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Custo</label>
                  <input
                    type="number"
                    value={formData.cost || ''}
                    onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                    placeholder="0,00"
                    className="w-full h-12 px-4 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Preço</label>
                  <input
                    type="number"
                    value={formData.price || ''}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    placeholder="0,00"
                    className="w-full h-12 px-4 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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

        {/* Services List */}
        {services.length === 0 ? (
          <EmptyState
            icon={<Wrench className="w-8 h-8 text-muted-foreground" />}
            title="Nenhum serviço"
            description="Adicione serviços para usar nos seus orçamentos."
          />
        ) : (
          <div className="space-y-2">
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-card rounded-lg border border-border p-4 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-foreground truncate">{service.name}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-muted-foreground">
                      Custo: {formatCurrency(service.cost)}
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      Venda: {formatCurrency(service.price)}
                    </span>
                    <span className="text-2xs text-success font-medium">
                      +{calcMargin(service.cost, service.price)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(service)}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => deleteService(service.id)}
                    className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!showForm && (
        <FloatingActionButton onClick={() => setShowForm(true)} />
      )}
    </Layout>
  );
}

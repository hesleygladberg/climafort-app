import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useMaterialsStore } from '@/store/materialsStore';
import { useServicesStore } from '@/store/servicesStore';
import { useCreateQuote, useUpdateQuote, useQuote } from '@/hooks/useSupabaseQuotes';
import { useCompanyStore } from '@/store/companyStore';
import { QuoteItem, QuoteService, QuoteStatus } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import {
  User, MapPin, Package, Wrench, Calculator,
  Plus, Minus, Trash2, Check, ChevronRight,
  Percent, DollarSign, Scale, PlusCircle,
  FileEdit, Send, CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { detectCopperTube, calculateCopperPrice, formatWeight } from '@/lib/copperCalculator';
import { AddCustomItemDialog } from '@/components/AddCustomItemDialog';

type Step = 'client' | 'materials' | 'services' | 'review';

const steps: { key: Step; label: string; icon: React.ElementType }[] = [
  { key: 'client', label: 'Cliente', icon: User },
  { key: 'materials', label: 'Materiais', icon: Package },
  { key: 'services', label: 'Serviços', icon: Wrench },
  { key: 'review', label: 'Resumo', icon: Calculator },
];

export default function NewQuote() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { materials } = useMaterialsStore();
  const { services } = useServicesStore();
  const createQuote = useCreateQuote();
  const updateQuote = useUpdateQuote();
  const { data: existingQuote, isLoading } = useQuote(id || '');

  const { company } = useCompanyStore();
  const isEditMode = Boolean(id);

  const [currentStep, setCurrentStep] = useState<Step>('client');
  const [status, setStatus] = useState<QuoteStatus>('draft');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [quoteServices, setQuoteServices] = useState<QuoteService[]>([]);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [clientNotes, setClientNotes] = useState('');
  const [validityDays, setValidityDays] = useState(15);
  const [paymentConditions, setPaymentConditions] = useState('À vista ou em até 3x no cartão');

  // Dialogs para itens personalizados
  const [showCustomMaterialDialog, setShowCustomMaterialDialog] = useState(false);
  const [showCustomServiceDialog, setShowCustomServiceDialog] = useState(false);

  // Carrega dados do orçamento existente quando em modo de edição
  useEffect(() => {
    if (existingQuote) {
      setStatus(existingQuote.status);
      setClientName(existingQuote.clientName);
      setClientPhone(existingQuote.clientPhone);
      setClientAddress(existingQuote.clientAddress);
      setQuoteItems(existingQuote.items);
      setQuoteServices(existingQuote.services);
      setDiscount(existingQuote.discountType === 'percentage'
        ? (existingQuote.discount / (existingQuote.subtotalMaterials + existingQuote.subtotalServices)) * 100
        : existingQuote.discount);
      setDiscountType(existingQuote.discountType);
      setClientNotes(existingQuote.clientNotes);
      setValidityDays(existingQuote.validityDays);
      setPaymentConditions(existingQuote.paymentConditions);
    }
  }, [existingQuote]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const subtotalMaterials = quoteItems.reduce((sum, item) => sum + item.total, 0);
  const subtotalServices = quoteServices.reduce((sum, s) => sum + s.price, 0);
  const subtotal = subtotalMaterials + subtotalServices;
  const discountValue = discountType === 'percentage'
    ? (subtotal * discount / 100)
    : discount;
  const total = subtotal - discountValue;

  const addMaterialToQuote = (material: typeof materials[0]) => {
    const existing = quoteItems.find(i => i.materialId === material.id);
    const copperInfo = detectCopperTube(material.name);
    const copperPricePerKg = company.copperPricePerKg || 75;

    if (existing) {
      const newQuantity = existing.quantity + 1;
      let newTotal = newQuantity * existing.unitPrice;
      let copperTotalWeight = existing.copperTotalWeight;

      // Recalcula se for tubo de cobre
      if (copperInfo.isCopperTube && copperInfo.weightPerMeter) {
        const copperCalc = calculateCopperPrice(newQuantity, copperInfo.weightPerMeter, copperPricePerKg);
        newTotal = copperCalc.totalPrice;
        copperTotalWeight = copperCalc.totalWeight;
      }

      setQuoteItems(items =>
        items.map(i =>
          i.materialId === material.id
            ? {
              ...i,
              quantity: newQuantity,
              total: newTotal,
              copperTotalWeight,
            }
            : i
        )
      );
    } else {
      let unitPrice = material.price;
      let total = material.price;
      let copperTotalWeight: number | undefined;

      // Calcula preço automático se for tubo de cobre
      if (copperInfo.isCopperTube && copperInfo.weightPerMeter) {
        const copperCalc = calculateCopperPrice(1, copperInfo.weightPerMeter, copperPricePerKg);
        unitPrice = copperCalc.totalPrice;
        total = copperCalc.totalPrice;
        copperTotalWeight = copperCalc.totalWeight;
      }

      setQuoteItems([...quoteItems, {
        id: uuidv4(),
        materialId: material.id,
        name: material.name,
        unit: material.unit,
        quantity: 1,
        unitPrice,
        total,
        isCopperTube: copperInfo.isCopperTube,
        copperSize: copperInfo.size || undefined,
        copperWeightPerMeter: copperInfo.weightPerMeter || undefined,
        copperTotalWeight,
        copperPricePerKg: copperInfo.isCopperTube ? copperPricePerKg : undefined,
      }]);
    }
  };

  const updateItemQuantity = (id: string, delta: number) => {
    setQuoteItems(items =>
      items.map(i => {
        if (i.id === id) {
          const newQty = Math.max(0, i.quantity + delta);
          if (newQty === 0) return i;

          let newTotal = newQty * i.unitPrice;
          let copperTotalWeight = i.copperTotalWeight;

          // Recalcula se for tubo de cobre
          if (i.isCopperTube && i.copperWeightPerMeter && i.copperPricePerKg) {
            const copperCalc = calculateCopperPrice(newQty, i.copperWeightPerMeter, i.copperPricePerKg);
            newTotal = copperCalc.totalPrice;
            copperTotalWeight = copperCalc.totalWeight;
          }

          return { ...i, quantity: newQty, total: newTotal, copperTotalWeight };
        }
        return i;
      }).filter(i => i.quantity > 0)
    );
  };

  const removeItem = (id: string) => {
    setQuoteItems(items => items.filter(i => i.id !== id));
  };

  const addCustomMaterial = (item: { name: string; unit: string; price: number }) => {
    const customId = `custom-${uuidv4()}`;
    setQuoteItems([...quoteItems, {
      id: uuidv4(),
      materialId: customId,
      name: item.name,
      unit: item.unit,
      quantity: 1,
      unitPrice: item.price,
      total: item.price,
    }]);
    toast.success('Material personalizado adicionado!');
  };

  const addCustomService = (item: { name: string; unit: string; price: number }) => {
    const customId = `custom-${uuidv4()}`;
    setQuoteServices([...quoteServices, {
      id: uuidv4(),
      serviceId: customId,
      name: item.name,
      unitPrice: item.price,
      quantity: 1,
      price: item.price,
    }]);
    toast.success('Serviço personalizado adicionado!');
  };

  const addServiceToQuote = (service: typeof services[0]) => {
    const existing = quoteServices.find(s => s.serviceId === service.id);
    if (existing) {
      setQuoteServices(list =>
        list.map(s =>
          s.serviceId === service.id
            ? { ...s, quantity: s.quantity + 1, price: (s.quantity + 1) * s.unitPrice }
            : s
        )
      );
    } else {
      setQuoteServices([...quoteServices, {
        id: uuidv4(),
        serviceId: service.id,
        name: service.name,
        unitPrice: service.price,
        quantity: 1,
        price: service.price,
      }]);
    }
  };

  const updateServiceQuantity = (id: string, delta: number) => {
    setQuoteServices(list =>
      list.map(s => {
        if (s.id === id) {
          const newQty = Math.max(0, s.quantity + delta);
          if (newQty === 0) return s;
          return { ...s, quantity: newQty, price: newQty * s.unitPrice };
        }
        return s;
      }).filter(s => s.quantity > 0)
    );
  };

  const removeService = (id: string) => {
    setQuoteServices(list => list.filter(s => s.id !== id));
  };

  const handleNext = () => {
    const currentIndex = steps.findIndex(s => s.key === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].key);
    }
  };

  const handlePrev = () => {
    const currentIndex = steps.findIndex(s => s.key === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].key);
    }
  };

  const handleSave = () => {
    // Validation
    if (!clientName.trim()) {
      toast.error('Informe o nome do cliente');
      document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
      setCurrentStep('client');
      return;
    }

    if (quoteItems.length === 0 && quoteServices.length === 0) {
      toast.error('Adicione pelo menos um material ou serviço');
      return;
    }

    if (isEditMode && existingQuote && id) {
      updateQuote.mutate({
        id,
        data: {
          status,
          clientName,
          clientPhone,
          clientAddress,
          items: quoteItems,
          services: quoteServices,
          discount: discountValue,
          discountType,
          subtotalMaterials,
          subtotalServices,
          total,
          clientNotes,
          validityDays,
          paymentConditions,
        }
      }, {
        onSuccess: () => {
          toast.success('Orçamento atualizado!');
          navigate(`/quote/${existingQuote.id}`);
        },
        onError: () => {
          toast.error('Erro ao atualizar orçamento');
        }
      });
    } else {
      createQuote.mutate({
        number: 0, // Backend logic will handle serial if needed, or we pass existing nextNumber logic. For now letting DB handle ID.
        // Actually, schema expects number. In Supabase we set number to SERIAL.
        // But Typescript expects it. We can pass 0 or handle it in service.
        version: 1,
        status,
        clientName,
        clientPhone,
        clientAddress,
        items: quoteItems,
        services: quoteServices,
        discount: discountValue,
        discountType,
        subtotalMaterials,
        subtotalServices,
        total,
        internalNotes: '',
        clientNotes,
        validityDays,
        paymentConditions,
      }, {
        onSuccess: (newQuote) => {
          toast.success('Orçamento criado!');
          navigate(`/quote/${newQuote.id}`);
        },
        onError: (error) => {
          console.error('Erro detalhado:', error);
          toast.error(`Erro ao criar orçamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
      });
    }
  };

  const currentStepIndex = steps.findIndex(s => s.key === currentStep);

  useEffect(() => {
    // Scroll the main container to top, as it's the scrollable element
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'instant' });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentStep]);

  return (
    <Layout title={isEditMode ? `Editar #${String(existingQuote?.number).padStart(4, '0')}` : "Novo Orçamento"} showBack>
      {/* Progress Steps */}
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          {steps.map((step, index) => {
            const isActive = step.key === currentStep;
            const isCompleted = index < currentStepIndex;
            return (
              <button
                key={step.key}
                onClick={() => setCurrentStep(step.key)}
                className={cn(
                  "flex flex-col items-center gap-1 flex-1 transition-colors",
                  isActive ? "text-primary" : isCompleted ? "text-success" : "text-muted-foreground"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                  isActive ? "bg-primary text-primary-foreground" :
                    isCompleted ? "bg-success text-success-foreground" : "bg-muted"
                )}>
                  {isCompleted ? <Check className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
                </div>
                <span className="text-2xs font-medium">{step.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 pt-12 pb-24">
        {/* Client Step */}
        {currentStep === 'client' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-card rounded-lg border border-border p-4">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Dados do Cliente
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Nome</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Nome do cliente"
                    className="w-full h-12 px-4 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Telefone</label>
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full h-12 px-4 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Endereço da Obra</label>
                  <input
                    type="text"
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                    placeholder="Rua, número, bairro"
                    className="w-full h-12 px-4 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Materials Step */}
        {currentStep === 'materials' && (
          <div className="space-y-4 animate-fade-in">
            {/* Selected Materials */}
            {quoteItems.length > 0 && (
              <div className="bg-card rounded-lg border border-border p-4">
                <h4 className="font-medium text-foreground mb-3">Materiais Selecionados</h4>
                <div className="space-y-3">
                  {quoteItems.map((item) => (
                    <div key={item.id} className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground line-clamp-2">{item.name}</p>
                          {item.isCopperTube ? (
                            <div className="flex items-center gap-1 text-xs text-warning">
                              <Scale className="w-3 h-3" />
                              <span>{formatWeight(item.copperTotalWeight || 0)} × R$ {item.copperPricePerKg}/kg</span>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(item.unitPrice)} / {item.unit}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateItemQuantity(item.id, -1)}
                            className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center active:scale-95 transition-transform"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-medium text-foreground">{item.quantity}</span>
                          <button
                            onClick={() => updateItemQuantity(item.id, 1)}
                            className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center active:scale-95 transition-transform"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="w-10 h-10 rounded-lg hover:bg-destructive/10 flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <span className="text-sm font-semibold text-primary">{formatCurrency(item.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-border flex justify-between">
                  <span className="text-sm text-muted-foreground">Subtotal Materiais</span>
                  <span className="font-semibold text-foreground">{formatCurrency(subtotalMaterials)}</span>
                </div>
              </div>
            )}

            {/* Available Materials */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-foreground">Adicionar Material</h4>
                <button
                  onClick={() => setShowCustomMaterialDialog(true)}
                  className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Personalizado</span>
                </button>
              </div>
              <div className="space-y-6">
                {(() => {
                  const groupedMaterials = materials.reduce((acc, material) => {
                    const category = material.category || 'Outros';
                    if (!acc[category]) acc[category] = [];
                    acc[category].push(material);
                    return acc;
                  }, {} as Record<string, typeof materials>);

                  const ORDERED_CATEGORIES = [
                    'Tubulações',
                    'Esponjoso e fitas',
                    'Cabos elétricos',
                    'Outros'
                  ];

                  // Get any categories in groupedMaterials that aren't in ORDERED_CATEGORIES (just in case)
                  const otherCategories = Object.keys(groupedMaterials).filter(
                    cat => !ORDERED_CATEGORIES.includes(cat)
                  );

                  const categoriesToShow = [...ORDERED_CATEGORIES, ...otherCategories].filter(
                    cat => groupedMaterials[cat] && groupedMaterials[cat].length > 0
                  );

                  return categoriesToShow.map((category) => (
                    <div key={category} className="space-y-2">
                      <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">{category}</h5>
                      <div className="grid grid-cols-2 gap-2">
                        {groupedMaterials[category].map((material) => {
                          // ... rest of item rendering code

                          const inQuote = quoteItems.find(i => i.materialId === material.id);
                          const copperInfo = detectCopperTube(material.name);

                          return (
                            <button
                              key={material.id}
                              onClick={() => addMaterialToQuote(material)}
                              className={cn(
                                "text-left p-3 rounded-lg border transition-all active:scale-[0.98]",
                                inQuote
                                  ? "bg-primary/10 border-primary"
                                  : "bg-card border-border hover:border-primary/50"
                              )}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <p className="text-sm font-medium text-foreground line-clamp-2 flex-1">{material.name}</p>
                                {copperInfo.isCopperTube && (
                                  <Scale className="w-3.5 h-3.5 text-warning shrink-0" />
                                )}
                              </div>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-xs text-muted-foreground">{material.unit}</span>
                                {copperInfo.isCopperTube ? (
                                  <span className="text-2xs text-warning font-medium">Cálculo auto</span>
                                ) : (
                                  <span className="text-sm font-semibold text-primary">{formatCurrency(material.price)}</span>
                                )}
                              </div>
                              {inQuote && (
                                <span className="text-2xs text-primary font-medium">x{inQuote.quantity}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Services Step */}
        {currentStep === 'services' && (
          <div className="space-y-4 animate-fade-in">
            {/* Selected Services */}
            {quoteServices.length > 0 && (
              <div className="bg-card rounded-lg border border-border p-4">
                <h4 className="font-medium text-foreground mb-3">Serviços Selecionados</h4>
                <div className="space-y-3">
                  {quoteServices.map((service) => (
                    <div key={service.id} className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground line-clamp-2">{service.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(service.unitPrice)} / un
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateServiceQuantity(service.id, -1)}
                            className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center active:scale-95 transition-transform"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-medium text-foreground">{service.quantity}</span>
                          <button
                            onClick={() => updateServiceQuantity(service.id, 1)}
                            className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center active:scale-95 transition-transform"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeService(service.id)}
                            className="w-10 h-10 rounded-lg hover:bg-destructive/10 flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <span className="text-sm font-semibold text-primary">{formatCurrency(service.price)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-border flex justify-between">
                  <span className="text-sm text-muted-foreground">Subtotal Serviços</span>
                  <span className="font-semibold text-foreground">{formatCurrency(subtotalServices)}</span>
                </div>
              </div>
            )}

            {/* Available Services */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-foreground">Adicionar Serviço</h4>
                <button
                  onClick={() => setShowCustomServiceDialog(true)}
                  className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Personalizado</span>
                </button>
              </div>
              <div className="space-y-6">
                {Object.entries(
                  services.reduce((acc, service) => {
                    const category = service.category || 'Outros';
                    if (!acc[category]) acc[category] = [];
                    acc[category].push(service);
                    return acc;
                  }, {} as Record<string, typeof services>)
                ).map(([category, categoryServices]) => (
                  <div key={category} className="space-y-2">
                    <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">{category}</h5>
                    <div className="space-y-2">
                      {categoryServices.map((service) => {
                        const inQuote = quoteServices.find(s => s.serviceId === service.id);
                        return (
                          <button
                            key={service.id}
                            onClick={() => addServiceToQuote(service)}
                            className={cn(
                              "w-full text-left p-4 rounded-lg border transition-all active:scale-[0.98] flex items-center justify-between",
                              inQuote
                                ? "bg-primary/10 border-primary"
                                : "bg-card border-border hover:border-primary/50"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                                inQuote ? "bg-primary border-primary" : "border-muted-foreground"
                              )}>
                                {inQuote && <Check className="w-4 h-4 text-primary-foreground" />}
                              </div>
                              <div>
                                <span className="font-medium text-foreground line-clamp-1">{service.name}</span>
                                {inQuote && (
                                  <span className="text-2xs text-primary font-medium ml-2">x{inQuote.quantity}</span>
                                )}
                              </div>
                            </div>
                            <span className="font-semibold text-primary">{formatCurrency(service.price)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Review Step */}
        {currentStep === 'review' && (
          <div className="space-y-4 animate-fade-in">
            {/* Client Summary */}
            <div className="bg-card rounded-lg border border-border p-4">
              <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> Cliente
              </h4>
              <p className="text-foreground">{clientName || 'Não informado'}</p>
              {clientPhone && <p className="text-sm text-muted-foreground">{clientPhone}</p>}
              {clientAddress && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" /> {clientAddress}
                </p>
              )}
            </div>

            {/* Materials Summary */}
            {quoteItems.length > 0 && (
              <div className="bg-card rounded-lg border border-border p-4">
                <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" /> Materiais
                </h4>
                <div className="space-y-2">
                  {quoteItems.map((item) => (
                    <div key={item.id} className="space-y-0.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-foreground">{item.quantity}{item.unit === 'm' ? 'm' : 'x'} {item.name}</span>
                        <span className="text-muted-foreground">{formatCurrency(item.total)}</span>
                      </div>
                      {item.isCopperTube && item.copperTotalWeight && (
                        <div className="flex items-center gap-1 text-2xs text-warning pl-2">
                          <Scale className="w-3 h-3" />
                          <span>{formatWeight(item.copperTotalWeight)} × R$ {item.copperPricePerKg}/kg</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-border flex justify-between">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-foreground">{formatCurrency(subtotalMaterials)}</span>
                </div>
              </div>
            )}

            {/* Services Summary */}
            {quoteServices.length > 0 && (
              <div className="bg-card rounded-lg border border-border p-4">
                <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-primary" /> Serviços
                </h4>
                <div className="space-y-2">
                  {quoteServices.map((service) => (
                    <div key={service.id} className="flex justify-between text-sm">
                      <span className="text-foreground">{service.quantity}x {service.name}</span>
                      <span className="text-muted-foreground">{formatCurrency(service.price)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-border flex justify-between">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-foreground">{formatCurrency(subtotalServices)}</span>
                </div>
              </div>
            )}

            {/* Discount */}
            <div className="bg-card rounded-lg border border-border p-4">
              <h4 className="font-medium text-foreground mb-3">Desconto</h4>
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    type="number"
                    value={discount || ''}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    placeholder="0"
                    className="w-full h-12 px-4 pr-12 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="flex rounded-lg border border-input overflow-hidden">
                  <button
                    onClick={() => setDiscountType('fixed')}
                    className={cn(
                      "px-4 h-12 flex items-center justify-center transition-colors",
                      discountType === 'fixed' ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground"
                    )}
                  >
                    <DollarSign className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDiscountType('percentage')}
                    className={cn(
                      "px-4 h-12 flex items-center justify-center transition-colors",
                      discountType === 'percentage' ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground"
                    )}
                  >
                    <Percent className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Payment & Validity */}
            <div className="bg-card rounded-lg border border-border p-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Validade (dias)</label>
                <input
                  type="number"
                  value={validityDays}
                  onChange={(e) => setValidityDays(Number(e.target.value))}
                  className="w-full h-12 px-4 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Condições de Pagamento</label>
                <input
                  type="text"
                  value={paymentConditions}
                  onChange={(e) => setPaymentConditions(e.target.value)}
                  className="w-full h-12 px-4 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Observações</label>
                <textarea
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  placeholder="Observações para o cliente..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
            </div>

            {/* Total */}
            <div className="bg-primary/10 rounded-lg border border-primary/20 p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">{formatCurrency(subtotal)}</span>
                </div>
                {discountValue > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Desconto</span>
                    <span className="text-destructive">-{formatCurrency(discountValue)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-primary/20">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="text-2xl font-bold text-primary">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            {/* Status Selection */}
            <div className="bg-card rounded-lg border border-border p-4">
              <h4 className="font-medium text-foreground mb-3">Salvar como:</h4>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setStatus('draft')}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 h-20 rounded-lg border transition-all active:scale-[0.98]",
                    status === 'draft'
                      ? "bg-muted border-muted-foreground text-foreground ring-2 ring-primary ring-offset-1"
                      : "bg-background border-border text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <FileEdit className="w-5 h-5" />
                  <span className="text-xs font-medium">Rascunho</span>
                </button>
                <button
                  onClick={() => setStatus('sent')}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 h-20 rounded-lg border transition-all active:scale-[0.98]",
                    status === 'sent'
                      ? "bg-primary/10 border-primary text-primary ring-2 ring-primary ring-offset-1"
                      : "bg-background border-border text-muted-foreground hover:bg-primary/5"
                  )}
                >
                  <Send className="w-5 h-5" />
                  <span className="text-xs font-medium">Enviado</span>
                </button>
                <button
                  onClick={() => setStatus('approved')}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 h-20 rounded-lg border transition-all active:scale-[0.98]",
                    status === 'approved'
                      ? "bg-success/10 border-success text-success ring-2 ring-success ring-offset-1"
                      : "bg-background border-border text-muted-foreground hover:bg-success/5"
                  )}
                >
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-xs font-medium">Aprovado</span>
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {status === 'draft' && 'Salvar para editar depois.'}
                {status === 'sent' && 'Marcar como enviado para o cliente.'}
                {status === 'approved' && 'Marcar como aprovado (finalizado).'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-background border-t border-border safe-bottom">
        <div className="flex gap-3">
          {currentStepIndex > 0 && (
            <button
              onClick={handlePrev}
              className="flex-1 h-14 border border-border rounded-lg font-medium text-foreground hover:bg-muted active:scale-[0.98] transition-all"
            >
              Voltar
            </button>
          )}
          {currentStepIndex < steps.length - 1 ? (
            <button
              onClick={handleNext}
              className="flex-1 h-14 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              Próximo
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="flex-1 h-14 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              {isEditMode ? 'Atualizar' : 'Salvar'}
              <span className="hidden sm:inline ml-1">Orçamento</span>
            </button>
          )}
        </div>
      </div>
      {/* Custom Item Dialogs */}
      <AddCustomItemDialog
        open={showCustomMaterialDialog}
        onOpenChange={setShowCustomMaterialDialog}
        type="material"
        onAdd={addCustomMaterial}
      />
      <AddCustomItemDialog
        open={showCustomServiceDialog}
        onOpenChange={setShowCustomServiceDialog}
        type="service"
        onAdd={addCustomService}
      />
    </Layout>
  );
}

import { useState, useRef, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useCompanyStore } from '@/store/companyStore';
import { Building2, Phone, MapPin, FileText, Save, ImageIcon, CircleDollarSign, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { COPPER_TUBE_SIZES } from '@/lib/copperCalculator';

export default function Settings() {
  const { company, updateCompany } = useCompanyStore();
  const [formData, setFormData] = useState(company);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync local state with store when store updates (e.g. after fetch)
  useEffect(() => {
    setFormData(company);
  }, [company]);

  const handleSave = async () => {
    try {
      await updateCompany(formData);
      toast.success('Configurações salvas!');
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error('Erro ao salvar: ' + (error.message || 'Verifique o console'));
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Selecione apenas arquivos de imagem');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setFormData(prev => ({ ...prev, logo: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, logo: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Layout title="Configurações" showBack>
      <div className="p-4 space-y-4">
        {/* Logo Section */}
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <ImageIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Logo da Empresa</h3>
              <p className="text-sm text-muted-foreground">Aparece no cabeçalho do PDF</p>
            </div>
          </div>

          {/* Upload de arquivo */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            id="logo-upload"
          />

          {formData.logo ? (
            <div className="relative">
              <div className="p-4 bg-muted rounded-lg flex items-center justify-center">
                <img
                  src={formData.logo}
                  alt="Logo preview"
                  className="max-h-20 object-contain"
                  onError={() => toast.error('Erro ao carregar imagem')}
                />
              </div>
              <button
                onClick={handleRemoveLogo}
                className="absolute -top-2 -right-2 w-7 h-7 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90 transition-colors shadow-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label
              htmlFor="logo-upload"
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
            >
              <Upload className="w-8 h-8 text-muted-foreground mb-2" />
              <span className="text-sm font-medium text-foreground">Clique para enviar o logo</span>
              <span className="text-xs text-muted-foreground mt-1">JPG, PNG ou GIF (máx. 2MB)</span>
            </label>
          )}
        </div>

        {/* Company Info */}
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Dados da Empresa</h3>
              <p className="text-sm text-muted-foreground">Informações exibidas no orçamento</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Nome da Empresa</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Climatização Express"
                className="w-full h-12 px-4 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">CNPJ ou CPF</label>
              <input
                type="text"
                value={formData.document}
                onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                placeholder="00.000.000/0001-00"
                className="w-full h-12 px-4 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Contato</h3>
              <p className="text-sm text-muted-foreground">Telefone e endereço</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Telefone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 99999-9999"
                className="w-full h-12 px-4 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Endereço</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Rua das Flores, 123 - Centro"
                className="w-full h-12 px-4 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        {/* Footer Text */}
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Garantia e Termos</h3>
              <p className="text-sm text-muted-foreground">Texto exibido no rodapé do PDF</p>
            </div>
          </div>

          <textarea
            value={formData.footerText}
            onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
            placeholder="Garantia de 90 dias para serviços executados..."
            rows={3}
            className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        {/* Copper Price */}
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-warning/20">
              <CircleDollarSign className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Preço do Cobre</h3>
              <p className="text-sm text-muted-foreground">Valor do kg para cálculo automático</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Preço por kg (R$)</label>
              <input
                type="number"
                step="0.01"
                value={formData.copperPricePerKg || ''}
                onChange={(e) => setFormData({ ...formData, copperPricePerKg: Number(e.target.value) })}
                placeholder="75.00"
                className="w-full h-12 px-4 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Reference Table */}
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Peso por metro (referência):</p>
              <div className="grid grid-cols-2 gap-1 text-xs">
                {COPPER_TUBE_SIZES.map(size => (
                  <div key={size.value} className="flex justify-between text-muted-foreground">
                    <span>Tubo {size.label}:</span>
                    <span className="font-medium">{size.weightPerMeter} kg/m</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full h-14 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-card"
        >
          <Save className="w-5 h-5" />
          Salvar Configurações
        </button>
      </div>
    </Layout>
  );
}

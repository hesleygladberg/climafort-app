import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useQuote, useDeleteQuote, useUpdateQuote } from '@/hooks/useSupabaseQuotes';
import { useCompanyStore } from '@/store/companyStore';
import {
  FileText, User, MapPin, Package, Wrench,
  Send, CheckCircle, XCircle, Trash2, Download,
  Phone, Edit
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { pdf } from '@react-pdf/renderer';
import { QuotePDF } from '@/components/QuotePDF';

const statusConfig = {
  draft: { label: 'Rascunho', className: 'bg-muted text-muted-foreground', icon: FileText },
  sent: { label: 'Enviado', className: 'bg-primary/10 text-primary', icon: Send },
  approved: { label: 'Aprovado', className: 'bg-success/10 text-success', icon: CheckCircle },
  cancelled: { label: 'Cancelado', className: 'bg-destructive/10 text-destructive', icon: XCircle },
};

export default function QuoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: quote, isLoading } = useQuote(id || '');
  const deleteQuote = useDeleteQuote();
  const updateQuote = useUpdateQuote();
  const { company } = useCompanyStore();

  if (isLoading) {
    return (
      <Layout title="Carregando..." showBack>
        <div className="p-4 flex items-center justify-center h-screen">
          <p className="text-muted-foreground animate-pulse">Carregando detalhes...</p>
        </div>
      </Layout>
    );
  }

  if (!quote) {
    return (
      <Layout title="Orçamento" showBack>
        <div className="p-4 text-center">
          <p className="text-muted-foreground">Orçamento não encontrado</p>
        </div>
      </Layout>
    );
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const handleStatusChange = (status: typeof quote.status) => {
    updateQuote.mutate({
      id: quote.id,
      data: { status }
    }, {
      onSuccess: () => {
        toast.success(`Status alterado para ${statusConfig[status].label}`);
      }
    });
  };

  const handleDelete = () => {
    if (confirm('Tem certeza que deseja excluir este orçamento?')) {
      deleteQuote.mutate(quote.id, {
        onSuccess: () => {
          toast.success('Orçamento excluído');
          navigate('/');
        }
      });
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const blob = await pdf(<QuotePDF quote={quote} company={company} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `orcamento-${String(quote.number).padStart(4, '0')}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar PDF');
    }
  };

  const handleWhatsApp = async () => {
    try {
      const blob = await pdf(<QuotePDF quote={quote} company={company} />).toBlob();
      const url = URL.createObjectURL(blob);

      // Try to share via native share API first
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], `orcamento-${String(quote.number).padStart(4, '0')}.pdf`, { type: 'application/pdf' });
        const shareData = {
          files: [file],
          title: `Orçamento #${String(quote.number).padStart(4, '0')}`,
          text: `Segue o orçamento no valor de ${formatCurrency(quote.total)}`,
        };

        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          updateQuote.mutate({ id: quote.id, data: { status: 'sent' } });
          toast.success('Orçamento enviado!');
          return;
        }
      }

      // Fallback: open WhatsApp with message
      const phone = quote.clientPhone.replace(/\D/g, '');
      const message = encodeURIComponent(
        `Olá ${quote.clientName}! Segue o orçamento #${String(quote.number).padStart(4, '0')} no valor de ${formatCurrency(quote.total)}. Em anexo o PDF detalhado.`
      );
      window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
      updateQuote.mutate({ id: quote.id, data: { status: 'sent' } });

      // Also trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `orcamento-${String(quote.number).padStart(4, '0')}.pdf`;
      link.click();

      URL.revokeObjectURL(url);
      toast.success('Orçamento enviado!');
    } catch (error) {
      toast.error('Erro ao enviar');
    }
  };

  const status = statusConfig[quote.status];

  return (
    <Layout
      title={`#${String(quote.number).padStart(4, '0')}`}
      showBack
      rightAction={
        <div className={cn("px-2 py-1 rounded-full text-2xs font-medium", status.className)}>
          {status.label}
        </div>
      }
    >
      <div className="p-4 pb-32 space-y-4">
        {/* Header Info */}
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {formatCurrency(quote.total)}
              </h2>
              <p className="text-sm text-muted-foreground">
                {format(new Date(quote.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Válido por {quote.validityDays} dias</span>
            {quote.version > 1 && (
              <>
                <span>•</span>
                <span>Versão {quote.version}</span>
              </>
            )}
          </div>
        </div>

        {/* Client */}
        <div className="bg-card rounded-lg border border-border p-4">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> Cliente
          </h3>
          <p className="font-medium text-foreground">{quote.clientName || 'Não informado'}</p>
          {quote.clientPhone && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <Phone className="w-3 h-3" /> {quote.clientPhone}
            </p>
          )}
          {quote.clientAddress && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3" /> {quote.clientAddress}
            </p>
          )}
        </div>

        {/* Materials */}
        {quote.items.length > 0 && (
          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" /> Materiais
            </h3>
            <div className="space-y-2">
              {quote.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-foreground">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="text-muted-foreground">{formatCurrency(item.total)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-border flex justify-between">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="font-medium text-foreground">{formatCurrency(quote.subtotalMaterials)}</span>
            </div>
          </div>
        )}

        {/* Services */}
        {quote.services.length > 0 && (
          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-primary" /> Serviços
            </h3>
            <div className="space-y-2">
              {quote.services.map((service) => (
                <div key={service.id} className="flex justify-between text-sm">
                  <span className="text-foreground">
                    {service.quantity || 1}x {service.name}
                  </span>
                  <span className="text-muted-foreground">{formatCurrency(service.price)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-border flex justify-between">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="font-medium text-foreground">{formatCurrency(quote.subtotalServices)}</span>
            </div>
          </div>
        )}

        {/* Notes */}
        {quote.clientNotes && (
          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="font-semibold text-foreground mb-2">Observações</h3>
            <p className="text-sm text-muted-foreground">{quote.clientNotes}</p>
          </div>
        )}

        {/* Payment */}
        <div className="bg-card rounded-lg border border-border p-4">
          <h3 className="font-semibold text-foreground mb-2">Condições de Pagamento</h3>
          <p className="text-sm text-muted-foreground">{quote.paymentConditions}</p>
        </div>

        {/* Status Actions */}
        <div className="bg-card rounded-lg border border-border p-4">
          <h3 className="font-semibold text-foreground mb-3">Gerenciar Status</h3>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(statusConfig) as [keyof typeof statusConfig, typeof statusConfig['draft']][]).map(([key, config]) => (
              <button
                key={key}
                onClick={() => handleStatusChange(key as any)}
                disabled={quote.status === key}
                className={cn(
                  "flex items-center justify-center gap-2 h-12 rounded-lg border transition-all active:scale-95",
                  quote.status === key
                    ? cn(config.className, "border-current ring-1 ring-current cursor-default opacity-100")
                    : "border-border text-muted-foreground hover:bg-muted opacity-50 hover:opacity-100"
                )}
              >
                <config.icon className="w-4 h-4" />
                {config.label}
              </button>
            ))}
          </div>
        </div>

        {/* Edit & Delete */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/quote/${quote.id}/edit`)}
            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-lg border border-primary text-primary hover:bg-primary/10 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Editar
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Excluir
          </button>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-background border-t border-border safe-bottom">
        <div className="flex gap-3">
          <button
            onClick={handleDownloadPDF}
            className="flex-1 h-14 border border-border rounded-lg font-medium text-foreground hover:bg-muted active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Baixar PDF
          </button>
          <button
            onClick={handleWhatsApp}
            className="flex-1 h-14 bg-success text-success-foreground rounded-lg font-medium hover:bg-success/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" />
            Enviar WhatsApp
          </button>
        </div>
      </div>
    </Layout>
  );
}

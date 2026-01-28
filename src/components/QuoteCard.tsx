import { Quote, QuoteStatus } from '@/types';
import { cn } from '@/lib/utils';
import { FileText, Clock, CheckCircle, XCircle, Send } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface QuoteCardProps {
  quote: Quote;
  onClick: () => void;
  onEdit?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
  onStatusChange?: (e: React.MouseEvent, status: QuoteStatus) => void;
}

const statusConfig = {
  draft: {
    label: 'Rascunho',
    icon: Clock,
    colorClass: 'text-amber-500',
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/20',
    badgeClass: 'border border-amber-500 text-amber-500 bg-amber-50 text-[10px]'
  },
  sent: {
    label: 'Enviado',
    icon: Send,
    colorClass: 'text-blue-500',
    bgClass: 'bg-blue-500/10',
    borderClass: 'border-blue-500/20',
    badgeClass: 'border border-blue-500 text-blue-500 bg-blue-50 text-[10px]'
  },
  approved: {
    label: 'Aprovado',
    icon: CheckCircle,
    colorClass: 'text-emerald-500',
    bgClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500/20',
    badgeClass: 'border border-emerald-500 text-emerald-500 bg-emerald-50 text-[10px]'
  },
  cancelled: {
    label: 'Cancelado',
    icon: XCircle,
    colorClass: 'text-red-500',
    bgClass: 'bg-red-500/10',
    borderClass: 'border-red-500/20',
    badgeClass: 'border border-red-500 text-red-500 bg-red-50 text-[10px]'
  },
};

export function QuoteCard({ quote, onClick, onEdit, onDelete, onStatusChange }: QuoteCardProps) {
  const status = statusConfig[quote.status];
  const StatusIcon = status.icon;

  return (
    <div
      onClick={onClick}
      className={cn(
        "w-full text-left bg-card rounded-xl border p-4 shadow-sm hover:shadow-md transition-all duration-200 touch-manipulation cursor-pointer group",
        status.borderClass
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn("flex items-center justify-center w-12 h-12 rounded-xl shrink-0 transition-colors", status.bgClass)}>
            <FileText className={cn("w-6 h-6", status.colorClass)} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground text-lg">
                #{String(quote.number).padStart(4, '0')}
              </span>
              {quote.version > 1 && (
                <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">v{quote.version}</span>
              )}
            </div>
            <p className="text-sm font-medium text-muted-foreground truncate">{quote.clientName || 'Sem cliente'}</p>
          </div>
        </div>
        <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full font-bold shrink-0 uppercase tracking-wide", status.badgeClass)}>
          <StatusIcon className="w-3.5 h-3.5" />
          <span>{status.label}</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {format(new Date(quote.createdAt), "dd 'de' MMM", { locale: ptBR })}
        </span>
        <span className="text-xl font-bold text-foreground">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quote.total)}
        </span>
      </div>

      {/* Quick Actions */}
      <div className="mt-3 pt-2 flex items-center justify-end gap-2 border-t border-border/50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
        {onStatusChange && (
          <button
            onClick={(e) => {
              const nextStatus = quote.status === 'draft' ? 'sent' : quote.status === 'sent' ? 'approved' : 'draft';
              onStatusChange(e, nextStatus);
            }}
            className={cn("p-2 rounded-lg hover:bg-muted transition-colors text-xs font-bold flex items-center gap-1", status.colorClass)}
            title="Mudar Status"
          >
            <Send className="w-3.5 h-3.5" />
            {quote.status === 'draft' ? 'Enviar' : quote.status === 'sent' ? 'Aprovar' : 'Mudar'}
          </button>
        )}
        {onEdit && (
          <button
            onClick={onEdit}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-xs font-semibold"
            title="Editar"
          >
            Editar
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors text-xs font-semibold"
            title="Excluir"
          >
            Excluir
          </button>
        )}
      </div>
    </div>
  );
}

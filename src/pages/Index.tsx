import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { EmptyState } from '@/components/EmptyState';
import { QuoteCard } from '@/components/QuoteCard';
import { useQuotes, useDeleteQuote, useUpdateQuote } from '@/hooks/useSupabaseQuotes';
import { useCompanyStore } from '@/store/companyStore';
import { cn } from '@/lib/utils';
import { FileText, Snowflake } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const navigate = useNavigate();
  const { data: quotes = [], isLoading } = useQuotes();
  const deleteQuote = useDeleteQuote();
  const updateQuote = useUpdateQuote();
  const { company } = useCompanyStore();
  const [filterStatus, setFilterStatus] = React.useState<'all' | 'draft' | 'sent' | 'approved'>('all');

  const filteredQuotes = React.useMemo(() => {
    if (filterStatus === 'all') return quotes;
    return quotes.filter(q => q.status === filterStatus);
  }, [quotes, filterStatus]);

  const stats = React.useMemo(() => ({
    total: quotes.length,
    draft: quotes.filter(q => q.status === 'draft').length,
    sent: quotes.filter(q => q.status === 'sent').length,
    approved: quotes.filter(q => q.status === 'approved').length,
  }), [quotes]);

  const handleNewQuote = () => {
    navigate('/quote/new');
  };

  if (isLoading) {
    return (
      <Layout title="Climafort">
        <div className="p-4 flex items-center justify-center h-screen">
          <p className="text-muted-foreground animate-pulse">Carregando orçamentos...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title={company.name || 'OrcaFrio'}
      rightAction={
        <div className="flex items-center gap-2 text-primary">
          <Snowflake className="w-5 h-5" />
        </div>
      }
    >
      <div className="p-4">
        {/* Stats Summary - Solid Colors Inverted */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          <button
            onClick={() => setFilterStatus('all')}
            className={cn(
              "rounded-2xl p-2 text-center transition-all duration-200 active:scale-95 flex flex-col items-center justify-center min-h-[75px] shadow-sm",
              filterStatus === 'all'
                ? "bg-indigo-400 text-white ring-2 ring-indigo-300 ring-offset-1" // Active (Lighter)
                : "bg-indigo-600 text-white hover:bg-indigo-500" // Inactive (Darker)
            )}
          >
            <p className="text-xl font-bold leading-none mb-1">{stats.total}</p>
            <p className="text-[10px] uppercase tracking-wide font-medium opacity-90">Total</p>
          </button>

          <button
            onClick={() => setFilterStatus('sent')}
            className={cn(
              "rounded-2xl p-2 text-center transition-all duration-200 active:scale-95 flex flex-col items-center justify-center min-h-[75px] shadow-sm",
              filterStatus === 'sent'
                ? "bg-blue-400 text-white ring-2 ring-blue-300 ring-offset-1" // Active (Lighter)
                : "bg-blue-600 text-white hover:bg-blue-500" // Inactive (Darker)
            )}
          >
            <p className="text-xl font-bold leading-none mb-1">{stats.sent}</p>
            <p className="text-[10px] uppercase tracking-wide font-medium opacity-90">Enviados</p>
          </button>

          <button
            onClick={() => setFilterStatus('draft')}
            className={cn(
              "rounded-2xl p-2 text-center transition-all duration-200 active:scale-95 flex flex-col items-center justify-center min-h-[75px] shadow-sm",
              filterStatus === 'draft'
                ? "bg-amber-400 text-white ring-2 ring-amber-300 ring-offset-1" // Active (Lighter)
                : "bg-amber-500 text-white hover:bg-amber-400" // Inactive (Darker)
            )}
          >
            <p className="text-xl font-bold leading-none mb-1">{stats.draft}</p>
            <p className="text-[10px] uppercase tracking-wide font-medium opacity-90">Rascunhos</p>
          </button>

          <button
            onClick={() => setFilterStatus('approved')}
            className={cn(
              "rounded-2xl p-2 text-center transition-all duration-200 active:scale-95 flex flex-col items-center justify-center min-h-[75px] shadow-sm",
              filterStatus === 'approved'
                ? "bg-emerald-400 text-white ring-2 ring-emerald-300 ring-offset-1" // Active (Lighter)
                : "bg-emerald-600 text-white hover:bg-emerald-500" // Inactive (Darker)
            )}
          >
            <p className="text-xl font-bold leading-none mb-1">{stats.approved}</p>
            <p className="text-[10px] uppercase tracking-wide font-medium opacity-90">Aprovados</p>
          </button>
        </div>

        {/* Section Title */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            {filterStatus === 'all' && 'Todos os Orçamentos'}
            {filterStatus === 'draft' && <span className="text-amber-500">Rascunhos</span>}
            {filterStatus === 'sent' && <span className="text-blue-500">Enviados</span>}
            {filterStatus === 'approved' && <span className="text-emerald-500">Aprovados</span>}
          </h2>
          {filterStatus !== 'all' && (
            <button
              onClick={() => setFilterStatus('all')}
              className="text-xs text-primary font-medium hover:underline"
            >
              Limpar filtro
            </button>
          )}
        </div>

        {/* Quotes List or Empty State */}
        {filteredQuotes.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-8 h-8 text-muted-foreground" />}
            title="Nenhum orçamento"
            description={filterStatus === 'all' ? "Comece criando seu primeiro orçamento." : "Nenhum orçamento encontrado com este status."}
            action={
              filterStatus === 'all' ? (
                <button
                  onClick={handleNewQuote}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 active:scale-95 transition-all touch-manipulation"
                >
                  Criar Orçamento
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredQuotes.map((quote) => (
              <QuoteCard
                key={quote.id}
                quote={quote}
                onClick={() => navigate(`/quote/${quote.id}`)}
                onEdit={(e) => {
                  e.stopPropagation();
                  navigate(`/quote/${quote.id}/edit`);
                }}
                onDelete={(e) => {
                  e.stopPropagation();
                  if (confirm('Excluir orçamento?')) {
                    deleteQuote.mutate(quote.id, {
                      onSuccess: () => toast.success('Orçamento excluído!')
                    });
                  }
                }}
                onStatusChange={(e, status) => {
                  e.stopPropagation();
                  updateQuote.mutate({ id: quote.id, data: { status } }, {
                    onSuccess: () => toast.success(`Status alterado para ${status}`)
                  });
                }}
              />
            ))}
          </div>
        )}
      </div>

      <FloatingActionButton onClick={handleNewQuote} />
    </Layout>
  );
};

export default Index;

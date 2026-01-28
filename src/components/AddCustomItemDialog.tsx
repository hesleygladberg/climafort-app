import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Package, Wrench } from 'lucide-react';

interface AddCustomItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'material' | 'service';
  onAdd: (item: { name: string; unit: string; price: number }) => void;
}

export function AddCustomItemDialog({
  open,
  onOpenChange,
  type,
  onAdd,
}: AddCustomItemDialogProps) {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState(type === 'material' ? 'un' : 'serv');
  const [price, setPrice] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) return;

    onAdd({
      name: name.trim(),
      unit,
      price: Number(price),
    });

    // Reset form
    setName('');
    setUnit(type === 'material' ? 'un' : 'serv');
    setPrice('');
    onOpenChange(false);
  };

  const isMaterial = type === 'material';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isMaterial ? (
              <Package className="w-5 h-5 text-primary" />
            ) : (
              <Wrench className="w-5 h-5 text-primary" />
            )}
            Adicionar {isMaterial ? 'Material' : 'Serviço'} Personalizado
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isMaterial ? 'Ex: Parafuso especial' : 'Ex: Serviço extra'}
              autoFocus
            />
          </div>

          {isMaterial && (
            <div className="space-y-2">
              <Label htmlFor="unit">Unidade</Label>
              <select
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="un">un (Unidade)</option>
                <option value="m">m (Metro)</option>
                <option value="kg">kg (Quilograma)</option>
                <option value="pç">pç (Peça)</option>
                <option value="cx">cx (Caixa)</option>
                <option value="rolo">rolo</option>
                <option value="litro">litro</option>
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="price">Preço (R$)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0,00"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || !price}
              className="flex-1"
            >
              Adicionar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  onClick: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export function FloatingActionButton({ 
  onClick, 
  icon = <Plus className="w-6 h-6" />,
  className 
}: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed right-4 bottom-20 z-40 flex items-center justify-center",
        "w-14 h-14 rounded-full bg-primary text-primary-foreground",
        "shadow-fab hover:shadow-xl active:scale-95",
        "transition-all duration-200 touch-manipulation",
        className
      )}
    >
      {icon}
    </button>
  );
}

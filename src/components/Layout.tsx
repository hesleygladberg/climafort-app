import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Package, Wrench, Settings, ChevronLeft, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  rightAction?: ReactNode;
}

const navItems = [
  { icon: Home, label: 'Início', path: '/' },
  { icon: Package, label: 'Materiais', path: '/materials' },
  { icon: Wrench, label: 'Serviços', path: '/services' },
  { icon: Settings, label: 'Config', path: '/settings' },
];

export function Layout({ children, title, showBack, rightAction }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border safe-top">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            {showBack ? (
              <button
                onClick={() => navigate(-1)}
                className="p-2 -ml-2 rounded-lg hover:bg-muted active:bg-muted/80 transition-colors touch-manipulation"
              >
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
            ) : (
              <button
                onClick={() => navigate('/')}
                className="font-bold text-lg text-primary hover:opacity-80 transition-opacity touch-manipulation"
              >
                Climafort
              </button>
            )}
            {title && showBack && (
              <h1 className="text-lg font-semibold text-foreground truncate">
                {title}
              </h1>
            )}
          </div>
          <div className="flex items-center gap-2">
            {rightAction && <div>{rightAction}</div>}
            {!showBack && (
              <button
                onClick={() => navigate('/profile')}
                className="p-2 -mr-2 text-muted-foreground hover:text-primary transition-colors"
                title="Meu Perfil"
              >
                <UserCircle className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-bottom">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors touch-manipulation",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive && "stroke-[2.5]")} />
                <span className="text-2xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

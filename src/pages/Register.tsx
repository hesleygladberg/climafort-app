import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Snowflake, Loader2 } from 'lucide-react';

export default function Register() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) throw error;

            toast.success('Conta criada! Faça login para continuar.');
            navigate('/login');
        } catch (error: any) {
            toast.error(error.message || 'Erro ao criar conta');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary/10 mb-4">
                        <Snowflake className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Criar Conta
                    </h1>
                    <p className="text-muted-foreground">
                        Comece a usar o ClimaFort hoje
                    </p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4 bg-card p-6 rounded-xl border border-border shadow-sm">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full h-11 px-3 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                            placeholder="seu@email.com"
                            data-testid="register-email-input"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Senha</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full h-11 px-3 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                            placeholder="••••••••"
                            data-testid="register-password-input"
                        />
                        <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres</p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        data-testid="register-submit-button"
                        className="w-full h-11 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar Conta'}
                    </button>
                </form>

                <p className="text-center text-sm text-muted-foreground">
                    Já tem conta?{' '}
                    <Link to="/login" className="text-primary font-medium hover:underline">
                        Fazer login
                    </Link>
                </p>
            </div>
        </div>
    );
}

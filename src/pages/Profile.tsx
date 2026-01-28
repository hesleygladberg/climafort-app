import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Lock, User as UserIcon, LogOut, Save, Loader2, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            toast.error('A senha deve ter no mínimo 6 caracteres');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('As senhas não conferem');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            toast.success('Senha atualizada com sucesso!');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            toast.error('Erro ao atualizar senha: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <Layout title="Meu Perfil" showBack>
            <div className="p-4 space-y-6">
                {/* User Info Card */}
                <div className="bg-card rounded-lg border border-border p-6 flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <UserIcon className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">Minha Conta</h2>
                    <div className="flex items-center gap-2 text-muted-foreground mt-1">
                        <Mail className="w-4 h-4" />
                        <span>{user?.email}</span>
                    </div>
                </div>

                {/* Change Password Form */}
                <div className="bg-card rounded-lg border border-border p-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                            <Lock className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground">Alterar Senha</h3>
                            <p className="text-sm text-muted-foreground">Defina uma nova senha de acesso</p>
                        </div>
                    </div>

                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 block">Nova Senha</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full h-12 px-4 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 block">Confirmar Senha</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full h-12 px-4 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !newPassword}
                            className="w-full h-12 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>
                                <Save className="w-4 h-4" />
                                Atualizar Senha
                            </>}
                        </button>
                    </form>
                </div>

                {/* Logout Zone */}
                <button
                    onClick={handleLogout}
                    className="w-full h-12 border border-destructive/30 text-destructive bg-destructive/5 rounded-lg font-medium hover:bg-destructive/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    <LogOut className="w-4 h-4" />
                    Sair da Conta
                </button>
            </div>
        </Layout>
    );
}

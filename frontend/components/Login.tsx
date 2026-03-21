import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Droplets, Truck, CheckSquare, Square } from 'lucide-react';
import { api, saveAuthSession, type AuthRole } from '../services/apiClient.ts';

interface LoginProps {
  onLogin: (role: 'admin' | 'seller', username: string, remember: boolean) => void;
  blockedUsers?: string[]; // Optional prop for backward compatibility but used now
}

const Login: React.FC<LoginProps> = ({ onLogin, blockedUsers = [] }) => {
  const navigate = useNavigate();
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const rawInput = id.trim();
    const lowerInput = rawInput.toLowerCase();
    const upperInput = rawInput.toUpperCase();

    if (blockedUsers.some(u => u === rawInput || u.toLowerCase() === lowerInput || u.toUpperCase() === upperInput)) {
      setError("Ce compte a été bloqué par l'administrateur.");
      return;
    }

    try {
      const { data } = await api.post('/auth/login', { username: rawInput, password });
      const role: AuthRole = data.role === 'SELLER' ? 'seller' : 'admin';
      const normalizedSession = {
        token: data.token,
        username: data.username ?? rawInput,
        role,
        vehicleId: data.vehicleId ?? null,
      };

      saveAuthSession(normalizedSession);
      onLogin(role, normalizedSession.username, rememberMe);
      navigate(role === 'seller' ? '/seller' : '/dashboard', { replace: true });
      return;
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 403) {
        setError("Ce compte a été bloqué par l'administrateur.");
      } else if (status === 401) {
        setError('Identifiant ou mot de passe incorrect.');
      } else {
        setError('Impossible de contacter le serveur d’authentification.');
      }
      return;
    }
  };

  return (
    <div className="min-h-screen bg-olive-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-olive-800 p-8 text-center">
          <div className="inline-block p-4 bg-olive-700 rounded-full mb-4 shadow-inner">
            <Droplets className="text-white h-12 w-12" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wider">OLIVE PRO</h1>
          <p className="text-olive-200 text-sm">Portail de Gestion Sécurisé</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium border border-red-100 animate-pulse">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">Identifiant</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                value={id}
                onChange={e => setId(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-olive-500 outline-none transition-all placeholder-gray-300 uppercase"
                placeholder="Admin ou Matricule"
                autoComplete="username"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">Mot de Passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-olive-500 outline-none transition-all placeholder-gray-300"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>
              {rememberMe ? <CheckSquare className="text-olive-600" size={20} /> : <Square className="text-gray-400" size={20} />}
              <span className="text-sm text-gray-600 select-none">Rester connecté</span>
          </div>

          <button 
            type="submit" 
            className="w-full bg-olive-600 text-white font-bold py-3 rounded-xl hover:bg-olive-700 shadow-lg shadow-olive-600/30 transition-all transform hover:scale-[1.02]"
          >
            Se Connecter
          </button>
          
          <div className="mt-6 border-t pt-4">
             <div className="text-center text-xs text-gray-400">
               <p className="mb-2">Accès Démo :</p>
               <p>Admin: <span className="font-mono text-gray-600">mojo</span> ou <span className="font-mono text-gray-600">boss</span></p>
               <p className="mt-1 flex items-center justify-center gap-1">
                 <Truck size={12}/> Vendeur: <span className="font-mono text-gray-600">MATRICULE</span>
               </p>
             </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

import React from 'react';
import { Vehicle } from '../types.ts';
import { Shield, Lock, Unlock, User, Truck, AlertTriangle } from 'lucide-react';

interface AdminPanelProps {
  vehicles: Vehicle[];
  blockedUsers: string[];
  onToggleBlock: (username: string) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ vehicles, blockedUsers, onToggleBlock }) => {
  
  const staticAdmins = [
      { id: 'hajar', name: 'Hajar', role: 'Administrateur' },
      { id: 'safae', name: 'Safae', role: 'Administrateur' },
      { id: 'ZITLBLAD1', name: 'Compte Vendeur Global', role: 'Vendeur' }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
            <div className="bg-red-100 p-3 rounded-full text-red-600">
                <Shield size={32}/>
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Administration des Accès</h2>
                <p className="text-gray-500">Contrôle de sécurité réservé au Super Admin (Mojo)</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* 1. STATIC STAFF */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b flex items-center gap-2">
                    <User className="text-gray-500"/>
                    <h3 className="font-bold text-gray-700">Comptes Administratifs</h3>
                </div>
                <div className="divide-y divide-gray-100">
                    {staticAdmins.map(user => {
                        const isBlocked = blockedUsers.includes(user.id);
                        return (
                            <div key={user.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                <div>
                                    <p className="font-bold text-gray-800">{user.name}</p>
                                    <p className="text-xs text-gray-500 font-mono">ID: {user.id}</p>
                                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 mt-1 inline-block">{user.role}</span>
                                </div>
                                <button 
                                    onClick={() => onToggleBlock(user.id)}
                                    className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${
                                        isBlocked 
                                        ? 'bg-red-100 text-red-700 border border-red-200 hover:bg-red-200' 
                                        : 'bg-green-100 text-green-700 border border-green-200 hover:bg-green-200'
                                    }`}
                                >
                                    {isBlocked ? <Lock size={16}/> : <Unlock size={16}/>}
                                    {isBlocked ? 'Bloqué' : 'Actif'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 2. DYNAMIC VEHICLES (SELLERS) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b flex items-center gap-2">
                    <Truck className="text-gray-500"/>
                    <h3 className="font-bold text-gray-700">Comptes Vendeurs (Camions)</h3>
                </div>
                <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                    {vehicles.length === 0 && <p className="p-4 text-center text-gray-400">Aucun véhicule enregistré.</p>}
                    {vehicles.map(v => {
                        const isBlocked = blockedUsers.includes(v.plateNumber);
                        return (
                            <div key={v.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                <div>
                                    <p className="font-bold text-gray-800 font-mono">{v.plateNumber}</p>
                                    <p className="text-xs text-gray-500">{v.driverName}</p>
                                </div>
                                <button 
                                    onClick={() => onToggleBlock(v.plateNumber)}
                                    className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${
                                        isBlocked 
                                        ? 'bg-red-100 text-red-700 border border-red-200 hover:bg-red-200' 
                                        : 'bg-green-100 text-green-700 border border-green-200 hover:bg-green-200'
                                    }`}
                                >
                                    {isBlocked ? <Lock size={16}/> : <Unlock size={16}/>}
                                    {isBlocked ? 'Bloqué' : 'Actif'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="text-orange-600 shrink-0 mt-1"/>
            <div>
                <h4 className="font-bold text-orange-800 text-sm">Note Importante</h4>
                <p className="text-xs text-orange-700 mt-1">
                    Bloquer un utilisateur l'empêchera de se connecter immédiatement. S'il est déjà connecté, il sera déconnecté lors de sa prochaine action ou rafraîchissement de page.
                </p>
            </div>
        </div>
    </div>
  );
};

export default AdminPanel;
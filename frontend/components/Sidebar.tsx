import React from 'react';
import { LayoutDashboard, Factory, Database, Users, Droplets, Truck, Wallet, Clock, ClipboardList, BarChart2, Fuel, ShieldAlert, Mail, FileText, FileSignature } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  username?: string;
  alerts?: Record<string, number>; // Dictionnaire d'alertes { 'tabId': nombre }
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, username, alerts = {} }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
    { id: 'accounting', label: 'Comptabilité', icon: Wallet },
    { id: 'invoices', label: 'Factures', icon: FileText },
    { id: 'contracts', label: 'Suivi Contrats', icon: FileSignature },
    { id: 'fuel', label: 'Gestion Carburant', icon: Fuel }, 
    { id: 'sellers', label: 'Suivi Vendeurs', icon: BarChart2 },
    { id: 'stock', label: 'Stocks & Citernes', icon: Database },
    { id: 'production', label: 'Production', icon: Factory },
    { id: 'vehicles', label: 'Flotte & Transport', icon: Truck },
    { id: 'partners', label: 'Clients / Fournisseurs', icon: Users },
    { id: 'hr', label: 'Pointage & RH', icon: Clock },
    { id: 'history', label: 'Historique Activités', icon: ClipboardList },
  ];

  return (
    <div className="w-64 bg-olive-900 text-white h-screen fixed left-0 top-0 flex flex-col shadow-xl z-10">
      <div className="p-6 border-b border-olive-700 flex items-center gap-3">
        <div className="bg-white p-2 rounded-full">
           <Droplets className="text-olive-600 h-6 w-6" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight uppercase">MARRAKECH AGRO</h1>
          <p className="text-xs text-olive-300">Marrakech, Maroc</p>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const alertCount = alerts[item.id] || 0;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 relative ${
                isActive 
                  ? 'bg-olive-500 text-white shadow-lg shadow-olive-900/50' 
                  : 'text-olive-100 hover:bg-olive-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium flex-1 text-left">{item.label}</span>
              
              {/* Badge d'Alerte Global */}
              {alertCount > 0 && (
                <span className={`text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse ${
                    item.id === 'fuel' || item.id === 'accounting' ? 'bg-orange-500' : 'bg-red-500'
                }`}>
                  {item.id === 'fuel' ? '!' : alertCount}
                </span>
              )}
            </button>
          );
        })}

        {/* ADMIN TAB ONLY FOR MOJO OR BOSS */}
        {(username === 'mojo' || username === 'boss') && (
            <div className="pt-4 mt-4 border-t border-olive-800">
                <p className="text-xs text-olive-400 font-bold px-4 mb-2 uppercase">Super Admin</p>
                <button
                onClick={() => setActiveTab('admin')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    activeTab === 'admin' 
                    ? 'bg-red-800 text-white shadow-lg' 
                    : 'text-olive-100 hover:bg-red-900/50 hover:text-white'
                }`}
                >
                <ShieldAlert size={20} />
                <span className="font-medium">Administration</span>
                </button>
            </div>
        )}
      </nav>

      <div className="p-4 border-t border-olive-800">
        <div className="bg-olive-800 rounded-lg p-3 text-xs text-olive-200">
          <p className="font-semibold text-white mb-1">Status Système</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            En ligne
          </div>
          <div className="mt-1 text-olive-400">
              Utilisateur: {username || 'Inconnu'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
import React, { useState } from 'react';
import { FuelLog, Vehicle, PaymentMethod } from '../types.ts';
import { Fuel, AlertTriangle, Plus, Droplet, Truck, History, ArrowRight, Trash2 } from 'lucide-react';

interface FuelManagerProps {
  currentStock: number;
  logs: FuelLog[];
  vehicles: Vehicle[];
  onAddFuel: (quantity: number, cost: number, method: PaymentMethod) => void;
  onConsumeFuel: (vehicleId: string, quantity: number) => void;
  username?: string; // Optional for compatibility, but we use it for permissions
  onDeleteLog?: (id: string) => void;
}

const FuelManager: React.FC<FuelManagerProps> = ({ currentStock, logs, vehicles, onAddFuel, onConsumeFuel, username, onDeleteLog }) => {
  const [activeTab, setActiveTab] = useState<'consume' | 'buy'>('consume');
  
  // Forms
  const [buyQty, setBuyQty] = useState('');
  const [buyCost, setBuyCost] = useState('');
  const [buyMethod, setBuyMethod] = useState<PaymentMethod>(PaymentMethod.ESPECE);
  
  const [consoVehicleId, setConsoVehicleId] = useState('');
  const [consoQty, setConsoQty] = useState('');

  const isLowStock = currentStock <= 500;
  const tankCapacity = 5000; // Example capacity for the visual bar

  // Permission Check
  const canDelete = username && ['mojo', 'hajar', 'safae', 'ZITLBLAD1'].includes(username);

  const handleBuy = (e: React.FormEvent) => {
    e.preventDefault();
    onAddFuel(Number(buyQty), Number(buyCost), buyMethod);
    setBuyQty('');
    setBuyCost('');
    setBuyMethod(PaymentMethod.ESPECE);
    alert("Achat carburant enregistré ! Dépense ajoutée.");
  };

  const handleConsume = (e: React.FormEvent) => {
    e.preventDefault();
    if(Number(consoQty) > currentStock) {
        alert("Stock insuffisant !");
        return;
    }
    onConsumeFuel(consoVehicleId, Number(consoQty));
    setConsoQty('');
    alert("Consommation enregistrée !");
  };

  // Stats per vehicle
  const vehicleStats = vehicles.map(v => {
      const totalConsumed = logs
        .filter(l => l.type === 'CONSOMMATION' && l.vehicleId === v.id)
        .reduce((sum, l) => sum + l.quantity, 0);
      return { ...v, totalConsumed };
  }).sort((a,b) => b.totalConsumed - a.totalConsumed);

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Fuel className="text-orange-600"/> Gestion Carburant
              </h2>
              <p className="text-gray-500">Suivi Stock Usine & Consommation Flotte</p>
            </div>
        </div>

        {/* ALERTS & STOCK CARD */}
        <div className={`p-6 rounded-xl shadow-lg border-2 transition-all ${isLowStock ? 'bg-red-50 border-red-500' : 'bg-white border-gray-200'}`}>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className={`font-bold text-lg ${isLowStock ? 'text-red-700' : 'text-gray-700'}`}>
                        Stock Citerne Gasoil
                    </h3>
                    <p className="text-4xl font-bold mt-2 text-gray-800">{currentStock.toLocaleString()} <span className="text-lg font-normal text-gray-500">Litres</span></p>
                </div>
                {isLowStock ? (
                    <div className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg font-bold animate-pulse">
                        <AlertTriangle size={24}/> ATTENTION: STOCK BAS (&lt; 500L)
                    </div>
                ) : (
                    <div className="bg-green-100 text-green-700 p-3 rounded-full">
                        <Droplet size={32}/>
                    </div>
                )}
            </div>
            
            {/* Visual Bar */}
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div 
                   className={`h-full transition-all duration-1000 ${isLowStock ? 'bg-red-500' : 'bg-orange-500'}`}
                   style={{width: `${Math.min(100, (currentStock / tankCapacity) * 100)}%`}}
                ></div>
            </div>
            <p className="text-xs text-gray-400 mt-1 text-right">Capacité théorique: {tankCapacity} L</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* LEFT: ACTIONS */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="flex border-b">
                    <button 
                      onClick={() => setActiveTab('consume')}
                      className={`flex-1 p-4 font-bold text-sm flex items-center justify-center gap-2 ${activeTab === 'consume' ? 'bg-orange-50 text-orange-700 border-b-2 border-orange-600' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <Truck size={18}/> Remplir Véhicule
                    </button>
                    <button 
                      onClick={() => setActiveTab('buy')}
                      className={`flex-1 p-4 font-bold text-sm flex items-center justify-center gap-2 ${activeTab === 'buy' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <Plus size={18}/> Achat Stock (Usine)
                    </button>
                </div>

                <div className="p-6">
                    {activeTab === 'consume' ? (
                        <form onSubmit={handleConsume} className="space-y-4">
                            <div className="bg-orange-50 p-3 rounded text-sm text-orange-800 mb-4">
                                Enregistre une sortie de stock affectée à un camion spécifique.
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Véhicule</label>
                                <select 
                                  required
                                  value={consoVehicleId}
                                  onChange={e => setConsoVehicleId(e.target.value)}
                                  className="w-full border rounded-lg p-3 bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                                >
                                    <option value="">Sélectionner camion...</option>
                                    {vehicles.map(v => (
                                        <option key={v.id} value={v.id}>{v.plateNumber} - {v.driverName}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Quantité (Litres)</label>
                                <input 
                                  type="number" required min="1" max={currentStock}
                                  value={consoQty}
                                  onChange={e => setConsoQty(e.target.value)}
                                  className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-orange-500 outline-none"
                                  placeholder="Ex: 50"
                                />
                            </div>
                            <button type="submit" className="w-full bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700 transition-colors">
                                Valider Consommation
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleBuy} className="space-y-4">
                             <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 mb-4">
                                Enregistre un achat de carburant pour la cuve principale. Crée automatiquement une dépense.
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Quantité Achetée (Litres)</label>
                                <input 
                                  type="number" required min="1"
                                  value={buyQty}
                                  onChange={e => setBuyQty(e.target.value)}
                                  className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                                  placeholder="Ex: 1000"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Coût Total (MAD)</label>
                                <input 
                                  type="number" required min="1"
                                  value={buyCost}
                                  onChange={e => setBuyCost(e.target.value)}
                                  className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                                  placeholder="Ex: 12000"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Mode de Paiement</label>
                                <select
                                   value={buyMethod}
                                   onChange={e => setBuyMethod(e.target.value as PaymentMethod)}
                                   className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value={PaymentMethod.ESPECE}>Espèce (Caisse Entreprise)</option>
                                    <option value={PaymentMethod.TIERS}>Payé par Tiers (Externe)</option>
                                    <option value={PaymentMethod.CHEQUE}>Chèque</option>
                                    <option value={PaymentMethod.VIREMENT}>Virement</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">
                                Enregistrer Achat
                            </button>
                        </form>
                    )}
                </div>
            </div>

            {/* RIGHT: STATS PER VEHICLE */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="p-4 border-b bg-gray-50">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                        <History size={18}/> Consommation par Véhicule
                    </h3>
                </div>
                <div className="overflow-y-auto max-h-[400px]">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white text-gray-500 border-b sticky top-0">
                            <tr>
                                <th className="px-4 py-3">Véhicule</th>
                                <th className="px-4 py-3 text-right">Total Conso.</th>
                                <th className="px-4 py-3 text-right">% Flotte</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {vehicleStats.map(v => {
                                const totalSystem = logs.filter(l => l.type === 'CONSOMMATION').reduce((sum, l) => sum + l.quantity, 0);
                                const percentage = totalSystem > 0 ? (v.totalConsumed / totalSystem) * 100 : 0;
                                
                                return (
                                    <tr key={v.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="font-bold text-gray-800">{v.plateNumber}</div>
                                            <div className="text-xs text-gray-500">{v.driverName}</div>
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-orange-600">
                                            {v.totalConsumed.toLocaleString()} L
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <span className="text-xs text-gray-500">{percentage.toFixed(1)}%</span>
                                                <div className="w-16 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                                    <div className="bg-orange-400 h-full" style={{width: `${percentage}%`}}></div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {vehicleStats.length === 0 && (
                                <tr><td colSpan={3} className="p-4 text-center text-gray-400">Aucun véhicule.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        {/* LOGS HISTORY */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6">
            <div className="p-4 border-b bg-gray-50">
                <h3 className="font-bold text-gray-700">Journal des Mouvements (Derniers 50)</h3>
            </div>
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 border-b">
                    <tr>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Type</th>
                        <th className="px-6 py-3">Matricule</th>
                        <th className="px-6 py-3 text-right">Quantité</th>
                        <th className="px-6 py-3 text-right">Stock Après</th>
                        <th className="px-6 py-3 w-10"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {logs.slice(0, 50).map((log, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                            <td className="px-6 py-3 text-gray-600">{new Date(log.date).toLocaleDateString()} {new Date(log.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                            <td className="px-6 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                    log.type === 'ACHAT' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                                }`}>
                                    {log.type}
                                </span>
                            </td>
                            <td className="px-6 py-3">
                                {log.type === 'CONSOMMATION' ? (
                                    <span className="font-bold text-gray-800">{log.plateNumber || 'Inconnu'}</span>
                                ) : (
                                    <span className="text-gray-400">-</span>
                                )}
                                {log.driverName && <div className="text-xs text-gray-500">{log.driverName}</div>}
                            </td>
                            <td className={`px-6 py-3 text-right font-bold ${log.type === 'ACHAT' ? 'text-green-600' : 'text-red-500'}`}>
                                {log.type === 'ACHAT' ? '+' : '-'}{log.quantity} L
                            </td>
                            <td className="px-6 py-3 text-right text-gray-500 font-mono">
                                {log.currentStockAfter.toLocaleString()} L
                            </td>
                            <td className="px-6 py-3">
                                {canDelete && onDeleteLog && (
                                    <button 
                                        onClick={() => onDeleteLog(log.id)}
                                        className="text-gray-300 hover:text-red-500 transition-colors"
                                        title="Supprimer">
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                    {logs.length === 0 && (
                        <tr><td colSpan={6} className="p-8 text-center text-gray-400">Aucun historique.</td></tr>
                    )}
                </tbody>
            </table>
        </div>

    </div>
  );
};

export default FuelManager;
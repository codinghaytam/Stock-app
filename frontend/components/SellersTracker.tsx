import React, { useState, useMemo } from 'react';
import { Vehicle, Transaction, TransactionType, PaymentMethod } from '../types.ts';
import { Truck, TrendingUp, Users, Package, AlertCircle, Filter, Search, DollarSign } from 'lucide-react';

interface SellersTrackerProps {
  vehicles: Vehicle[];
  transactions: Transaction[];
}

const SellersTracker: React.FC<SellersTrackerProps> = ({ vehicles, transactions }) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all');
  const [filterClient, setFilterClient] = useState('');

  // Get only sellers/trucks
  const sellers = vehicles; // Assuming all vehicles can sell, or filter by type if needed

  // Filter transactions based on selection
  const filteredTransactions = useMemo(() => {
    let txs = transactions.filter(t => t.vehicleId); // Only mobile transactions
    if (selectedVehicleId !== 'all') {
      txs = txs.filter(t => t.vehicleId === selectedVehicleId);
    }
    return txs;
  }, [transactions, selectedVehicleId]);

  // Aggregate Data
  const stats = useMemo(() => {
    const totalSales = filteredTransactions
      .filter(t => t.type === TransactionType.VENTE)
      .reduce((acc, t) => acc + t.priceTotal, 0);

    const totalCashCollected = filteredTransactions
      .filter(t => t.type === TransactionType.VENTE)
      .reduce((acc, t) => acc + (t.amountPaid || 0), 0);

    const totalCreditGiven = filteredTransactions
      .filter(t => t.type === TransactionType.VENTE)
      .reduce((acc, t) => acc + (t.priceTotal - (t.amountPaid || 0)), 0);

    const totalDeposited = filteredTransactions
      .filter(t => t.type === TransactionType.VERSEMENT)
      .reduce((acc, t) => acc + t.priceTotal, 0);

    return { totalSales, totalCashCollected, totalCreditGiven, totalDeposited };
  }, [filteredTransactions]);

  // Client Analysis per Seller
  const clientsData = useMemo(() => {
    const clients: Record<string, {name: string, sales: number, paid: number, debt: number, lastDate: string}> = {};
    
    filteredTransactions
      .filter(t => t.type === TransactionType.VENTE)
      .forEach(t => {
         if(filterClient && !t.partnerName.toLowerCase().includes(filterClient.toLowerCase())) return;

         if(!clients[t.partnerName]) {
             clients[t.partnerName] = { name: t.partnerName, sales: 0, paid: 0, debt: 0, lastDate: t.date };
         }
         
         clients[t.partnerName].sales += t.priceTotal;
         clients[t.partnerName].paid += (t.amountPaid || 0);
         clients[t.partnerName].debt += (t.priceTotal - (t.amountPaid || 0));
         if(new Date(t.date) > new Date(clients[t.partnerName].lastDate)) {
             clients[t.partnerName].lastDate = t.date;
         }
      });

    return Object.values(clients).sort((a,b) => b.debt - a.debt);
  }, [filteredTransactions, filterClient]);

  const selectedVehicleData = vehicles.find(v => v.id === selectedVehicleId);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Suivi Vendeurs & Camions</h2>
          <p className="text-gray-500">Performance commerciale, crédits et stocks ambulants</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm">
            <Truck className="text-gray-400 ml-2" size={18}/>
            <select 
              className="p-2 bg-transparent outline-none text-sm font-medium"
              value={selectedVehicleId}
              onChange={e => setSelectedVehicleId(e.target.value)}
            >
                <option value="all">Tous les Vendeurs</option>
                {sellers.map(v => (
                    <option key={v.id} value={v.id}>{v.plateNumber} - {v.driverName}</option>
                ))}
            </select>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <p className="text-xs font-bold text-gray-500 uppercase">Chiffre d'Affaires</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.totalSales.toLocaleString()} DH</h3>
              <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp size={12}/> Total ventes
              </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <p className="text-xs font-bold text-gray-500 uppercase">En Caisse (Théorique)</p>
              <h3 className="text-2xl font-bold text-blue-600 mt-1">{(stats.totalCashCollected - stats.totalDeposited).toLocaleString()} DH</h3>
              <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                  Reçu: {stats.totalCashCollected.toLocaleString()} - Versé: {stats.totalDeposited.toLocaleString()}
              </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <p className="text-xs font-bold text-gray-500 uppercase">Crédits Clients (Dettes)</p>
              <h3 className="text-2xl font-bold text-red-500 mt-1">{stats.totalCreditGiven.toLocaleString()} DH</h3>
              <div className="mt-2 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle size={12}/> Non recouvré
              </div>
          </div>

           <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <p className="text-xs font-bold text-gray-500 uppercase">Versements Usine</p>
              <h3 className="text-2xl font-bold text-green-600 mt-1">{stats.totalDeposited.toLocaleString()} DH</h3>
              <div className="mt-2 text-xs text-green-500 flex items-center gap-1">
                  <DollarSign size={12}/> Argent remis
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT: STOCK CURRENTLY IN TRUCK (If single truck selected) */}
          <div className="lg:col-span-1 space-y-6">
              {selectedVehicleId !== 'all' && selectedVehicleData ? (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="p-4 bg-orange-50 border-b border-orange-100 flex justify-between items-center">
                          <h3 className="font-bold text-orange-900 flex items-center gap-2">
                              <Package size={18}/> Stock Actuel du Camion
                          </h3>
                      </div>
                      <div className="divide-y divide-gray-100">
                          {(selectedVehicleData.mobileStock || []).length === 0 && (
                              <p className="p-4 text-center text-gray-400 text-sm">Camion vide.</p>
                          )}
                          {(selectedVehicleData.mobileStock || []).map((item, i) => (
                              <div key={i} className="p-3 flex justify-between items-center text-sm">
                                  <div>
                                      <div className="font-bold text-gray-700">{item.brand}</div>
                                      <div className="text-xs text-gray-500">{item.bottleSize}</div>
                                  </div>
                                  <div className="bg-gray-100 px-3 py-1 rounded-full font-bold text-gray-700">
                                      {item.quantity}
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              ) : (
                  <div className="bg-blue-50 rounded-xl border border-blue-100 p-6 text-center text-blue-800">
                      <Truck size={40} className="mx-auto mb-2 opacity-50"/>
                      <p className="text-sm font-bold">Sélectionnez un vendeur spécifique pour voir son stock actuel en temps réel.</p>
                  </div>
              )}
          </div>

          {/* RIGHT: CLIENTS & DEBTS */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <h3 className="font-bold text-gray-700 flex items-center gap-2">
                      <Users size={18}/> Portefeuille Clients & Dettes
                  </h3>
                  <div className="relative w-full md:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                      <input 
                        type="text" 
                        placeholder="Filtrer client..." 
                        className="w-full pl-9 pr-3 py-1.5 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-olive-500"
                        value={filterClient}
                        onChange={e => setFilterClient(e.target.value)}
                      />
                  </div>
              </div>
              <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-gray-500 border-b">
                          <tr>
                              <th className="px-6 py-3 font-medium">Client</th>
                              <th className="px-6 py-3 font-medium text-right">Total Acheté</th>
                              <th className="px-6 py-3 font-medium text-right">Payé</th>
                              <th className="px-6 py-3 font-medium text-right">Reste (Crédit)</th>
                              <th className="px-6 py-3 font-medium">Dernière visite</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          {clientsData.length === 0 && (
                              <tr><td colSpan={5} className="p-8 text-center text-gray-400">Aucune donnée trouvée.</td></tr>
                          )}
                          {clientsData.map((client, idx) => (
                              <tr key={idx} className="hover:bg-gray-50">
                                  <td className="px-6 py-3 font-bold text-gray-800">{client.name}</td>
                                  <td className="px-6 py-3 text-right">{client.sales.toLocaleString()}</td>
                                  <td className="px-6 py-3 text-right text-green-600">{client.paid.toLocaleString()}</td>
                                  <td className="px-6 py-3 text-right">
                                      {client.debt > 0 ? (
                                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">
                                              {client.debt.toLocaleString()} DH
                                          </span>
                                      ) : (
                                          <span className="text-gray-400">-</span>
                                      )}
                                  </td>
                                  <td className="px-6 py-3 text-gray-500 text-xs">
                                      {new Date(client.lastDate).toLocaleDateString()}
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>

      </div>
    </div>
  );
};

export default SellersTracker;
import React, { useState, useEffect } from 'react';
import { Plus, FileSignature, Trash2, CheckCircle, AlertCircle, TrendingUp, DollarSign } from 'lucide-react';
import { Contract, ContractAllocation, Tank, ProductType } from '../types.ts';

// Helper for local storage
const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
};

interface ContractManagerProps {
  tanks: Tank[];
  onUpdateTank: (tankId: string, quantityChange: number) => void; // Negative to remove from tank
  username: string;
}

export default function ContractManager({ tanks, onUpdateTank, username }: ContractManagerProps) {
  const [contracts, setContracts] = useLocalStorage<Contract[]>('contracts', []);
  const [showForm, setShowForm] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  // New Contract Form State
  const [newContract, setNewContract] = useState<Partial<Contract>>({
    clientName: '',
    productType: ProductType.HUILE_VRAC,
    targetQuantity: 0,
    targetAcidity: 0.8,
    targetWaxes: 250,
    priceSell: 0,
    status: 'En Cours',
    allocations: []
  });

  // Allocation Form State
  const [allocationData, setAllocationData] = useState({
    tankId: '',
    quantity: 0,
    costPrice: 0
  });

  const handleCreateContract = () => {
    if (!newContract.clientName || !newContract.targetQuantity || !newContract.priceSell) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    const contract: Contract = {
      id: `CTR-${Date.now()}`,
      createdAt: new Date().toISOString(),
      clientName: newContract.clientName!,
      productType: newContract.productType || ProductType.HUILE_VRAC,
      targetQuantity: Number(newContract.targetQuantity),
      targetAcidity: Number(newContract.targetAcidity),
      targetWaxes: Number(newContract.targetWaxes),
      priceSell: Number(newContract.priceSell),
      status: 'En Cours',
      allocations: []
    };

    setContracts([contract, ...contracts]);
    setShowForm(false);
    setNewContract({
      clientName: '',
      productType: ProductType.HUILE_VRAC,
      targetQuantity: 0,
      targetAcidity: 0.8,
      targetWaxes: 250,
      priceSell: 0,
      status: 'En Cours',
      allocations: []
    });
  };

  const handleDeleteContract = (id: string) => {
    if (window.confirm("Supprimer ce contrat ? Attention, les allocations ne seront pas remises en stock automatiquement.")) {
      setContracts(contracts.filter(c => c.id !== id));
      if (selectedContract?.id === id) setSelectedContract(null);
    }
  };

  const handleAllocateStock = () => {
    if (!selectedContract || !allocationData.tankId || !allocationData.quantity) return;

    const tank = tanks.find(t => t.id === allocationData.tankId);
    if (!tank) return;

    if (tank.currentLevel < allocationData.quantity) {
      alert("Stock insuffisant dans la citerne sélectionnée !");
      return;
    }

    // 1. Create Allocation Record
    const allocation: ContractAllocation = {
      id: `ALL-${Date.now()}`,
      date: new Date().toISOString(),
      sourceId: tank.id,
      sourceName: tank.name,
      quantity: Number(allocationData.quantity),
      acidity: tank.acidity,
      waxes: tank.waxes,
      costPrice: Number(allocationData.costPrice)
    };

    // 2. Update Contract
    const updatedContract = {
      ...selectedContract,
      allocations: [...selectedContract.allocations, allocation]
    };

    // Check if completed
    const totalAllocated = updatedContract.allocations.reduce((sum, a) => sum + a.quantity, 0);
    if (totalAllocated >= updatedContract.targetQuantity) {
      updatedContract.status = 'Terminé';
    }

    setContracts(contracts.map(c => c.id === selectedContract.id ? updatedContract : c));
    setSelectedContract(updatedContract);

    // 3. Update Physical Tank (Decrease Level)
    onUpdateTank(tank.id, -Number(allocationData.quantity));

    // Reset Form
    setAllocationData({ tankId: '', quantity: 0, costPrice: 0 });
    alert("Stock alloué avec succès !");
  };

  // Calculations for Selected Contract
  const calculateStats = (contract: Contract) => {
    const totalAllocated = contract.allocations.reduce((sum, a) => sum + a.quantity, 0);
    const progress = Math.min(100, (totalAllocated / contract.targetQuantity) * 100);
    
    // Weighted Averages
    let avgAcidity = 0;
    let avgWaxes = 0;
    let totalCost = 0;

    if (totalAllocated > 0) {
      avgAcidity = contract.allocations.reduce((sum, a) => sum + (a.acidity * a.quantity), 0) / totalAllocated;
      avgWaxes = contract.allocations.reduce((sum, a) => sum + (a.waxes * a.quantity), 0) / totalAllocated;
      totalCost = contract.allocations.reduce((sum, a) => sum + (a.costPrice * a.quantity), 0);
    }

    const totalRevenue = totalAllocated * contract.priceSell;
    const profit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    return { totalAllocated, progress, avgAcidity, avgWaxes, totalCost, totalRevenue, profit, profitMargin };
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileSignature className="text-olive-600" />
            Suivi des Contrats
          </h1>
          <p className="text-gray-500">Gérez vos engagements clients et suivez la rentabilité.</p>
        </div>
        {!showForm && !selectedContract && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-olive-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-olive-700 transition"
          >
            <Plus size={20} />
            Nouveau Contrat
          </button>
        )}
      </div>

      {showForm ? (
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Nouveau Contrat</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
              <input
                type="text"
                value={newContract.clientName}
                onChange={e => setNewContract({ ...newContract, clientName: e.target.value })}
                className="w-full p-2 border rounded-lg"
                placeholder="Nom du client"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantité Cible (kg/L)</label>
              <input
                type="number"
                value={newContract.targetQuantity}
                onChange={e => setNewContract({ ...newContract, targetQuantity: Number(e.target.value) })}
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prix de Vente (DH/Unit)</label>
              <input
                type="number"
                value={newContract.priceSell}
                onChange={e => setNewContract({ ...newContract, priceSell: Number(e.target.value) })}
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Acidité Max (%)</label>
              <input
                type="number"
                step="0.1"
                value={newContract.targetAcidity}
                onChange={e => setNewContract({ ...newContract, targetAcidity: Number(e.target.value) })}
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cires Max (mg/kg)</label>
              <input
                type="number"
                value={newContract.targetWaxes}
                onChange={e => setNewContract({ ...newContract, targetWaxes: Number(e.target.value) })}
                className="w-full p-2 border rounded-lg"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Annuler</button>
            <button onClick={handleCreateContract} className="px-6 py-2 bg-olive-600 text-white rounded-lg hover:bg-olive-700">Créer</button>
          </div>
        </div>
      ) : selectedContract ? (
        <div className="space-y-6">
          <button onClick={() => setSelectedContract(null)} className="text-olive-600 hover:underline mb-2 flex items-center gap-1">
            &larr; Retour à la liste
          </button>

          {/* Contract Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedContract.clientName}</h2>
                <p className="text-gray-500 text-sm">Créé le {new Date(selectedContract.createdAt).toLocaleDateString()}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-bold ${selectedContract.status === 'Terminé' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                {selectedContract.status}
              </div>
            </div>

            {/* Progress Bar */}
            {(() => {
              const stats = calculateStats(selectedContract);
              return (
                <div className="mb-8">
                  <div className="flex justify-between text-sm font-medium text-gray-600 mb-2">
                    <span>Progression: {stats.totalAllocated.toFixed(0)} / {selectedContract.targetQuantity} {selectedContract.productType === ProductType.HUILE_VRAC ? 'kg' : 'unités'}</span>
                    <span>{stats.progress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div 
                      className={`h-4 rounded-full transition-all duration-500 ${stats.progress >= 100 ? 'bg-green-500' : 'bg-olive-500'}`} 
                      style={{ width: `${stats.progress}%` }}
                    ></div>
                  </div>
                </div>
              );
            })()}

            {/* KPI Cards */}
            {(() => {
              const stats = calculateStats(selectedContract);
              const isAcidityGood = stats.avgAcidity <= selectedContract.targetAcidity;
              const isWaxesGood = stats.avgWaxes <= selectedContract.targetWaxes;

              return (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className={`p-4 rounded-lg border ${isAcidityGood ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <p className="text-xs text-gray-500 uppercase font-bold">Acidité Moyenne</p>
                    <p className={`text-2xl font-bold ${isAcidityGood ? 'text-green-700' : 'text-red-700'}`}>
                      {stats.avgAcidity.toFixed(2)}%
                    </p>
                    <p className="text-xs text-gray-400">Cible: &le; {selectedContract.targetAcidity}%</p>
                  </div>

                  <div className={`p-4 rounded-lg border ${isWaxesGood ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <p className="text-xs text-gray-500 uppercase font-bold">Cires Moyennes</p>
                    <p className={`text-2xl font-bold ${isWaxesGood ? 'text-green-700' : 'text-red-700'}`}>
                      {stats.avgWaxes.toFixed(0)} mg/kg
                    </p>
                    <p className="text-xs text-gray-400">Cible: &le; {selectedContract.targetWaxes}</p>
                  </div>

                  {/* MOJO ONLY SECTION */}
                  {username === 'mojo' && (
                    <>
                      <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
                        <p className="text-xs text-blue-500 uppercase font-bold">Coût Moyen / Unité</p>
                        <p className="text-2xl font-bold text-blue-700">
                          {(stats.totalAllocated > 0 ? (stats.totalCost / stats.totalAllocated) : 0).toFixed(2)} DH
                        </p>
                        <p className="text-xs text-blue-400">Prix Vente: {selectedContract.priceSell} DH</p>
                      </div>

                      <div className="p-4 rounded-lg border bg-purple-50 border-purple-200">
                        <p className="text-xs text-purple-500 uppercase font-bold">Bénéfice Net</p>
                        <p className="text-2xl font-bold text-purple-700">
                          {stats.profit.toFixed(2)} DH
                        </p>
                        <p className="text-xs text-purple-400">Marge: {stats.profitMargin.toFixed(1)}%</p>
                      </div>
                    </>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Allocation Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Allocation Form */}
            <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <CheckCircle size={20} className="text-olive-600" />
                Allouer du Stock
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source (Citerne)</label>
                  <select
                    value={allocationData.tankId}
                    onChange={e => setAllocationData({ ...allocationData, tankId: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="">Sélectionner une citerne...</option>
                    {tanks.filter(t => t.currentLevel > 0).map(tank => (
                      <option key={tank.id} value={tank.id}>
                        {tank.name} ({tank.currentLevel}L - A:{tank.acidity}% - C:{tank.waxes})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantité à allouer</label>
                  <input
                    type="number"
                    value={allocationData.quantity}
                    onChange={e => setAllocationData({ ...allocationData, quantity: Number(e.target.value) })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix de Revient (Coût/Unité)</label>
                  <input
                    type="number"
                    value={allocationData.costPrice}
                    onChange={e => setAllocationData({ ...allocationData, costPrice: Number(e.target.value) })}
                    className="w-full p-2 border rounded-lg"
                    placeholder="Ex: 45 DH"
                  />
                  <p className="text-xs text-gray-400 mt-1">Nécessaire pour le calcul de rentabilité.</p>
                </div>
                <button
                  onClick={handleAllocateStock}
                  disabled={!allocationData.tankId || !allocationData.quantity}
                  className="w-full bg-olive-600 text-white py-2 rounded-lg hover:bg-olive-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Valider l'allocation
                </button>
              </div>
            </div>

            {/* Allocation History */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Historique des Allocations</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Source</th>
                      <th className="px-4 py-2 text-right">Qté</th>
                      <th className="px-4 py-2 text-right">Acidité</th>
                      <th className="px-4 py-2 text-right">Cires</th>
                      {username === 'mojo' && <th className="px-4 py-2 text-right">Coût</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedContract.allocations.map(alloc => (
                      <tr key={alloc.id}>
                        <td className="px-4 py-2">{new Date(alloc.date).toLocaleDateString()}</td>
                        <td className="px-4 py-2">{alloc.sourceName}</td>
                        <td className="px-4 py-2 text-right font-medium">{alloc.quantity}</td>
                        <td className="px-4 py-2 text-right">{alloc.acidity}%</td>
                        <td className="px-4 py-2 text-right">{alloc.waxes}</td>
                        {username === 'mojo' && <td className="px-4 py-2 text-right">{alloc.costPrice} DH</td>}
                      </tr>
                    ))}
                    {selectedContract.allocations.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">Aucune allocation pour le moment.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* List View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contracts.map(contract => {
            const stats = calculateStats(contract);
            return (
              <div 
                key={contract.id} 
                onClick={() => setSelectedContract(contract)}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800 group-hover:text-olive-700">{contract.clientName}</h3>
                    <p className="text-sm text-gray-500">Cible: {contract.targetQuantity} {contract.productType === ProductType.HUILE_VRAC ? 'kg' : 'unités'}</p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-bold ${contract.status === 'Terminé' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                    {contract.status}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progression</span>
                    <span>{stats.progress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className={`h-2 rounded-full ${stats.progress >= 100 ? 'bg-green-500' : 'bg-olive-500'}`} style={{ width: `${stats.progress}%` }}></div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm border-t pt-4">
                  <div className="flex gap-4">
                    <div className="text-center">
                      <p className="text-xs text-gray-400">Acidité</p>
                      <p className={`font-bold ${stats.avgAcidity > contract.targetAcidity ? 'text-red-600' : 'text-green-600'}`}>
                        {stats.avgAcidity.toFixed(2)}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400">Cires</p>
                      <p className={`font-bold ${stats.avgWaxes > contract.targetWaxes ? 'text-red-600' : 'text-green-600'}`}>
                        {stats.avgWaxes.toFixed(0)}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteContract(contract.id); }}
                    className="text-gray-400 hover:text-red-500 p-2"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
          
          {contracts.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
              <FileSignature size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Aucun contrat actif. Créez-en un nouveau pour commencer le suivi.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { Tank, StockItem, ProductType, Brand, BottleSize } from '../types.ts';
import { Droplet, Package, Trash2, Plus, X } from 'lucide-react';

interface StockManagerProps {
  tanks: Tank[];
  stockItems: StockItem[];
  onAddTank: (tank: Tank) => void;
  onAddStock: (item: StockItem) => void;
  onTransferOil: (fromTankId: string, toTankId: string, quantity: number) => void;
  onDeleteTank?: (id: string) => void;
  onDeleteStock?: (id: string) => void;
  username?: string;
}

const StockManager: React.FC<StockManagerProps> = ({ tanks, stockItems, onAddTank, onAddStock, onTransferOil, onDeleteTank, onDeleteStock, username }) => {
  const [showAddTank, setShowAddTank] = useState(false);
  const [showAddStock, setShowAddStock] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);

  // Form states
  const [newTank, setNewTank] = useState({ name: '', capacity: 10000 });
  const [transferData, setTransferData] = useState({ fromTankId: '', toTankId: '', quantity: 0 });
  const [newStock, setNewStock] = useState<{
    type: ProductType;
    quantity: number;
    brand: Brand;
    bottleSize: BottleSize;
    unit: 'kg' | 'L' | 'unités';
  }>({
    type: ProductType.OLIVE,
    quantity: 0,
    brand: Brand.ZITLBLAD,
    bottleSize: '1L',
    unit: 'kg'
  });
  
  const bottles = stockItems.filter(i => i.type === ProductType.HUILE_BOUTEILLE);
  const rawMaterials = stockItems.filter(i => [ProductType.OLIVE, ProductType.NOYAUX].includes(i.type));
  const waste = stockItems.filter(i => [ProductType.GRIGNONS, ProductType.FITOUR].includes(i.type));

  const canDelete = username && ['mojo', 'boss', 'hajar', 'safae', 'ZITLBLAD1'].includes(username);

  const handleCreateTank = (e: React.FormEvent) => {
    e.preventDefault();
    onAddTank({
      id: `T${Date.now()}`,
      name: newTank.name,
      capacity: newTank.capacity,
      currentLevel: 0,
      acidity: 0,
      waxes: 0,
      avgCost: 0,
      status: 'Empty'
    });
    setShowAddTank(false);
    setNewTank({ name: '', capacity: 10000 });
  };

  const handleCreateStock = (e: React.FormEvent) => {
    e.preventDefault();
    const isBottle = newStock.type === ProductType.HUILE_BOUTEILLE;
    const name = isBottle 
      ? `${newStock.brand} ${newStock.bottleSize}` 
      : newStock.type;

    onAddStock({
      id: `S${Date.now()}`,
      name,
      type: newStock.type,
      quantity: newStock.quantity,
      unit: isBottle ? 'unités' : 'kg',
      brand: isBottle ? newStock.brand : undefined,
      bottleSize: isBottle ? newStock.bottleSize : undefined
    });
    setShowAddStock(false);
  };

  return (
    <div className="space-y-8">
      
      {/* Tanks Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Droplet className="text-olive-600" />
            Parc de Citernes (Vrac)
          </h2>
          <button 
            onClick={() => setShowAddTank(true)}
            className="text-sm bg-olive-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-olive-700 flex items-center gap-2 shadow-sm"
          >
            <Plus size={16} /> Nouvelle Citerne
          </button>
          <button 
            onClick={() => setShowTransfer(true)}
            className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2 shadow-sm"
          >
            <Droplet size={16} /> Transférer Huile
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tanks.length === 0 && <div className="col-span-3 text-center py-8 text-gray-400 bg-gray-50 rounded-lg border border-dashed">Aucune citerne. Ajoutez-en une pour commencer.</div>}
          {tanks.map(tank => {
            const percentage = (tank.currentLevel / tank.capacity) * 100;
            return (
              <div key={tank.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative group">
                <div className="absolute right-0 top-0 h-full w-2 bg-gray-100">
                   <div 
                      className="bg-olive-500 w-full absolute bottom-0 transition-all duration-1000"
                      style={{ height: `${percentage}%` }}
                   />
                </div>
                {canDelete && onDeleteTank && (
                    <button 
                        onClick={() => onDeleteTank(tank.id)}
                        className="absolute top-2 right-4 bg-white p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10"
                    >
                        <Trash2 size={16}/>
                    </button>
                )}
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-lg text-gray-800">{tank.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      tank.status === 'Full' ? 'bg-red-100 text-red-700' :
                      tank.status === 'Empty' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'
                    }`}>
                      {tank.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Volume</span>
                      <span className="font-mono font-medium">{tank.currentLevel.toLocaleString()} / {tank.capacity.toLocaleString()} L</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Acidité Moyenne</span>
                      <span className="font-mono font-medium text-amber-600">{tank.acidity}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Cires Moyennes</span>
                      <span className="font-mono font-medium text-amber-600">{tank.waxes} mg/kg</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t mt-2">
                      <span className="text-gray-700 font-bold">Valeur du Stock</span>
                      <span className="font-mono font-bold text-olive-700">{(tank.currentLevel * tank.avgCost).toLocaleString()} DH</span>
                    </div>
                    <div className="text-[10px] text-gray-400 text-right">
                      (Moy: {tank.avgCost} DH/L)
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottled Products */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="text-olive-600" />
            Produits Conditionnés (Marques)
          </h2>
          <button 
             onClick={() => {
               setNewStock(prev => ({...prev, type: ProductType.HUILE_BOUTEILLE}));
               setShowAddStock(true);
             }}
             className="text-sm bg-olive-100 text-olive-700 px-3 py-1 rounded-md font-medium hover:bg-olive-200"
          >
            + Stock Bouteilles
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {bottles.length === 0 && <div className="col-span-full text-center py-4 text-gray-400">Aucun stock de bouteilles.</div>}
          {bottles.map(b => (
            <div key={b.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between group">
                <div>
                  <h4 className="font-bold text-gray-800">{b.brand}</h4>
                  <p className="text-sm text-gray-500">{b.bottleSize}</p>
                </div>
                <div className="text-right">
                  <span className="block text-2xl font-bold text-olive-600">{b.quantity}</span>
                  <div className="flex justify-end gap-1 items-center">
                      <span className="text-xs text-gray-400">unités</span>
                      {canDelete && onDeleteStock && (
                        <button 
                            onClick={() => onDeleteStock(b.id)} 
                            className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 size={12}/>
                        </button>
                      )}
                  </div>
                </div>
            </div>
          ))}
        </div>
      </section>

      {/* Raw Material & Waste */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="flex justify-between items-center mb-3">
             <h2 className="text-lg font-bold text-gray-800">Matières Premières</h2>
             <button 
               onClick={() => {
                 setNewStock(prev => ({...prev, type: ProductType.OLIVE}));
                 setShowAddStock(true);
               }}
               className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
             >
               + Ajouter
             </button>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden min-h-[100px]">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Quantité</th>
                  <th className="px-4 py-3">Unité</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rawMaterials.map(item => (
                  <tr key={item.id} className="group">
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3 text-right font-mono">{item.quantity.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-500">{item.unit}</td>
                    <td className="px-2">
                        {canDelete && onDeleteStock && (
                            <button onClick={() => onDeleteStock(item.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100">
                                <Trash2 size={14}/>
                            </button>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
             <h2 className="text-lg font-bold text-gray-800">Déchets & Sous-produits</h2>
             <button 
               onClick={() => {
                 setNewStock(prev => ({...prev, type: ProductType.GRIGNONS}));
                 setShowAddStock(true);
               }}
               className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
             >
               + Ajouter
             </button>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden min-h-[100px]">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Quantité</th>
                  <th className="px-4 py-3">Unité</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {waste.map(item => (
                  <tr key={item.id} className="group">
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3 text-right font-mono">{item.quantity.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-500">{item.unit}</td>
                    <td className="px-2">
                        {canDelete && onDeleteStock && (
                            <button onClick={() => onDeleteStock(item.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100">
                                <Trash2 size={14}/>
                            </button>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* MODAL: ADD TANK */}
      {showAddTank && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">Ajouter une Citerne</h3>
            <form onSubmit={handleCreateTank} className="space-y-4">
               <div>
                 <label className="block text-sm text-gray-700">Nom / Référence</label>
                 <input 
                   required
                   className="w-full border rounded p-2" 
                   value={newTank.name} 
                   onChange={e => setNewTank({...newTank, name: e.target.value})}
                   placeholder="Ex: Citerne A1"
                 />
               </div>
               <div>
                 <label className="block text-sm text-gray-700">Capacité (Litres)</label>
                 <input 
                   type="number" required
                   className="w-full border rounded p-2" 
                   value={newTank.capacity} 
                   onChange={e => setNewTank({...newTank, capacity: Number(e.target.value)})}
                 />
               </div>
               <div className="flex justify-end gap-2 pt-2">
                 <button type="button" onClick={() => setShowAddTank(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Annuler</button>
                 <button type="submit" className="px-4 py-2 bg-olive-600 text-white rounded hover:bg-olive-700">Créer</button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD STOCK */}
      {showAddStock && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Ajouter au Stock</h3>
              <button onClick={() => setShowAddStock(false)}><X size={20} className="text-gray-400"/></button>
            </div>
            <form onSubmit={handleCreateStock} className="space-y-4">
               <div>
                 <label className="block text-sm text-gray-700 mb-1">Type de Produit</label>
                 <select 
                    className="w-full border rounded p-2 bg-white"
                    value={newStock.type}
                    onChange={e => setNewStock({...newStock, type: e.target.value as ProductType})}
                 >
                   {Object.values(ProductType).filter(t => t !== ProductType.HUILE_VRAC).map(t => (
                     <option key={t} value={t}>{t}</option>
                   ))}
                 </select>
               </div>

               {newStock.type === ProductType.HUILE_BOUTEILLE && (
                 <>
                   <div>
                     <label className="block text-sm text-gray-700 mb-1">Marque</label>
                     <select 
                        className="w-full border rounded p-2 bg-white"
                        value={newStock.brand}
                        onChange={e => setNewStock({...newStock, brand: e.target.value as Brand})}
                     >
                       {Object.values(Brand).map(b => <option key={b} value={b}>{b}</option>)}
                     </select>
                   </div>
                   <div>
                     <label className="block text-sm text-gray-700 mb-1">Format</label>
                     <select 
                        className="w-full border rounded p-2 bg-white"
                        value={newStock.bottleSize}
                        onChange={e => setNewStock({...newStock, bottleSize: e.target.value as BottleSize})}
                     >
                       <option value="1L">1L</option>
                       <option value="1/2 L">1/2 L</option>
                       <option value="2L">2L</option>
                       <option value="5L">5L</option>
                     </select>
                   </div>
                 </>
               )}

               <div>
                 <label className="block text-sm text-gray-700">Quantité Initiale ({newStock.type === ProductType.HUILE_BOUTEILLE ? 'unités' : 'kg'})</label>
                 <input 
                   type="number" required
                   className="w-full border rounded p-2" 
                   value={newStock.quantity} 
                   onChange={e => setNewStock({...newStock, quantity: Number(e.target.value)})}
                 />
               </div>
               
               <button type="submit" className="w-full py-2 bg-olive-600 text-white rounded hover:bg-olive-700">Ajouter au Stock</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TRANSFER OIL */}
      {showTransfer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Transférer de l'Huile</h3>
              <button onClick={() => setShowTransfer(false)}><X size={20} className="text-gray-400"/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Citerne Source (De)</label>
                <select 
                  className="w-full border rounded p-2 bg-white"
                  value={transferData.fromTankId}
                  onChange={e => setTransferData({...transferData, fromTankId: e.target.value})}
                >
                  <option value="">Choisir la source...</option>
                  {tanks.filter(t => t.currentLevel > 0).map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.currentLevel}L)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Citerne Destination (À)</label>
                <select 
                  className="w-full border rounded p-2 bg-white"
                  value={transferData.toTankId}
                  onChange={e => setTransferData({...transferData, toTankId: e.target.value})}
                >
                  <option value="">Choisir la destination...</option>
                  {tanks.filter(t => t.id !== transferData.fromTankId).map(t => (
                    <option key={t.id} value={t.id}>{t.name} (Libre: {t.capacity - t.currentLevel}L)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Quantité à transférer (L)</label>
                <input 
                  type="number"
                  className="w-full border rounded p-2"
                  value={transferData.quantity}
                  onChange={e => setTransferData({...transferData, quantity: Number(e.target.value)})}
                  max={tanks.find(t => t.id === transferData.fromTankId)?.currentLevel || 0}
                />
              </div>
              <button 
                onClick={() => {
                  if (!transferData.fromTankId || !transferData.toTankId || transferData.quantity <= 0) {
                    alert("Veuillez remplir tous les champs.");
                    return;
                  }
                  onTransferOil(transferData.fromTankId, transferData.toTankId, transferData.quantity);
                  setShowTransfer(false);
                  setTransferData({ fromTankId: '', toTankId: '', quantity: 0 });
                }}
                className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold"
              >
                Confirmer le Transfert
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StockManager;
import React, { useState } from 'react';
import { StockItem, Tank, ProductType } from '../types.ts';
import { Factory, ArrowRight, Droplet, Archive, Play, AlertCircle, Trash2 } from 'lucide-react';

interface ProductionManagerProps {
  stockItems: StockItem[];
  tanks: Tank[];
  onProduction: (data: any) => void;
}

const ProductionManager: React.FC<ProductionManagerProps> = ({ stockItems, tanks, onProduction }) => {
  // Inputs
  const [inputStockId, setInputStockId] = useState('');
  const [inputQuantity, setInputQuantity] = useState(0);

  // Outputs - Oil
  const [outputTankId, setOutputTankId] = useState('');
  const [outputOilQty, setOutputOilQty] = useState(0);
  const [acidity, setAcidity] = useState(0.8);
  const [waxes, setWaxes] = useState(120);

  // Outputs - Waste (Double output support)
  const [wasteGrignons, setWasteGrignons] = useState(0);
  const [wasteFitour, setWasteFitour] = useState(0);

  const rawMaterials = stockItems.filter(s => s.type === ProductType.OLIVE || s.type === ProductType.NOYAUX);
  const availableTanks = tanks.filter(t => t.status !== 'Full' && t.status !== 'Maintenance');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputStockId || !outputTankId) return;

    onProduction({
      date: new Date().toISOString(),
      inputStockId,
      inputQuantity,
      outputTankId,
      outputOilQty,
      acidity,
      waxes,
      wasteGrignons,
      wasteFitour
    });

    // Reset most fields
    setInputQuantity(0);
    setOutputOilQty(0);
    setWasteGrignons(0);
    setWasteFitour(0);
    alert("Production enregistrée avec succès ! Stocks et citernes mis à jour.");
  };

  const selectedInput = stockItems.find(s => s.id === inputStockId);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestion de Production</h2>
          <p className="text-gray-500">Transformation: Matière Première → Huile & Déchets</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
          
          {/* SECTION 1: INPUT */}
          <div className="p-6 space-y-4 bg-orange-50/30">
            <h3 className="font-bold text-orange-800 flex items-center gap-2">
              <Archive size={20} /> Entrée (Matière)
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source (Stock)</label>
              <select 
                required
                value={inputStockId}
                onChange={e => setInputStockId(e.target.value)}
                className="w-full border rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-orange-500 outline-none"
              >
                <option value="">Sélectionner Olive ou Noyaux...</option>
                {rawMaterials.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.quantity} kg dispo)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantité Traitée (kg)</label>
              <input 
                type="number" 
                required
                min="1"
                max={selectedInput ? selectedInput.quantity : undefined}
                value={inputQuantity}
                onChange={e => setInputQuantity(Number(e.target.value))}
                className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="0"
              />
              {selectedInput && inputQuantity > selectedInput.quantity && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={10} /> Quantité insuffisante en stock
                </p>
              )}
            </div>
          </div>

          {/* SECTION 2: OUTPUT OIL */}
          <div className="p-6 space-y-4 bg-green-50/30 relative">
             <div className="hidden lg:block absolute top-1/2 -left-3 bg-white p-1 rounded-full border border-gray-200 text-gray-400 z-10">
               <ArrowRight size={16} />
             </div>

            <h3 className="font-bold text-green-800 flex items-center gap-2">
              <Droplet size={20} /> Sortie (Huile)
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Citerne de Destination</label>
              <select 
                required
                value={outputTankId}
                onChange={e => setOutputTankId(e.target.value)}
                className="w-full border rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-green-500 outline-none"
              >
                <option value="">Choisir une citerne...</option>
                {availableTanks.map(tank => (
                  <option key={tank.id} value={tank.id}>
                    {tank.name} (Libre: {tank.capacity - tank.currentLevel} L)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantité Produite (L)</label>
              <input 
                type="number" 
                required
                min="1"
                value={outputOilQty}
                onChange={e => setOutputOilQty(Number(e.target.value))}
                className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="0"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Acidité (%)</label>
                <input 
                  type="number" 
                  step="0.1"
                  required
                  value={acidity}
                  onChange={e => setAcidity(Number(e.target.value))}
                  className="w-full border rounded-lg p-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Cires (mg/kg)</label>
                <input 
                  type="number" 
                  required
                  value={waxes}
                  onChange={e => setWaxes(Number(e.target.value))}
                  className="w-full border rounded-lg p-2 text-sm"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: OUTPUT WASTE (DUAL OUTPUT) */}
          <div className="p-6 space-y-4 bg-gray-50/50">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
              <Trash2 size={20} /> Sortie (Déchets)
            </h3>
            
            <p className="text-xs text-gray-500">Renseignez les quantités générées pour les stocks.</p>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grignons (kg)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={wasteGrignons}
                    onChange={e => setWasteGrignons(Number(e.target.value))}
                    className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-gray-400 outline-none"
                    placeholder="0"
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fitour (kg)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={wasteFitour}
                    onChange={e => setWasteFitour(Number(e.target.value))}
                    className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-gray-400 outline-none"
                    placeholder="0"
                  />
               </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t flex justify-end">
          <button 
             type="submit"
             disabled={!inputStockId || !outputTankId || outputOilQty <= 0}
             className="bg-olive-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-olive-700 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Play size={20} /> Valider la Production
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductionManager;
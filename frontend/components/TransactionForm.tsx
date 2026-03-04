import React, { useState, useEffect } from 'react';
import { ProductType, TransactionType, Brand, Tank, Vehicle, PaymentMethod, PaymentStatus, Currency, BankAccount } from '../types.ts';
import { Save, X, Truck, Globe, Landmark, Layers, AlertTriangle, UserCheck } from 'lucide-react';

interface TransactionFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  tanks: Tank[];
  vehicles: Vehicle[];
  bankAccounts: BankAccount[];
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onSubmit, onCancel, tanks, vehicles, bankAccounts }) => {
  const [type, setType] = useState<TransactionType>(TransactionType.VENTE);
  const [productType, setProductType] = useState<ProductType>(ProductType.HUILE_VRAC);
  const [quantity, setQuantity] = useState<number>(0);
  const [partner, setPartner] = useState('');
  
  // Pricing & Currency
  const [currency, setCurrency] = useState<Currency>(Currency.MAD);
  const [price, setPrice] = useState<number>(0); 
  const [exchangeRate, setExchangeRate] = useState<number>(1);

  // Payment Details
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.ESPECE);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.PAYE);
  const [amountPaid, setAmountPaid] = useState<number>(0); 
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>('');
  const [payerName, setPayerName] = useState(''); // New for Tiers

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [externalTruckPlate, setExternalTruckPlate] = useState<string>('');
  
  // Multi-Tank Logic
  const [useMultiTank, setUseMultiTank] = useState(false);
  const [singleTankId, setSingleTankId] = useState<string>('');
  const [distributions, setDistributions] = useState<{tankId: string, quantity: number}[]>([{tankId: '', quantity: 0}]);

  // Specific for Bulk
  const [acidity, setAcidity] = useState<string>('');
  const [waxes, setWaxes] = useState<string>('');
  
  // Specific for Bottles
  const [brand, setBrand] = useState<Brand>(Brand.ZITLBLAD);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate Multi-Tank
    let finalDistributions = undefined;
    if (productType === ProductType.HUILE_VRAC) {
        if (useMultiTank) {
            const totalDistributed = distributions.reduce((acc, curr) => acc + curr.quantity, 0);
            if (totalDistributed !== quantity) {
                alert(`Le total réparti (${totalDistributed} L) ne correspond pas à la quantité globale (${quantity} L).`);
                return;
            }
            if (distributions.some(d => !d.tankId)) {
                alert("Veuillez sélectionner une citerne pour chaque ligne.");
                return;
            }
            finalDistributions = distributions;
        } else {
            if (!singleTankId) {
                alert("Veuillez sélectionner une citerne.");
                return;
            }
            finalDistributions = [{ tankId: singleTankId, quantity: quantity }];
        }
    }

    let details = '';
    if (productType === ProductType.HUILE_VRAC) {
      details = `Acidité: ${acidity}%, Cires: ${waxes}`;
    } else if (productType === ProductType.HUILE_BOUTEILLE) {
      details = `Marque: ${brand}`;
    }

    // Append External Payer info to details
    if (paymentMethod === PaymentMethod.TIERS && payerName) {
        details += ` | Payé par: ${payerName}`;
    }

    // Get plate from internal vehicle if selected
    const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
    const finalPlate = selectedVehicle ? selectedVehicle.plateNumber : externalTruckPlate;

    // Financial Conversions
    const finalPriceTotalInMAD = price * exchangeRate;
    const finalAmountPaidInOriginal = paymentStatus === PaymentStatus.PAYE ? price : amountPaid;
    const finalAmountPaidInMAD = finalAmountPaidInOriginal * exchangeRate;

    onSubmit({
      date: new Date().toISOString(),
      type,
      productType,
      quantity,
      unit: productType === ProductType.HUILE_BOUTEILLE ? 'unités' : (productType === ProductType.HUILE_VRAC ? 'L' : 'kg'),
      
      priceTotal: finalPriceTotalInMAD, 
      originalAmount: price, 
      currency,
      exchangeRate,

      partnerName: partner,
      truckPlate: finalPlate,
      vehicleId: selectedVehicleId || undefined,
      tankId: useMultiTank ? undefined : singleTankId, // For legacy support
      tankDistributions: finalDistributions, // New Structure

      acidity: acidity ? Number(acidity) : undefined,
      waxes: waxes ? Number(waxes) : undefined,

      details,
      paymentMethod,
      paymentStatus,
      amountPaid: finalAmountPaidInMAD, 
      bankAccountId: paymentMethod === PaymentMethod.VIREMENT ? selectedBankAccountId : undefined
    });
  };

  const addDistributionRow = () => {
      setDistributions([...distributions, { tankId: '', quantity: 0 }]);
  };

  const removeDistributionRow = (index: number) => {
      setDistributions(distributions.filter((_, i) => i !== index));
  };

  const updateDistribution = (index: number, field: 'tankId' | 'quantity', value: any) => {
      const newDist = [...distributions];
      newDist[index] = { ...newDist[index], [field]: value };
      setDistributions(newDist);
  };

  const isBulkOil = productType === ProductType.HUILE_VRAC;
  const isForeign = currency !== Currency.MAD;
  const distributedSum = distributions.reduce((acc, curr) => acc + (curr.quantity || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-olive-800 px-6 py-4 flex justify-between items-center text-white shrink-0">
          <h3 className="font-bold text-lg">Nouvelle Transaction</h3>
          <button onClick={onCancel} className="hover:bg-olive-700 p-1 rounded"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value as TransactionType)}
                className="w-full border rounded-lg p-2 bg-gray-50 focus:ring-2 focus:ring-olive-500 outline-none"
              >
                {Object.values(TransactionType).filter(t => t !== TransactionType.DEPENSE).map(t => (
                  <option key={t} value={t}>{t === TransactionType.PRODUCTION ? 'Production (Trituration)' : t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Produit</label>
              <select 
                value={productType} 
                onChange={(e) => setProductType(e.target.value as ProductType)}
                className="w-full border rounded-lg p-2 bg-gray-50 focus:ring-2 focus:ring-olive-500 outline-none"
              >
                {Object.values(ProductType).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {type === TransactionType.PRODUCTION && (
            <div className="bg-green-50 p-3 rounded-lg border border-green-200 animate-fade-in">
              <p className="text-xs text-green-800 font-bold mb-1 flex items-center gap-1">
                <Layers size={12}/> Détails de Production
              </p>
              <p className="text-[10px] text-green-700 mb-2 leading-tight">
                Le "Prix Total" ci-dessous doit correspondre au <strong>coût total de la matière première</strong> (Olives/Noyaux) et des frais de trituration pour calculer le prix de revient de l'huile.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantité Globale</label>
              <input 
                type="number" 
                required
                min="0"
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
                className="w-full border rounded-lg p-2 outline-none focus:border-olive-500"
                placeholder="0"
              />
            </div>
            
            {/* Currency Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                 <Globe size={14} /> Devise & Prix
              </label>
              <div className="flex gap-2">
                 <select 
                   value={currency} 
                   onChange={e => {
                     const c = e.target.value as Currency;
                     setCurrency(c);
                     if (c === Currency.MAD) setExchangeRate(1);
                   }}
                   className="w-20 border rounded-lg p-2 bg-gray-50 text-xs font-bold"
                 >
                   {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
                 <input 
                    type="number" 
                    required
                    min="0"
                    value={price}
                    onChange={e => {
                      setPrice(Number(e.target.value));
                      if(paymentStatus === PaymentStatus.PAYE) setAmountPaid(Number(e.target.value));
                    }}
                    className="w-full border rounded-lg p-2 outline-none focus:border-olive-500"
                    placeholder="Total"
                  />
              </div>
            </div>
          </div>

          {/* TANK SELECTION - NOW SUPPORTS MULTI */}
          {isBulkOil && (
            <div className="space-y-4">
               {/* ACIDITY & WAXES INPUTS */}
               <div className="grid grid-cols-2 gap-4 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <div>
                    <label className="block text-xs font-bold text-yellow-800 mb-1">Acidité (%)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={acidity}
                      onChange={e => setAcidity(e.target.value)}
                      className="w-full border border-yellow-300 rounded p-1.5 text-sm outline-none focus:ring-1 focus:ring-yellow-500"
                      placeholder="Ex: 0.8"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-yellow-800 mb-1">Cires (mg/kg)</label>
                    <input 
                      type="number" 
                      value={waxes}
                      onChange={e => setWaxes(e.target.value)}
                      className="w-full border border-yellow-300 rounded p-1.5 text-sm outline-none focus:ring-1 focus:ring-yellow-500"
                      placeholder="Ex: 150"
                    />
                  </div>
               </div>

               <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
               <div className="flex justify-between items-center mb-2">
                 <label className="block text-sm font-medium text-blue-900">
                   Répartition Citernes <span className="text-red-500">*</span>
                 </label>
                 <div className="flex items-center gap-2">
                    <span className="text-xs text-blue-800">Multi-citerne</span>
                    <button 
                      type="button"
                      onClick={() => setUseMultiTank(!useMultiTank)}
                      className={`w-8 h-4 rounded-full relative transition-colors ${useMultiTank ? 'bg-blue-600' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${useMultiTank ? 'left-4.5' : 'left-0.5'}`} style={{left: useMultiTank ? '18px' : '2px'}}></span>
                    </button>
                 </div>
               </div>

               {!useMultiTank ? (
                   <select 
                     required
                     value={singleTankId}
                     onChange={(e) => setSingleTankId(e.target.value)}
                     className="w-full border border-blue-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                   >
                     <option value="">Sélectionner une citerne...</option>
                     {tanks.map(tank => (
                       <option key={tank.id} value={tank.id}>
                         {tank.name} - ({tank.currentLevel}L / {tank.capacity}L)
                       </option>
                     ))}
                   </select>
               ) : (
                   <div className="space-y-2">
                       {distributions.map((dist, idx) => (
                           <div key={idx} className="flex gap-2 items-center">
                               <select 
                                 required
                                 value={dist.tankId}
                                 onChange={(e) => updateDistribution(idx, 'tankId', e.target.value)}
                                 className="flex-1 border border-blue-300 rounded p-1.5 text-sm"
                               >
                                 <option value="">Choisir...</option>
                                 {tanks.map(tank => (
                                   <option key={tank.id} value={tank.id}>{tank.name}</option>
                                 ))}
                               </select>
                               <input 
                                  type="number" 
                                  placeholder="Qté"
                                  className="w-24 border border-blue-300 rounded p-1.5 text-sm"
                                  value={dist.quantity}
                                  onChange={(e) => updateDistribution(idx, 'quantity', Number(e.target.value))}
                               />
                               {distributions.length > 1 && (
                                   <button type="button" onClick={() => removeDistributionRow(idx)} className="text-red-500 hover:bg-red-100 p-1 rounded"><X size={14}/></button>
                               )}
                           </div>
                       ))}
                       <div className="flex justify-between items-center pt-1">
                          <button type="button" onClick={addDistributionRow} className="text-xs flex items-center gap-1 text-blue-700 font-bold hover:underline"><PlusSmallIcon/> Ajouter ligne</button>
                          <span className={`text-xs font-bold ${distributedSum === quantity ? 'text-green-600' : 'text-red-500'}`}>
                              Total: {distributedSum} / {quantity} L
                          </span>
                       </div>
                   </div>
               )}
            </div>
            </div>
          )}

          {productType === ProductType.HUILE_BOUTEILLE && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marque</label>
              <select 
                value={brand} 
                onChange={(e) => setBrand(e.target.value as Brand)}
                className="w-full border rounded-lg p-2 bg-gray-50 focus:ring-2 focus:ring-olive-500 outline-none"
              >
                {Object.values(Brand).map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          )}

          {isForeign && (
             <div className="bg-orange-50 p-3 rounded border border-orange-200">
               <label className="block text-xs font-bold text-orange-800 mb-1">Taux de Change (1 {currency} = ? MAD)</label>
               <input 
                 type="number" step="0.01"
                 value={exchangeRate}
                 onChange={e => setExchangeRate(Number(e.target.value))}
                 className="w-full border rounded p-1"
               />
               <p className="text-xs text-orange-600 mt-1">Total en MAD : {(price * exchangeRate).toLocaleString()} MAD</p>
             </div>
          )}

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
             <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Statut Paiement</label>
                  <select
                     value={paymentStatus}
                     onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                     className="w-full border rounded p-2 text-sm"
                  >
                    {Object.values(PaymentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Mode de Paiement</label>
                  <select
                     value={paymentMethod}
                     onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                     className="w-full border rounded p-2 text-sm"
                  >
                    {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
               </div>
             </div>

             {/* EXTERNAL PAYER INFO */}
             {paymentMethod === PaymentMethod.TIERS && (
                <div className="bg-purple-50 p-3 rounded border border-purple-200 animate-fade-in">
                    <p className="text-xs text-purple-800 font-bold mb-1 flex items-center gap-1">
                        <AlertTriangle size={12}/> Paiement Externe
                    </p>
                    <p className="text-[10px] text-purple-700 mb-2 leading-tight">
                        Ce montant sera considéré comme payé au fournisseur, mais ne sera <strong>pas déduit</strong> de la caisse ou des comptes bancaires de l'entreprise.
                    </p>
                    <div className="flex items-center gap-2">
                        <UserCheck size={16} className="text-purple-500"/>
                        <input
                            type="text"
                            placeholder="Nom du payeur (ex: Patron, Associé...)"
                            className="w-full border border-purple-300 rounded p-1.5 text-xs focus:ring-1 focus:ring-purple-500 outline-none"
                            value={payerName}
                            onChange={(e) => setPayerName(e.target.value)}
                        />
                    </div>
                </div>
             )}

             {/* BANK SELECTION FOR VIREMENT */}
             {paymentMethod === PaymentMethod.VIREMENT && (
                <div className="bg-indigo-50 p-2 rounded border border-indigo-200">
                  <label className="block text-xs font-bold text-indigo-800 mb-1 flex items-center gap-1">
                     <Landmark size={12}/> Compte Bancaire
                  </label>
                  <select 
                     required
                     value={selectedBankAccountId}
                     onChange={(e) => setSelectedBankAccountId(e.target.value)}
                     className="w-full border rounded p-2 text-sm"
                  >
                     <option value="">Sélectionner le compte...</option>
                     {bankAccounts.map(b => (
                       <option key={b.id} value={b.id}>{b.bankName} - {b.currency}</option>
                     ))}
                  </select>
                </div>
             )}
             
             {paymentStatus === PaymentStatus.PARTIEL && (
               <div>
                 <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Montant Payé ({currency})</label>
                 <input 
                   type="number" 
                   value={amountPaid}
                   onChange={e => setAmountPaid(Number(e.target.value))}
                   className="w-full border rounded p-2 text-sm border-blue-300 bg-blue-50"
                 />
               </div>
             )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
            <div className="col-span-2 md:col-span-2">
               <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <Truck size={16} /> Transport
               </h4>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Véhicule Interne</label>
              <select 
                value={selectedVehicleId}
                onChange={(e) => {
                  setSelectedVehicleId(e.target.value);
                  if(e.target.value) setExternalTruckPlate(''); // Clear external if internal selected
                }}
                className="w-full border rounded-lg p-2 text-sm bg-gray-50 focus:ring-2 focus:ring-olive-500 outline-none"
              >
                <option value="">-- Aucun / Externe --</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.plateNumber} ({v.driverName})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Matricule (Externe)</label>
              <input 
                type="text" 
                value={externalTruckPlate}
                disabled={!!selectedVehicleId}
                onChange={e => setExternalTruckPlate(e.target.value)}
                className="w-full border rounded-lg p-2 text-sm outline-none uppercase font-mono disabled:bg-gray-100 disabled:text-gray-400"
                placeholder="Ex: 12345-A-1"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Partenaire (Client/Frs)</label>
            <input 
              type="text" 
              required
              value={partner}
              onChange={e => setPartner(e.target.value)}
              className="w-full border rounded-lg p-2 outline-none focus:border-olive-500"
              placeholder="Client ou Fournisseur"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Annuler</button>
            <button type="submit" className="px-6 py-2 bg-olive-600 text-white rounded-lg hover:bg-olive-700 flex items-center gap-2 shadow-lg shadow-olive-600/20">
              <Save size={18} /> Enregistrer
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

const PlusSmallIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

export default TransactionForm;
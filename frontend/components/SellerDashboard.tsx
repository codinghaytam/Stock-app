import React, { useState, useMemo } from 'react';
import { Vehicle, StockItem, Transaction, ProductType, PaymentMethod, PaymentStatus, Brand, BottleSize, TransactionType, Currency } from '../types.ts';
import { Truck, MapPin, ShoppingCart, Users, Package, History, DollarSign, LogOut, LocateFixed, Plus, Minus, X, CheckCircle, ArrowRight, Trash2 } from 'lucide-react';

interface SellerDashboardProps {
  vehicle: Vehicle;
  factoryStock: StockItem[];
  transactions: Transaction[];
  onSale: (vehicleId: string, saleData: any) => void;
  onCashDrop: (vehicleId: string, amount: number) => void;
  onDeleteTransaction: (id: string) => void;
  onLogout: () => void;
  username: string;
}

const SellerDashboard: React.FC<SellerDashboardProps> = ({ vehicle, factoryStock, transactions, onSale, onCashDrop, onDeleteTransaction, onLogout, username }) => {
  const [activeTab, setActiveTab] = useState<'sell' | 'stock' | 'clients'>('sell');
  
  // SALE STATE
  const [saleStep, setSaleStep] = useState<1 | 2>(1); // 1: Cart, 2: Info
  const [cart, setCart] = useState<{brand: Brand, bottleSize: BottleSize, quantity: number, price: number}[]>([]);
  const [clientInfo, setClientInfo] = useState({ name: '', location: '', paymentMethod: PaymentMethod.ESPECE, paymentStatus: PaymentStatus.PAYE, amountPaid: 0 });

  // CASH DROP STATE
  const [dropAmount, setDropAmount] = useState<string>('');

  // PERMISSIONS
  const canDelete = ['mojo', 'hajar', 'safae', 'ZITLBLAD1'].includes(username);

  // --- DERIVED DATA ---
  
  // Filter transactions for this specific vehicle/seller
  const sellerTransactions = transactions.filter(t => t.vehicleId === vehicle.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Financial Stats
  const totalSold = sellerTransactions.filter(t => t.type === TransactionType.VENTE).reduce((sum, t) => sum + t.priceTotal, 0);
  const totalCashIn = sellerTransactions.filter(t => t.type === TransactionType.VENTE && t.paymentMethod === PaymentMethod.ESPECE).reduce((sum, t) => sum + (t.amountPaid || 0), 0);
  const totalDeposited = sellerTransactions.filter(t => t.type === TransactionType.VERSEMENT).reduce((sum, t) => sum + t.priceTotal, 0);
  const cashInHand = totalCashIn - totalDeposited;
  
  // Debts
  const clientsWithDebts = useMemo(() => {
     const clients: Record<string, {totalDebt: number, lastDate: string}> = {};
     sellerTransactions.forEach(t => {
        if(t.type === TransactionType.VENTE) {
            const debt = t.priceTotal - (t.amountPaid || 0);
            if(debt > 0) {
                if(!clients[t.partnerName]) clients[t.partnerName] = {totalDebt: 0, lastDate: t.date};
                clients[t.partnerName].totalDebt += debt;
            }
        }
     });
     return Object.entries(clients).map(([name, data]) => ({name, ...data})).filter(c => c.totalDebt > 0);
  }, [sellerTransactions]);


  // --- HANDLERS ---

  const addToCart = (brand: Brand, size: BottleSize, price: number) => {
     const inStock = vehicle.mobileStock?.find(s => s.brand === brand && s.bottleSize === size);
     const currentQty = cart.find(c => c.brand === brand && c.bottleSize === size)?.quantity || 0;
     
     if(!inStock || inStock.quantity <= currentQty) {
         alert("Stock insuffisant dans le camion !");
         return;
     }

     setCart(prev => {
         const existing = prev.find(c => c.brand === brand && c.bottleSize === size);
         if(existing) {
             return prev.map(c => c.brand === brand && c.bottleSize === size ? {...c, quantity: c.quantity + 1} : c);
         }
         return [...prev, {brand, bottleSize: size, quantity: 1, price}];
     });
  };

  const removeFromCart = (index: number) => {
      setCart(prev => prev.filter((_, i) => i !== index));
  };

  const handleGPS = () => {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition((position) => {
            setClientInfo(prev => ({...prev, location: `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`}));
        }, () => alert("GPS Introuvable"));
    } else {
        alert("GPS non supporté");
    }
  };

  const submitSale = (e: React.FormEvent) => {
      e.preventDefault();
      const total = cart.reduce((acc, c) => acc + (c.quantity * c.price), 0);
      
      onSale(vehicle.id, {
          clientName: clientInfo.name,
          location: clientInfo.location,
          paymentMethod: clientInfo.paymentMethod,
          paymentStatus: clientInfo.paymentStatus,
          amountPaid: clientInfo.paymentStatus === PaymentStatus.PAYE ? total : clientInfo.amountPaid,
          items: cart
      });

      // Reset
      setCart([]);
      setClientInfo({ name: '', location: '', paymentMethod: PaymentMethod.ESPECE, paymentStatus: PaymentStatus.PAYE, amountPaid: 0 });
      setSaleStep(1);
      alert("Vente enregistrée avec succès !");
  };

  const handleCashDrop = () => {
      const amount = Number(dropAmount);
      if(amount > 0 && amount <= cashInHand) {
          if(confirm(`Confirmer le versement de ${amount} MAD à l'usine ?`)) {
              onCashDrop(vehicle.id, amount);
              setDropAmount('');
          }
      } else {
          alert("Montant invalide ou supérieur à la caisse.");
      }
  };

  // --- RENDER HELPERS ---
  const availableStock = vehicle.mobileStock || [];
  const cartTotal = cart.reduce((acc, c) => acc + (c.quantity * c.price), 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      
      {/* HEADER MOBILE - ORANGE THEME */}
      <div className="bg-orange-700 text-white p-4 shadow-md sticky top-0 z-20">
         <div className="flex justify-between items-center">
             <div className="flex items-center gap-2">
                 <Truck size={20} />
                 <div>
                     <h1 className="font-bold text-lg leading-tight">ZITLBLAD Vendeur</h1>
                     <p className="text-xs text-orange-200">{vehicle.plateNumber}</p>
                 </div>
             </div>
             <button onClick={onLogout} className="bg-orange-800 p-2 rounded-full hover:bg-red-800 transition-colors">
                 <LogOut size={16}/>
             </button>
         </div>
      </div>

      {/* --- TAB: VENTE (SALE) --- */}
      {activeTab === 'sell' && (
         <div className="p-4 max-w-lg mx-auto">
             {saleStep === 1 ? (
                 <div className="space-y-4">
                     {/* Product Grid */}
                     <div className="grid grid-cols-2 gap-3">
                         {availableStock.filter(s => s.quantity > 0).map((item, idx) => (
                             <button 
                               key={idx} 
                               onClick={() => addToCart(item.brand, item.bottleSize, 70)} // Default price 70
                               className="bg-white p-4 rounded-xl shadow-sm border border-orange-100 active:scale-95 transition-transform text-left relative overflow-hidden hover:border-orange-300"
                             >
                                 <div className="absolute top-0 right-0 bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded-bl">
                                     {item.quantity} dispo
                                 </div>
                                 <div className="font-bold text-gray-800">{item.brand}</div>
                                 <div className="text-sm text-gray-500">{item.bottleSize}</div>
                                 <div className="mt-2 font-bold text-orange-600 flex items-center gap-1">
                                    <Plus size={14}/> Ajouter
                                 </div>
                             </button>
                         ))}
                         {availableStock.filter(s => s.quantity > 0).length === 0 && (
                             <div className="col-span-2 text-center py-10 text-gray-400">Camion Vide. Aller charger à l'usine.</div>
                         )}
                     </div>

                     {/* Cart Summary */}
                     {cart.length > 0 && (
                         <div className="fixed bottom-20 left-4 right-4 bg-white rounded-xl shadow-2xl border border-orange-200 p-4 animate-slide-up z-10">
                             <div className="flex justify-between items-center mb-3 border-b pb-2">
                                 <span className="font-bold text-gray-700 flex items-center gap-2"><ShoppingCart size={18}/> Panier ({cart.length})</span>
                                 <span className="font-bold text-xl text-orange-600">{cartTotal} MAD</span>
                             </div>
                             <div className="max-h-32 overflow-y-auto space-y-2 mb-3">
                                 {cart.map((c, i) => (
                                     <div key={i} className="flex justify-between items-center text-sm">
                                         <span>{c.brand} {c.bottleSize} (x{c.quantity})</span>
                                         <div className="flex items-center gap-2">
                                             <input 
                                                type="number" 
                                                className="w-16 border rounded p-1 text-right" 
                                                value={c.price} 
                                                onChange={(e) => {
                                                    const newCart = [...cart];
                                                    newCart[i].price = Number(e.target.value);
                                                    setCart(newCart);
                                                }}
                                             />
                                             <button onClick={() => removeFromCart(i)} className="text-red-500"><X size={16}/></button>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                             <button onClick={() => setSaleStep(2)} className="w-full bg-orange-600 text-white py-3 rounded-lg font-bold shadow-lg hover:bg-orange-700">
                                 Suivant <ArrowRight size={16} className="inline ml-1"/>
                             </button>
                         </div>
                     )}
                 </div>
             ) : (
                 <form onSubmit={submitSale} className="bg-white rounded-xl shadow-md p-6 space-y-4">
                     <div className="flex items-center gap-2 text-orange-700 font-bold mb-2 cursor-pointer" onClick={() => setSaleStep(1)}>
                         <ArrowRight className="rotate-180" size={20}/> Retour au produits
                     </div>
                     
                     <div>
                         <label className="block text-sm font-bold text-gray-700 mb-1">Client</label>
                         <input 
                           required
                           className="w-full p-3 border rounded-lg bg-gray-50 focus:border-orange-500 outline-none"
                           placeholder="Nom du client"
                           value={clientInfo.name}
                           onChange={e => setClientInfo({...clientInfo, name: e.target.value})}
                         />
                     </div>

                     <div>
                         <label className="block text-sm font-bold text-gray-700 mb-1">Localisation</label>
                         <div className="flex gap-2">
                             <input 
                               readOnly
                               className="w-full p-3 border rounded-lg bg-gray-100 text-xs"
                               placeholder="GPS..."
                               value={clientInfo.location}
                             />
                             <button type="button" onClick={handleGPS} className="bg-blue-100 text-blue-600 p-3 rounded-lg">
                                 <LocateFixed size={20}/>
                             </button>
                         </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                         <div>
                             <label className="block text-sm font-bold text-gray-700 mb-1">Paiement</label>
                             <select 
                               className="w-full p-3 border rounded-lg focus:border-orange-500 outline-none"
                               value={clientInfo.paymentMethod}
                               onChange={e => setClientInfo({...clientInfo, paymentMethod: e.target.value as PaymentMethod})}
                             >
                                 <option value={PaymentMethod.ESPECE}>Espèce</option>
                                 <option value={PaymentMethod.CREDIT}>Crédit</option>
                                 <option value={PaymentMethod.CHEQUE}>Chèque</option>
                             </select>
                         </div>
                         <div>
                             <label className="block text-sm font-bold text-gray-700 mb-1">État</label>
                             <select 
                               className="w-full p-3 border rounded-lg focus:border-orange-500 outline-none"
                               value={clientInfo.paymentStatus}
                               onChange={e => setClientInfo({...clientInfo, paymentStatus: e.target.value as PaymentStatus})}
                             >
                                 <option value={PaymentStatus.PAYE}>Payé</option>
                                 <option value={PaymentStatus.IMPAYE}>Impayé</option>
                                 <option value={PaymentStatus.PARTIEL}>Partiel</option>
                             </select>
                         </div>
                     </div>

                     {clientInfo.paymentStatus === PaymentStatus.PARTIEL && (
                         <div>
                             <label className="block text-sm font-bold text-gray-700 mb-1">Montant Versé</label>
                             <input 
                               type="number"
                               className="w-full p-3 border rounded-lg bg-yellow-50 border-yellow-200"
                               value={clientInfo.amountPaid}
                               onChange={e => setClientInfo({...clientInfo, amountPaid: Number(e.target.value)})}
                             />
                         </div>
                     )}

                     <div className="pt-4 border-t">
                         <div className="flex justify-between items-center mb-4">
                             <span className="font-bold text-gray-600">Total à Payer</span>
                             <span className="font-bold text-2xl text-gray-800">{cartTotal} MAD</span>
                         </div>
                         <button type="submit" className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg shadow-xl hover:bg-green-700">
                             Valider la Vente
                         </button>
                     </div>
                 </form>
             )}
         </div>
      )}

      {/* --- TAB: STOCK --- */}
      {activeTab === 'stock' && (
         <div className="p-4 space-y-6 max-w-lg mx-auto">
             <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                 <h2 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                     <Truck className="text-orange-600"/> Stock Camion
                 </h2>
                 {availableStock.length === 0 ? <p className="text-gray-400 text-center">Camion vide.</p> : (
                     <div className="space-y-3">
                         {availableStock.map((s, i) => (
                             <div key={i} className="flex justify-between items-center border-b pb-2 last:border-0">
                                 <div>
                                     <div className="font-bold text-gray-700">{s.brand}</div>
                                     <div className="text-xs text-gray-500">{s.bottleSize}</div>
                                 </div>
                                 <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-bold">
                                     {s.quantity}
                                 </div>
                             </div>
                         ))}
                     </div>
                 )}
             </div>

             <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 opacity-75">
                 <h2 className="font-bold text-sm text-gray-500 mb-4 flex items-center gap-2">
                     <Package className="text-gray-400"/> Stock Usine (Info)
                 </h2>
                 <div className="space-y-2">
                     {factoryStock.filter(s => s.type === ProductType.HUILE_BOUTEILLE).map((s, i) => (
                         <div key={i} className="flex justify-between items-center text-xs text-gray-500">
                             <span>{s.brand} {s.bottleSize}</span>
                             <span>{s.quantity}</span>
                         </div>
                     ))}
                 </div>
             </div>
         </div>
      )}

      {/* --- TAB: CLIENTS & CAISSE --- */}
      {activeTab === 'clients' && (
         <div className="p-4 space-y-6 max-w-lg mx-auto">
             {/* CAISSE STATS */}
             <div className="bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl shadow-lg p-6 text-white">
                 <div className="flex justify-between items-start mb-4">
                     <div>
                         <p className="text-orange-100 text-sm">Argent en Poche (Caisse)</p>
                         <h2 className="text-3xl font-bold">{cashInHand.toLocaleString()} MAD</h2>
                     </div>
                     <DollarSign className="text-orange-200 opacity-50" size={32}/>
                 </div>
                 <div className="grid grid-cols-2 gap-4 text-xs border-t border-orange-400/30 pt-4">
                     <div>
                         <span className="block text-orange-100">Total Ventes</span>
                         <span className="font-bold text-lg">{totalSold.toLocaleString()}</span>
                     </div>
                     <div>
                         <span className="block text-orange-100">Total Versé Usine</span>
                         <span className="font-bold text-lg">{totalDeposited.toLocaleString()}</span>
                     </div>
                 </div>
                 
                 <div className="mt-4 pt-4 border-t border-orange-400/30">
                     <div className="flex gap-2">
                         <input 
                           type="number" 
                           className="flex-1 rounded p-2 text-gray-800 text-sm outline-none" 
                           placeholder="Montant à verser..."
                           value={dropAmount}
                           onChange={e => setDropAmount(e.target.value)}
                         />
                         <button onClick={handleCashDrop} className="bg-white text-orange-800 px-4 py-2 rounded font-bold text-sm hover:bg-gray-100">
                             Verser
                         </button>
                     </div>
                     <p className="text-[10px] text-orange-200 mt-1">* Créera une preuve de versement.</p>
                 </div>
             </div>

             {/* DEBTS */}
             {clientsWithDebts.length > 0 && (
                 <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden">
                     <div className="bg-red-50 p-3 border-b border-red-100">
                         <h3 className="font-bold text-red-800 flex items-center gap-2">
                             <Users size={16}/> Crédits Clients (À Recouvrer)
                         </h3>
                     </div>
                     <div className="divide-y divide-gray-100">
                         {clientsWithDebts.map((c, i) => (
                             <div key={i} className="p-3 flex justify-between items-center">
                                 <div>
                                     <div className="font-bold text-gray-700">{c.name}</div>
                                     <div className="text-xs text-gray-400">{new Date(c.lastDate).toLocaleDateString()}</div>
                                 </div>
                                 <div className="font-bold text-red-600">{c.totalDebt.toLocaleString()} MAD</div>
                             </div>
                         ))}
                     </div>
                 </div>
             )}

             {/* RECENT HISTORY */}
             <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                 <div className="p-3 border-b bg-gray-50">
                     <h3 className="font-bold text-gray-600 flex items-center gap-2">
                         <History size={16}/> Historique Récent
                     </h3>
                 </div>
                 <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
                     {sellerTransactions.slice(0, 10).map((t, i) => (
                         <div key={i} className="p-3 text-sm flex justify-between items-center">
                             <div className="flex-1">
                                 <div className="flex justify-between mb-1">
                                     <span className="font-bold text-gray-800">{t.type === TransactionType.VERSEMENT ? 'Versement Usine' : t.partnerName}</span>
                                     <span className={`font-bold ${t.type === TransactionType.VERSEMENT ? 'text-blue-600' : 'text-green-600'}`}>
                                         {t.priceTotal.toLocaleString()} MAD
                                     </span>
                                 </div>
                                 <div className="flex justify-between text-xs text-gray-400">
                                     <span>{new Date(t.date).toLocaleDateString()} {new Date(t.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                     <span>{t.paymentStatus}</span>
                                 </div>
                             </div>
                             
                             {canDelete && (
                                <button 
                                  onClick={() => onDeleteTransaction(t.id)}
                                  className="ml-3 text-gray-300 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={16}/>
                                </button>
                             )}
                         </div>
                     ))}
                 </div>
             </div>
         </div>
      )}


      {/* --- BOTTOM NAV --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-2 pb-safe z-20">
          <button 
            onClick={() => setActiveTab('sell')}
            className={`flex flex-col items-center p-2 rounded-lg w-20 transition-colors ${activeTab === 'sell' ? 'text-orange-600 bg-orange-50' : 'text-gray-400'}`}
          >
              <ShoppingCart size={24}/>
              <span className="text-[10px] font-bold mt-1">Vente</span>
          </button>
          <button 
            onClick={() => setActiveTab('stock')}
            className={`flex flex-col items-center p-2 rounded-lg w-20 transition-colors ${activeTab === 'stock' ? 'text-orange-600 bg-orange-50' : 'text-gray-400'}`}
          >
              <Package size={24}/>
              <span className="text-[10px] font-bold mt-1">Stocks</span>
          </button>
          <button 
            onClick={() => setActiveTab('clients')}
            className={`flex flex-col items-center p-2 rounded-lg w-20 transition-colors ${activeTab === 'clients' ? 'text-orange-600 bg-orange-50' : 'text-gray-400'}`}
          >
              <Users size={24}/>
              <span className="text-[10px] font-bold mt-1">Clients/$$</span>
          </button>
      </div>
    </div>
  );
};

export default SellerDashboard;
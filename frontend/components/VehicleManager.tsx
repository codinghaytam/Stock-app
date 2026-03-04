import React, { useState } from 'react';
import { Vehicle, StockItem, ProductType, PaymentMethod, PaymentStatus, Brand, BottleSize } from '../types.ts';
import { Truck, MapPin, User, Activity, Plus, Navigation, Package, X, Map, ShoppingCart, ArrowRight, ArrowDownToLine, LocateFixed, Trash2 } from 'lucide-react';

interface VehicleManagerProps {
  vehicles: Vehicle[];
  factoryStock: StockItem[];
  onAddVehicle: (v: Vehicle) => void;
  onUpdateMission: (id: string, missionData: any) => void;
  onLoadVehicle: (vehicleId: string, items: {stockItemId: string, quantity: number}[]) => void;
  onMobileSale: (vehicleId: string, saleData: any) => void;
  onDeleteVehicle?: (id: string) => void;
  username?: string;
}

const VehicleManager: React.FC<VehicleManagerProps> = ({ vehicles, factoryStock, onAddVehicle, onUpdateMission, onLoadVehicle, onMobileSale, onDeleteVehicle, username }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  
  // MODALS STATE
  const [activeModal, setActiveModal] = useState<'NONE' | 'LOAD' | 'SELL'>('NONE');
  const [actingVehicle, setActingVehicle] = useState<Vehicle | null>(null);

  // Add Form State
  const [newVehicle, setNewVehicle] = useState({ plate: '', driver: '' });

  // LOAD STOCK STATE
  const [loadItems, setLoadItems] = useState<{stockItemId: string, quantity: number}[]>([{stockItemId: '', quantity: 0}]);

  // SELL MOBILE STATE
  const [saleData, setSaleData] = useState({
     clientName: '',
     location: '',
     paymentMethod: PaymentMethod.ESPECE,
     paymentStatus: PaymentStatus.PAYE,
     amountPaid: 0
  });
  const [cartItems, setCartItems] = useState<{brand: Brand, bottleSize: BottleSize, quantity: number, price: number}[]>([]);

  const canDelete = username && ['mojo', 'boss', 'hajar', 'safae', 'ZITLBLAD1'].includes(username);

  // --- HANDLERS ---

  const handleCreateVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    onAddVehicle({
      id: `V${Date.now()}`,
      plateNumber: newVehicle.plate.toUpperCase(),
      driverName: newVehicle.driver,
      type: 'Camion',
      status: 'Disponible',
      lastActive: new Date().toISOString(),
      mobileStock: []
    });
    setNewVehicle({ plate: '', driver: '' });
    setShowAddForm(false);
  };

  const openActionModal = (vehicle: Vehicle, type: 'LOAD' | 'SELL') => {
      setActingVehicle(vehicle);
      setActiveModal(type);
      // Reset forms
      setLoadItems([{stockItemId: '', quantity: 0}]);
      setSaleData({ clientName: '', location: '', paymentMethod: PaymentMethod.ESPECE, paymentStatus: PaymentStatus.PAYE, amountPaid: 0 });
      setCartItems([]);
  };

  const handleGPS = () => {
      if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition((position) => {
              setSaleData(prev => ({...prev, location: `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`}));
          }, () => alert("Impossible de récupérer la position GPS."));
      } else {
          alert("GPS non supporté");
      }
  };

  const submitLoad = (e: React.FormEvent) => {
      e.preventDefault();
      if(actingVehicle) {
          // Filter empty
          const validItems = loadItems.filter(i => i.stockItemId && i.quantity > 0);
          if(validItems.length > 0) {
            onLoadVehicle(actingVehicle.id, validItems);
            setActiveModal('NONE');
          }
      }
  };

  const submitSale = (e: React.FormEvent) => {
      e.preventDefault();
      if(actingVehicle && cartItems.length > 0 && saleData.clientName) {
          
          const totalCartPrice = cartItems.reduce((acc, item) => acc + (item.quantity * item.price), 0);
          
          // Prepare payload
          const finalPayload = {
              ...saleData,
              items: cartItems.map(item => ({
                  ...item,
                  priceTotal: item.quantity * item.price,
                  // If partial payment, we pro-rate paid amount or handle it roughly
                  amountPaid: saleData.paymentStatus === PaymentStatus.PAYE ? (item.quantity * item.price) : 
                              saleData.paymentStatus === PaymentStatus.IMPAYE ? 0 :
                              (saleData.amountPaid / totalCartPrice) * (item.quantity * item.price) // Pro-rated
              }))
          };

          onMobileSale(actingVehicle.id, finalPayload);
          setActiveModal('NONE');
      }
  };

  // --- HELPERS FOR FORMS ---
  const bottleStock = factoryStock.filter(s => s.type === ProductType.HUILE_BOUTEILLE && s.quantity > 0);

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Flotte & Ventes Mobiles</h2>
          <p className="text-gray-500">Gestion des stocks camions et distribution</p>
        </div>
        
        <button 
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-olive-600 text-white px-4 py-2 rounded-lg hover:bg-olive-700 shadow-md"
        >
          <Plus size={18} /> Nouveau Véhicule
        </button>
      </header>

      {/* GPS MAP VISUALIZATION PLACEHOLDER (MAROC) */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl h-48 relative overflow-hidden flex items-center justify-center group">
         {/* Simple Visual Representation of a Map Context */}
         <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/World_map_blank_without_borders.svg/2000px-World_map_blank_without_borders.svg.png')] opacity-10 bg-cover bg-center"></div>
         <div className="relative z-10 text-center">
             <div className="bg-white p-2 rounded-full shadow-lg inline-flex mb-2">
                 <Map className="text-blue-600" size={24} />
             </div>
             <h3 className="font-bold text-blue-900">Suivi Flotte Temps Réel</h3>
             <div className="flex gap-4 justify-center mt-2">
                 {vehicles.filter(v => v.status === 'En Mission').map((v, i) => (
                     <div key={v.id} className="bg-white px-3 py-1 rounded shadow-md border text-xs flex items-center gap-2 animate-bounce" style={{animationDelay: `${i*0.5}s`, animationDuration: '3s'}}>
                         <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                         <span className="font-bold">{v.plateNumber}</span>
                     </div>
                 ))}
             </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {vehicles.map(vehicle => (
          <div key={vehicle.id} className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col relative overflow-hidden group">
              {/* Status Bar */}
              <div className={`h-1 w-full ${
                vehicle.status === 'Disponible' ? 'bg-green-500' :
                vehicle.status === 'En Mission' ? 'bg-blue-500' : 'bg-red-500'
              }`}></div>
              
              {canDelete && onDeleteVehicle && (
                  <button 
                    onClick={() => onDeleteVehicle(vehicle.id)}
                    className="absolute top-2 right-2 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-10"
                  >
                      <Trash2 size={18}/>
                  </button>
              )}

              <div className="p-5 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gray-50 rounded-full text-gray-600">
                           <Truck size={24} />
                        </div>
                        <div>
                           <h3 className="text-lg font-bold text-gray-800 font-mono tracking-wide">{vehicle.plateNumber}</h3>
                           <div className="flex items-center gap-2 text-sm text-gray-600">
                              <User size={14} /> {vehicle.driverName}
                           </div>
                        </div>
                    </div>
                  </div>

                  {/* MOBILE STOCK SUMMARY */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                          <Package size={12}/> Stock Mobile (Camion)
                      </h4>
                      {vehicle.mobileStock && vehicle.mobileStock.length > 0 ? (
                          <div className="space-y-1">
                              {vehicle.mobileStock.filter(i => i.quantity > 0).map((item, idx) => (
                                  <div key={idx} className="flex justify-between text-sm border-b border-gray-100 last:border-0 pb-1">
                                      <span>{item.brand} {item.bottleSize}</span>
                                      <span className="font-bold text-olive-700">{item.quantity} un.</span>
                                  </div>
                              ))}
                          </div>
                      ) : (
                          <div className="text-xs text-gray-400 italic">Camion vide. Charger avant départ.</div>
                      )}
                  </div>

                  <div className="flex gap-2 mt-auto">
                      <button 
                        onClick={() => openActionModal(vehicle, 'LOAD')}
                        className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 flex items-center justify-center gap-1"
                      >
                         <ArrowDownToLine size={16}/> Charger
                      </button>
                      <button 
                        onClick={() => openActionModal(vehicle, 'SELL')}
                        className="flex-1 bg-olive-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-olive-700 flex items-center justify-center gap-1 shadow-lg shadow-olive-600/20"
                      >
                         <ShoppingCart size={16}/> Vendre
                      </button>
                  </div>
              </div>
          </div>
        ))}
      </div>

      {/* --- MODALS --- */}

      {/* 1. LOAD STOCK MODAL */}
      {activeModal === 'LOAD' && actingVehicle && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                  <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
                      <h3 className="font-bold">Charger Stock : {actingVehicle.plateNumber}</h3>
                      <button onClick={() => setActiveModal('NONE')}><X size={20}/></button>
                  </div>
                  <form onSubmit={submitLoad} className="p-6 space-y-4">
                      <p className="text-sm text-gray-500">Transférer des bouteilles du stock usine vers ce véhicule.</p>
                      
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                          {loadItems.map((item, idx) => (
                              <div key={idx} className="flex gap-2 items-center">
                                  <select 
                                    className="flex-1 border rounded p-2 text-sm"
                                    required
                                    value={item.stockItemId}
                                    onChange={e => {
                                        const newL = [...loadItems];
                                        newL[idx].stockItemId = e.target.value;
                                        setLoadItems(newL);
                                    }}
                                  >
                                      <option value="">Sélectionner produit...</option>
                                      {bottleStock.map(s => (
                                          <option key={s.id} value={s.id}>
                                              {s.name} (Dispo: {s.quantity})
                                          </option>
                                      ))}
                                  </select>
                                  <input 
                                    type="number" placeholder="Qté" required min="1"
                                    className="w-24 border rounded p-2 text-sm"
                                    value={item.quantity || ''}
                                    onChange={e => {
                                        const newL = [...loadItems];
                                        newL[idx].quantity = Number(e.target.value);
                                        setLoadItems(newL);
                                    }}
                                  />
                                  {loadItems.length > 1 && (
                                    <button type="button" onClick={() => setLoadItems(loadItems.filter((_,i) => i !== idx))} className="text-red-500"><X size={16}/></button>
                                  )}
                              </div>
                          ))}
                      </div>
                      <button type="button" onClick={() => setLoadItems([...loadItems, {stockItemId: '', quantity: 0}])} className="text-sm text-blue-600 font-bold hover:underline">+ Ajouter Ligne</button>

                      <div className="pt-4 border-t flex justify-end gap-2">
                          <button type="button" onClick={() => setActiveModal('NONE')} className="px-4 py-2 text-gray-600">Annuler</button>
                          <button type="submit" className="px-6 py-2 bg-gray-800 text-white rounded hover:bg-gray-900">Valider Transfert</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* 2. MOBILE SELL MODAL */}
      {activeModal === 'SELL' && actingVehicle && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="bg-olive-700 text-white p-4 flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-2">
                          <ShoppingCart size={20}/>
                          <h3 className="font-bold">Vente Mobile ({actingVehicle.plateNumber})</h3>
                      </div>
                      <button onClick={() => setActiveModal('NONE')}><X size={20}/></button>
                  </div>
                  
                  <form onSubmit={submitSale} className="p-6 overflow-y-auto space-y-6">
                      
                      {/* Section 1: Client & Location */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-600 mb-1">Client</label>
                              <input 
                                className="w-full border rounded p-2" 
                                placeholder="Nom du client" 
                                required
                                value={saleData.clientName}
                                onChange={e => setSaleData({...saleData, clientName: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-600 mb-1">Localisation (GPS)</label>
                              <div className="flex gap-2">
                                  <input 
                                    className="w-full border rounded p-2 bg-gray-50 text-xs" 
                                    placeholder="Coordonnées..." 
                                    readOnly
                                    value={saleData.location}
                                  />
                                  <button type="button" onClick={handleGPS} className="bg-blue-100 text-blue-700 p-2 rounded hover:bg-blue-200" title="Localiser">
                                      <LocateFixed size={18}/>
                                  </button>
                              </div>
                          </div>
                      </div>

                      {/* Section 2: Cart */}
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                              <Package size={16}/> Articles (Depuis Stock Camion)
                          </h4>
                          
                          {/* Cart List */}
                          <div className="space-y-2 mb-3">
                              {cartItems.map((item, idx) => (
                                  <div key={idx} className="flex gap-2 items-center bg-white p-2 rounded border border-gray-100 shadow-sm">
                                      <div className="flex-1 text-sm font-medium">{item.brand} {item.bottleSize}</div>
                                      <div className="text-sm">x{item.quantity}</div>
                                      <div className="text-sm font-bold w-20 text-right">{(item.quantity * item.price).toLocaleString()} Dh</div>
                                      <button type="button" onClick={() => setCartItems(cartItems.filter((_,i) => i !== idx))} className="text-red-400 hover:text-red-600"><X size={16}/></button>
                                  </div>
                              ))}
                              {cartItems.length === 0 && <p className="text-xs text-gray-400 text-center py-2">Panier vide</p>}
                          </div>

                          {/* Add Item Row */}
                          <div className="flex gap-2 items-center pt-2 border-t border-gray-200">
                               <select id="cartBrand" className="border rounded p-1.5 text-xs flex-1">
                                   {Object.values(Brand).map(b => <option key={b} value={b}>{b}</option>)}
                               </select>
                               <select id="cartSize" className="border rounded p-1.5 text-xs w-20">
                                   <option value="1L">1L</option>
                                   <option value="1/2 L">1/2 L</option>
                                   <option value="2L">2L</option>
                                   <option value="5L">5L</option>
                               </select>
                               <input id="cartQty" type="number" placeholder="Qté" className="border rounded p-1.5 text-xs w-16" min="1"/>
                               <input id="cartPrice" type="number" placeholder="Prix Unit" className="border rounded p-1.5 text-xs w-20" min="0"/>
                               <button 
                                 type="button" 
                                 className="bg-olive-600 text-white p-1.5 rounded hover:bg-olive-700"
                                 onClick={() => {
                                     const brand = (document.getElementById('cartBrand') as HTMLSelectElement).value as Brand;
                                     const size = (document.getElementById('cartSize') as HTMLSelectElement).value as BottleSize;
                                     const qty = Number((document.getElementById('cartQty') as HTMLInputElement).value);
                                     const price = Number((document.getElementById('cartPrice') as HTMLInputElement).value);
                                     
                                     // Check if available in truck
                                     const inStock = actingVehicle.mobileStock?.find(s => s.brand === brand && s.bottleSize === size);
                                     const currentInCart = cartItems.find(c => c.brand === brand && c.bottleSize === size)?.quantity || 0;

                                     if (!inStock || (inStock.quantity - currentInCart) < qty) {
                                         alert(`Stock insuffisant dans le camion pour ${brand} ${size}.`);
                                         return;
                                     }

                                     if(qty > 0 && price >= 0) {
                                         setCartItems([...cartItems, {brand, bottleSize: size, quantity: qty, price}]);
                                         // Clear inputs
                                         (document.getElementById('cartQty') as HTMLInputElement).value = '';
                                     }
                                 }}
                               >
                                   <Plus size={16}/>
                               </button>
                          </div>
                      </div>

                      {/* Section 3: Payment */}
                      <div className="grid grid-cols-2 gap-4 border-t pt-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-600 mb-1">Mode Paiement</label>
                              <select 
                                className="w-full border rounded p-2 text-sm"
                                value={saleData.paymentMethod}
                                onChange={e => setSaleData({...saleData, paymentMethod: e.target.value as PaymentMethod})}
                              >
                                  {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-600 mb-1">Statut</label>
                              <select 
                                className="w-full border rounded p-2 text-sm"
                                value={saleData.paymentStatus}
                                onChange={e => setSaleData({...saleData, paymentStatus: e.target.value as PaymentStatus})}
                              >
                                  {Object.values(PaymentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                          </div>
                      </div>

                      {saleData.paymentStatus === PaymentStatus.PARTIEL && (
                          <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1">Montant Versé</label>
                              <input 
                                type="number"
                                className="w-full p-3 border rounded-lg bg-yellow-50 border-yellow-200"
                                value={saleData.amountPaid}
                                onChange={e => setSaleData({...saleData, amountPaid: Number(e.target.value)})}
                              />
                          </div>
                      )}

                      <div className="flex justify-between items-center pt-4 border-t">
                          <div className="text-lg font-bold text-gray-800">
                              Total: {cartItems.reduce((acc, i) => acc + (i.quantity * i.price), 0).toLocaleString()} DH
                          </div>
                          <button 
                             type="submit" 
                             disabled={cartItems.length === 0 || !saleData.clientName}
                             className="bg-olive-700 text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-olive-800 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                              Valider Vente
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* CREATE VEHICLE FORM */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">Ajouter un Véhicule</h3>
            <form onSubmit={handleCreateVehicle} className="space-y-4">
               <div>
                 <label className="block text-sm text-gray-700">Matricule</label>
                 <input 
                   required
                   className="w-full border rounded p-2 uppercase" 
                   value={newVehicle.plate} 
                   onChange={e => setNewVehicle({...newVehicle, plate: e.target.value})}
                   placeholder="12345-A-1"
                 />
               </div>
               <div>
                 <label className="block text-sm text-gray-700">Nom du Chauffeur</label>
                 <input 
                   required
                   className="w-full border rounded p-2" 
                   value={newVehicle.driver} 
                   onChange={e => setNewVehicle({...newVehicle, driver: e.target.value})}
                 />
               </div>
               <div className="flex justify-end gap-2 pt-2">
                 <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Annuler</button>
                 <button type="submit" className="px-4 py-2 bg-olive-600 text-white rounded hover:bg-olive-700">Créer</button>
               </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default VehicleManager;
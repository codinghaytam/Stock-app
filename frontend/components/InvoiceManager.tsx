import React, { useState, useEffect } from 'react';
import { Plus, FileText, Trash2, Printer, Search, ArrowLeft, Download } from 'lucide-react';
import { Invoice, InvoiceItem } from '../types.ts';
import { invoiceService } from '../services/invoiceService';

export default function InvoiceManager() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [currentInvoice, setCurrentInvoice] = useState<Partial<Invoice>>({
    date: new Date().toISOString().split('T')[0],
    number: `${new Date().getFullYear()}/${String(1).padStart(3, '0')}`,
    tvaRate: 0.10, // Default 10%
    items: [],
    paymentMode: 'Espèce'
  });

  const [newItem, setNewItem] = useState<Partial<InvoiceItem>>({
    description: '',
    quantity: 1,
    unitPrice: 0
  });

  const [isDownloadingPdf, setIsDownloadingPdf] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // fetch initial invoices list from backend
    (async () => {
      try {
        const data = await invoiceService.list();
        setInvoices(data);
      } catch (e) {
        console.error('Failed to load invoices', e);
      }
    })();
  }, []);

  const handleAddItem = () => {
    if (!newItem.description || !newItem.quantity || !newItem.unitPrice) return;
    
    const item: InvoiceItem = {
      id: Date.now().toString(),
      description: newItem.description,
      quantity: Number(newItem.quantity),
      unitPrice: Number(newItem.unitPrice),
      totalPrice: Number(newItem.quantity) * Number(newItem.unitPrice)
    };

    setCurrentInvoice(prev => ({
      ...prev,
      items: [...(prev.items || []), item]
    }));

    setNewItem({ description: '', quantity: 1, unitPrice: 0 });
  };

  const handleRemoveItem = (id: string) => {
    setCurrentInvoice(prev => ({
      ...prev,
      items: prev.items?.filter(i => i.id !== id)
    }));
  };

  const calculateTotals = () => {
    const totalHT = currentInvoice.items?.reduce((sum, item) => sum + item.totalPrice, 0) || 0;
    const tvaAmount = totalHT * (currentInvoice.tvaRate || 0);
    const totalTTC = totalHT + tvaAmount;
    return { totalHT, tvaAmount, totalTTC };
  };

  const handleSaveInvoice = async () => {
    if (!currentInvoice.clientName || !currentInvoice.items?.length) {
      alert("Veuillez remplir les informations du client et ajouter des articles.");
      return;
    }

    try {
      const payload = { ...currentInvoice };
      const saved = await invoiceService.create(payload);
      setInvoices(prev => [saved, ...prev]);
      setShowForm(false);
      setCurrentInvoice({
        date: new Date().toISOString().split('T')[0],
        number: `${new Date().getFullYear()}/${String(invoices.length + 2).padStart(3, '0')}`,
        tvaRate: 0.10,
        items: [],
        paymentMode: 'Espèce'
      });
    } catch (e) {
      console.error('Failed to save invoice', e);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette facture ?")) return;
    try {
      await invoiceService.delete(Number(id));
      setInvoices(prev => prev.filter(inv => inv.id !== id));
    } catch (e) {
      console.error('Failed to delete invoice', e);
      alert('Erreur lors de la suppression');
    }
  };

  const handleDownloadPdf = async (id: string) => {
    setIsDownloadingPdf(prev => ({ ...prev, [id]: true }));
    try {
      const blob = await invoiceService.downloadPdf(Number(id));
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Facture-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to download PDF', e);
      alert('Erreur lors du téléchargement du PDF');
    } finally {
      setIsDownloadingPdf(prev => ({ ...prev, [id]: false }));
    }
  };

  const { totalHT, tvaAmount, totalTTC } = calculateTotals();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="text-olive-600" />
            Gestion des Factures
          </h1>
          <p className="text-gray-500">Créez et gérez vos factures de vente (Huile, Bouteilles, Grignons...)</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-olive-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-olive-700 transition"
          >
            <Plus size={20} />
            Nouvelle Facture
          </button>
        )}
      </div>

      {showForm ? (
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-4xl mx-auto border border-gray-200">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h2 className="text-xl font-bold text-gray-800">Nouvelle Facture</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">
              <ArrowLeft size={24} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numéro Facture</label>
              <input
                type="text"
                value={currentInvoice.number}
                onChange={e => setCurrentInvoice({ ...currentInvoice, number: e.target.value })}
                className="w-full p-2 border rounded-lg bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={currentInvoice.date}
                onChange={e => setCurrentInvoice({ ...currentInvoice, date: e.target.value })}
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Client (Nom / Raison Sociale)</label>
              <input
                type="text"
                value={currentInvoice.clientName || ''}
                onChange={e => setCurrentInvoice({ ...currentInvoice, clientName: e.target.value })}
                className="w-full p-2 border rounded-lg"
                placeholder="Ex: BEST-CONDI Sarl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
              <input
                type="text"
                value={currentInvoice.clientAddress || ''}
                onChange={e => setCurrentInvoice({ ...currentInvoice, clientAddress: e.target.value })}
                className="w-full p-2 border rounded-lg"
                placeholder="Adresse du client"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ICE</label>
              <input
                type="text"
                value={currentInvoice.clientIce || ''}
                onChange={e => setCurrentInvoice({ ...currentInvoice, clientIce: e.target.value })}
                className="w-full p-2 border rounded-lg"
                placeholder="Identifiant Commun de l'Entreprise"
              />
            </div>
          </div>

          {/* Items Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Articles</h3>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
              <div className="grid grid-cols-12 gap-4 items-end">
                <div className="col-span-5">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Désignation</label>
                  <input
                    type="text"
                    value={newItem.description}
                    onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                    placeholder="Ex: Huile d'olive vrac"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Qté</label>
                  <input
                    type="number"
                    value={newItem.quantity}
                    onChange={e => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Prix Unitaire (DH)</label>
                  <input
                    type="number"
                    value={newItem.unitPrice}
                    onChange={e => setNewItem({ ...newItem, unitPrice: Number(e.target.value) })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div className="col-span-2">
                  <button
                    onClick={handleAddItem}
                    className="w-full bg-olive-600 text-white p-2 rounded-lg hover:bg-olive-700"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            </div>

            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 uppercase">
                <tr>
                  <th className="px-4 py-2">Désignation</th>
                  <th className="px-4 py-2 text-right">Qté</th>
                  <th className="px-4 py-2 text-right">P.U</th>
                  <th className="px-4 py-2 text-right">Total</th>
                  <th className="px-4 py-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {currentInvoice.items?.map(item => (
                  <tr key={item.id}>
                    <td className="px-4 py-2">{item.description}</td>
                    <td className="px-4 py-2 text-right">{item.quantity}</td>
                    <td className="px-4 py-2 text-right">{item.unitPrice.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">{item.totalPrice.toFixed(2)}</td>
                    <td className="px-4 py-2 text-center">
                      <button onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end mb-6">
            <div className="w-1/3 bg-gray-50 p-4 rounded-lg border">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Total H.T</span>
                <span className="font-medium">{totalHT.toFixed(2)} DH</span>
              </div>
              <div className="flex justify-between mb-2 items-center">
                <span className="text-gray-600">TVA (%)</span>
                <select
                  value={currentInvoice.tvaRate}
                  onChange={e => setCurrentInvoice({ ...currentInvoice, tvaRate: Number(e.target.value) })}
                  className="p-1 border rounded text-sm"
                >
                  <option value={0.10}>10%</option>
                  <option value={0.20}>20%</option>
                  <option value={0}>0%</option>
                </select>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Montant TVA</span>
                <span className="font-medium">{tvaAmount.toFixed(2)} DH</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-lg font-bold text-olive-800">
                <span>Total TTC</span>
                <span>{totalTTC.toFixed(2)} DH</span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Arrêtée la présente facture à la somme de :</label>
            <input
              type="text"
              value={currentInvoice.amountInWords || ''}
              readOnly
              className="w-full p-2 border rounded-lg bg-gray-100"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Mode de règlement</label>
            <select
              value={currentInvoice.paymentMode}
              onChange={e => setCurrentInvoice({ ...currentInvoice, paymentMode: e.target.value })}
              className="w-full p-2 border rounded-lg"
            >
              <option value="Espèce">Espèce</option>
              <option value="Chèque">Chèque</option>
              <option value="Virement">Virement</option>
              <option value="Crédit">Crédit</option>
            </select>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Annuler
            </button>
            <button
              onClick={handleSaveInvoice}
              className="px-6 py-2 bg-olive-600 text-white rounded-lg hover:bg-olive-700 font-medium"
            >
              Enregistrer la Facture
            </button>
          </div>
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher par client, numéro..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-olive-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Numéro</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Client</th>
                  <th className="px-6 py-3 text-right">Total TTC</th>
                  <th className="px-6 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.filter(inv => 
                  inv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  inv.number.toLowerCase().includes(searchTerm.toLowerCase())
                ).map(invoice => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{invoice.number}</td>
                    <td className="px-6 py-4 text-gray-500">{new Date(invoice.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-gray-900">{invoice.clientName}</td>
                    <td className="px-6 py-4 text-right font-bold text-olive-700">{invoice.totalTTC.toFixed(2)} DH</td>
                    <td className="px-6 py-4 flex justify-center gap-2">
                      <button
                        onClick={() => handleDownloadPdf(String(invoice.id))}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                        title="Télécharger PDF"
                      >
                        {isDownloadingPdf[String(invoice.id)] ? '...' : <Download size={18} />}
                      </button>
                      <button
                        onClick={() => handleDeleteInvoice(String(invoice.id))}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                        title="Supprimer"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Aucune facture trouvée. Créez-en une nouvelle !
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

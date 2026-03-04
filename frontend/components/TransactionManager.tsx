import React, { useState, useMemo } from 'react';
import { Transaction, Tank, Vehicle, TransactionType, PaymentStatus, PaymentMethod, ProductType } from '../types.ts';
import { Search, Filter, Trash2, Users, FileText, ArrowLeft, TrendingUp, TrendingDown, CreditCard, X, Calendar, DollarSign, Package, Download, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface TransactionManagerProps {
  transactions: Transaction[];
  tanks: Tank[];
  vehicles: Vehicle[];
  onDeleteTransaction: (id: string) => void;
  username: string;
}

const TransactionManager: React.FC<TransactionManagerProps> = ({ transactions, tanks, vehicles, onDeleteTransaction, username }) => {
  const [viewMode, setViewMode] = useState<'journal' | 'partners'>('journal');
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  
  // Advanced Filters State (Global Journal)
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    partner: '',
    product: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: ''
  });

  // Partner Report Filters (Specific to Partner View)
  const [reportRange, setReportRange] = useState({
    start: '',
    end: ''
  });

  // Permission Check
  const canDelete = ['mojo', 'boss', 'hajar', 'safae', 'ZITLBLAD1'].includes(username);

  // --- LOGIC FOR PARTNERS ---
  const partnersData = useMemo(() => {
    const partners: Record<string, { 
      name: string; 
      type: 'Client' | 'Fournisseur' | 'Mixte'; 
      totalSales: number; 
      totalPurchases: number;
      balance: number; // Positive = They owe us, Negative = We owe them
      lastTransactionDate: string;
      transactionCount: number;
    }> = {};

    transactions.forEach(tx => {
      if (!partners[tx.partnerName]) {
        partners[tx.partnerName] = { 
          name: tx.partnerName, 
          type: tx.type === TransactionType.VENTE ? 'Client' : 'Fournisseur', 
          totalSales: 0, 
          totalPurchases: 0, 
          balance: 0,
          lastTransactionDate: tx.date,
          transactionCount: 0
        };
      }

      const p = partners[tx.partnerName];
      p.transactionCount++;
      if (new Date(tx.date) > new Date(p.lastTransactionDate)) {
        p.lastTransactionDate = tx.date;
      }

      if (tx.type === TransactionType.VENTE) {
        p.totalSales += tx.priceTotal;
        const amountUnpaid = tx.priceTotal - (tx.amountPaid || 0);
        p.balance += amountUnpaid;
        if (p.type === 'Fournisseur') p.type = 'Mixte';
      } else if (tx.type === TransactionType.ACHAT) {
        p.totalPurchases += tx.priceTotal;
        const amountUnpaid = tx.priceTotal - (tx.amountPaid || 0);
        p.balance -= amountUnpaid;
        if (p.type === 'Client') p.type = 'Mixte';
      }
    });

    return Object.values(partners).sort((a, b) => new Date(b.lastTransactionDate).getTime() - new Date(a.lastTransactionDate).getTime());
  }, [transactions]);

  // Filter transactions for specific partner view WITH DATES
  const partnerFilteredData = useMemo(() => {
    if (!selectedPartner) return { history: [], previousBalance: 0 };

    // Sort all transactions for this partner by date ascending (for calculation)
    const allPartnerTx = transactions
      .filter(t => t.partnerName === selectedPartner)
      .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let previousBalance = 0;
    let history: Transaction[] = [];

    const startDate = reportRange.start ? new Date(reportRange.start) : null;
    const endDate = reportRange.end ? new Date(reportRange.end) : null;
    if (endDate) endDate.setHours(23, 59, 59, 999);

    if (!startDate && !endDate) {
      history = allPartnerTx.reverse(); // Default view: Newest first, all history
      previousBalance = 0;
    } else {
      // Calculate Previous Balance (Solde Antérieur)
      allPartnerTx.forEach(tx => {
        const txDate = new Date(tx.date);
        
        // If transaction is BEFORE start date, it contributes to previous balance
        if (startDate && txDate < startDate) {
           if (tx.type === TransactionType.VENTE) {
             previousBalance += (tx.priceTotal - (tx.amountPaid || 0));
           } else if (tx.type === TransactionType.ACHAT) {
             previousBalance -= (tx.priceTotal - (tx.amountPaid || 0));
           }
        } 
        // If transaction is within range (or after start if no end), add to history list
        else if ((!startDate || txDate >= startDate) && (!endDate || txDate <= endDate)) {
           history.push(tx);
        }
      });
      // Sort history newest first for display
      history.reverse();
    }

    return { history, previousBalance };
  }, [transactions, selectedPartner, reportRange]);

  // Global Filter Logic for Journal View
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (filters.partner && !t.partnerName.toLowerCase().includes(filters.partner.toLowerCase())) return false;
      if (filters.product && t.productType !== filters.product) return false;
      if (filters.startDate) {
        const start = new Date(filters.startDate);
        start.setHours(0,0,0,0);
        if (new Date(t.date) < start) return false;
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23,59,59,999);
        if (new Date(t.date) > end) return false;
      }
      if (filters.minAmount && t.priceTotal < Number(filters.minAmount)) return false;
      if (filters.maxAmount && t.priceTotal > Number(filters.maxAmount)) return false;
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filters]);

  // PDF GENERATION (Individual Partner)
  const generatePDF = () => {
    if (!selectedPartner) return;

    const doc = new jsPDF();
    const partnerInfo = partnersData.find(p => p.name === selectedPartner);
    const { history, previousBalance } = partnerFilteredData;

    // --- Header ---
    doc.setFillColor(53, 81, 45); // Olive Green
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("MARRAKECH AGRO", 14, 15);
    doc.setFontSize(10);
    doc.text("Usine d'Huile d'Olive & Produits Agricoles", 14, 22);

    // --- Title ---
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(16);
    doc.text("RELEVÉ DE COMPTE", 14, 45);

    // --- Partner Info Box ---
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(250, 250, 250);
    doc.rect(120, 35, 76, 30, 'FD');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Partenaire:", 125, 42);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(selectedPartner, 125, 49);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Type: ${partnerInfo?.type || '-'}`, 125, 56);

    // --- Period Info ---
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    const dateStr = reportRange.start 
      ? `Période du: ${new Date(reportRange.start).toLocaleDateString()} au ${reportRange.end ? new Date(reportRange.end).toLocaleDateString() : "Aujourd'hui"}`
      : `Date d'édition: ${new Date().toLocaleDateString()}`;
    doc.text(dateStr, 14, 55);

    // --- Summary Calculations ---
    let runningBalance = previousBalance; 
    
    // RE-DOING TABLE LOGIC FOR CLARITY IN PDF
    // Columns: Date | Opération | Débit (Vente) | Crédit (Achat/Paiement) | Solde
    let pdfBalance = previousBalance;
    const finalRows = history.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(tx => {
        let debit = 0;
        let credit = 0;
        
        if (tx.type === TransactionType.VENTE) {
            debit = tx.priceTotal; // Vente augmente ce qu'il nous doit
            credit = tx.amountPaid || 0; // Paiement diminue ce qu'il nous doit
        } else {
            // Achat
            credit = tx.priceTotal; // Achat diminue ce qu'il nous doit (ou augmente ce qu'on lui doit)
            debit = tx.amountPaid || 0; // Notre paiement diminue ce qu'on lui doit
        }
        
        pdfBalance = pdfBalance + debit - credit;
        
        return [
            new Date(tx.date).toLocaleDateString(),
            `${tx.type} - ${tx.productType}`,
            debit > 0 ? debit.toLocaleString() : '-',
            credit > 0 ? credit.toLocaleString() : '-',
            pdfBalance.toLocaleString()
        ];
    });

    if (reportRange.start) {
        finalRows.unshift([
            new Date(reportRange.start).toLocaleDateString(),
            "REPORT SOLDE ANTÉRIEUR",
            "-",
            "-",
            previousBalance.toLocaleString()
        ]);
    }

    // --- Generate Table ---
    autoTable(doc, {
      startY: 75,
      head: [['Date', 'Libellé', 'Débit (Client Doit)', 'Crédit (Versé/Frs)', 'Solde Progressif']],
      body: finalRows,
      theme: 'grid',
      headStyles: { fillColor: [86, 131, 72], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right', fontStyle: 'bold', fillColor: [245, 245, 245] }
      },
      styles: { fontSize: 9 },
    });

    // --- Footer ---
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(10);
    doc.text("Solde final :", 14, finalY);
    doc.setFont("helvetica", "bold");
    
    const balanceText = pdfBalance > 0 
      ? `Le client nous doit : ${pdfBalance.toLocaleString()} MAD`
      : pdfBalance < 0 
        ? `Nous devons au partenaire : ${Math.abs(pdfBalance).toLocaleString()} MAD`
        : `Compte Soldé (0.00 MAD)`;
        
    doc.text(balanceText, 14, finalY + 7);

    doc.save(`Releve_${selectedPartner}_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  // PDF GENERATION (Global Partners List)
  const generateGlobalPartnersPDF = () => {
      const doc = new jsPDF();
      
      // Header
      doc.setFillColor(53, 81, 45);
      doc.rect(0, 0, 210, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text("SITUATION GLOBALE PARTENAIRES", 14, 13);
      doc.setFontSize(10);
      doc.text(new Date().toLocaleDateString(), 180, 13);

      const rows = partnersData.map(p => [
          p.name,
          p.type,
          (p.totalSales).toLocaleString(),
          (p.totalPurchases).toLocaleString(),
          p.balance > 0 ? `+${p.balance.toLocaleString()} (Doit)` : p.balance < 0 ? `${p.balance.toLocaleString()} (Avoir)` : '-'
      ]);

      autoTable(doc, {
          startY: 30,
          head: [['Partenaire', 'Type', 'Total Ventes', 'Total Achats', 'Solde Actuel']],
          body: rows,
          theme: 'striped',
          headStyles: { fillColor: [60, 60, 60] },
          columnStyles: {
              2: { halign: 'right' },
              3: { halign: 'right' },
              4: { halign: 'right', fontStyle: 'bold' }
          }
      });

      doc.save('Situation_Partenaires_Global.pdf');
  };

  const resetFilters = () => {
    setFilters({
      partner: '',
      product: '',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: ''
    });
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="space-y-6">
      
      {/* HEADER & TABS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {selectedPartner ? `Fiche Partenaire : ${selectedPartner}` : 'Achats & Ventes'}
          </h2>
          <p className="text-gray-500">
             {selectedPartner ? 'Historique détaillé et situation financière' : 'Suivi des opérations commerciales'}
          </p>
        </div>

        {!selectedPartner && (
          <div className="flex gap-2">
             <div className="bg-white p-1 rounded-lg border flex shadow-sm">
                <button 
                onClick={() => setViewMode('journal')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${viewMode === 'journal' ? 'bg-olive-100 text-olive-800 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                <FileText size={18} /> Journal
                </button>
                <button 
                onClick={() => setViewMode('partners')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${viewMode === 'partners' ? 'bg-olive-100 text-olive-800 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                <Users size={18} /> Partenaires
                </button>
            </div>
            {viewMode === 'partners' && (
                <button 
                    onClick={generateGlobalPartnersPDF}
                    className="bg-gray-800 text-white px-3 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2 shadow-sm"
                    title="Télécharger liste globale PDF"
                >
                    <Download size={18}/>
                </button>
            )}
          </div>
        )}
        
        {selectedPartner && (
          <div className="flex gap-2">
            <button 
              onClick={generatePDF}
              className="flex items-center gap-2 px-4 py-2 bg-olive-600 text-white rounded-lg hover:bg-olive-700 shadow-sm"
              title="Télécharger Relevé PDF"
            >
              <Download size={18} /> <span className="hidden md:inline">PDF Situation</span>
            </button>
            <button 
              onClick={() => {
                setSelectedPartner(null);
                setReportRange({start: '', end: ''});
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <ArrowLeft size={18} /> Retour
            </button>
          </div>
        )}
      </div>

      {/* VIEW: JOURNAL GLOBAL */}
      {viewMode === 'journal' && !selectedPartner && (
        <div className="space-y-4">
          
          {/* FILTER BAR */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex justify-between items-center mb-2">
               <h3 className="font-bold text-gray-700 flex items-center gap-2">
                 <Filter size={18} /> Filtres
                 {activeFiltersCount > 0 && <span className="bg-olive-600 text-white text-xs px-2 py-0.5 rounded-full">{activeFiltersCount}</span>}
               </h3>
               <div className="flex gap-2">
                  {activeFiltersCount > 0 && (
                    <button onClick={resetFilters} className="text-sm text-gray-500 hover:text-red-500 underline">Effacer tout</button>
                  )}
                  <button onClick={() => setShowFilters(!showFilters)} className="md:hidden p-2 bg-gray-100 rounded">
                    {showFilters ? <X size={16}/> : <Filter size={16}/>}
                  </button>
               </div>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 ${showFilters ? 'block' : 'hidden md:grid'}`}>
               {/* 1. Partner Search */}
               <div className="relative">
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Partenaire</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Nom du client/frs..." 
                      value={filters.partner}
                      onChange={e => setFilters({...filters, partner: e.target.value})}
                      className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-olive-500 outline-none" 
                    />
                  </div>
               </div>

               {/* 2. Product Select */}
               <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Produit</label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <select
                       value={filters.product}
                       onChange={e => setFilters({...filters, product: e.target.value})}
                       className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-olive-500 outline-none"
                    >
                       <option value="">Tous les produits</option>
                       {Object.values(ProductType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
               </div>

               {/* 3. Date Range */}
               <div>
                 <label className="text-xs font-semibold text-gray-500 mb-1 block">Période</label>
                 <div className="flex gap-2">
                   <input 
                      type="date" 
                      className="w-full border rounded-lg px-2 py-2 text-xs focus:ring-2 focus:ring-olive-500 outline-none"
                      value={filters.startDate}
                      onChange={e => setFilters({...filters, startDate: e.target.value})}
                   />
                   <span className="self-center text-gray-400">-</span>
                   <input 
                      type="date" 
                      className="w-full border rounded-lg px-2 py-2 text-xs focus:ring-2 focus:ring-olive-500 outline-none"
                      value={filters.endDate}
                      onChange={e => setFilters({...filters, endDate: e.target.value})}
                   />
                 </div>
               </div>

               {/* 4. Amount Range */}
               <div>
                 <label className="text-xs font-semibold text-gray-500 mb-1 block">Montant (MAD)</label>
                 <div className="flex gap-2 items-center">
                    <input 
                      type="number" placeholder="Min"
                      className="w-full border rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-olive-500 outline-none"
                      value={filters.minAmount}
                      onChange={e => setFilters({...filters, minAmount: e.target.value})}
                    />
                    <span className="text-gray-400 text-xs">à</span>
                    <input 
                      type="number" placeholder="Max"
                      className="w-full border rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-olive-500 outline-none"
                      value={filters.maxAmount}
                      onChange={e => setFilters({...filters, maxAmount: e.target.value})}
                    />
                 </div>
               </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 border-b">
                <tr>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Partenaire</th>
                  <th className="px-6 py-4 font-medium">Produit</th>
                  <th className="px-6 py-4 font-medium">Paiement</th>
                  <th className="px-6 py-4 font-medium text-right">Montant</th>
                  <th className="px-6 py-4 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTransactions.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-gray-400">Aucune transaction trouvée avec ces filtres.</td></tr>
                ) : (
                  filteredTransactions.map(tx => {
                    const linkedTank = tanks.find(t => t.id === tx.tankId);
                    return (
                      <tr key={tx.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-4 text-gray-600">{new Date(tx.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            tx.type === TransactionType.VENTE ? 'bg-green-100 text-green-700' : 
                            tx.type === TransactionType.ACHAT ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">{tx.partnerName}</td>
                        <td className="px-6 py-4">
                          <div className="text-gray-800">{tx.productType}</div>
                          <div className="text-xs text-gray-500">{tx.quantity} {tx.unit} {linkedTank ? `(${linkedTank.name})` : ''}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                             <span className="text-xs font-bold text-gray-700">{tx.paymentMethod}</span>
                             <span className={`text-[10px] uppercase font-bold ${
                               tx.paymentStatus === PaymentStatus.PAYE ? 'text-green-600' : 'text-red-500'
                             }`}>{tx.paymentStatus}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-gray-900">{tx.priceTotal.toLocaleString()} MAD</td>
                        <td className="px-6 py-4">
                          {canDelete && (
                            <button 
                                onClick={() => onDeleteTransaction(tx.id)}
                                className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Supprimer">
                                <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: PARTNERS LIST */}
      {viewMode === 'partners' && !selectedPartner && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {partnersData.map((partner, idx) => (
            <div 
              key={idx} 
              onClick={() => setSelectedPartner(partner.name)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md hover:border-olive-300 transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-gray-100 p-3 rounded-full text-gray-600 group-hover:bg-olive-100 group-hover:text-olive-700 transition-colors">
                  <Users size={24} />
                </div>
                <div className="text-right">
                  <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                    partner.type === 'Client' ? 'bg-green-50 text-green-700' : 
                    partner.type === 'Fournisseur' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                  }`}>
                    {partner.type}
                  </span>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-gray-800 mb-1">{partner.name}</h3>
              <p className="text-sm text-gray-500 mb-4">{partner.transactionCount} transactions • Dernier: {new Date(partner.lastTransactionDate).toLocaleDateString()}</p>
              
              <div className="border-t pt-4 space-y-2">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Volume Affaires</span>
                    <span className="font-medium text-gray-900">{(partner.totalSales + partner.totalPurchases).toLocaleString()} MAD</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Situation (Solde)</span>
                    <span className={`font-bold ${partner.balance > 0 ? 'text-red-500' : partner.balance < 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {partner.balance > 0 ? `Doit: ${partner.balance.toLocaleString()} MAD` : 
                       partner.balance < 0 ? `On doit: ${Math.abs(partner.balance).toLocaleString()} MAD` : 
                       'Réglé'}
                    </span>
                 </div>
              </div>
            </div>
          ))}
          {partnersData.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed">
              Aucune donnée partenaire disponible.
            </div>
          )}
        </div>
      )}

      {/* VIEW: PARTNER DETAILS (WITH PDF FILTER) */}
      {selectedPartner && (
        <div className="space-y-6 animate-fade-in">
           
           {/* Date Filter specifically for the Report/PDF */}
           <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-wrap items-center gap-4 shadow-sm">
              <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Filter size={16}/> Filtrer Relevé / PDF :
              </span>
              <div className="flex items-center gap-2">
                 <label className="text-xs text-gray-500">Du</label>
                 <input 
                   type="date" 
                   value={reportRange.start} 
                   onChange={e => setReportRange({...reportRange, start: e.target.value})}
                   className="border rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-olive-500"
                 />
              </div>
              <div className="flex items-center gap-2">
                 <label className="text-xs text-gray-500">Au</label>
                 <input 
                   type="date" 
                   value={reportRange.end} 
                   onChange={e => setReportRange({...reportRange, end: e.target.value})}
                   className="border rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-olive-500"
                 />
              </div>
              {(reportRange.start || reportRange.end) && (
                <button onClick={() => setReportRange({start: '', end: ''})} className="text-xs text-red-500 hover:underline">
                  Effacer
                </button>
              )}
           </div>

           {/* Summary Card for this Partner */}
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <span className="text-sm text-gray-500 block mb-1">Total Acheté (chez nous)</span>
                <span className="text-2xl font-bold text-green-700 flex items-center gap-2">
                   <TrendingUp size={20} />
                   {partnersData.find(p => p.name === selectedPartner)?.totalSales.toLocaleString()} <span className="text-sm text-gray-400">MAD</span>
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-500 block mb-1">Total Vendu (à nous)</span>
                <span className="text-2xl font-bold text-blue-700 flex items-center gap-2">
                   <TrendingDown size={20} />
                   {partnersData.find(p => p.name === selectedPartner)?.totalPurchases.toLocaleString()} <span className="text-sm text-gray-400">MAD</span>
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-500 block mb-1">Reste à Payer (Total Global)</span>
                <span className={`text-2xl font-bold flex items-center gap-2 ${
                  (partnersData.find(p => p.name === selectedPartner)?.balance || 0) !== 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                   <CreditCard size={20} />
                   {Math.abs(partnersData.find(p => p.name === selectedPartner)?.balance || 0).toLocaleString()} <span className="text-sm text-gray-400">MAD</span>
                </span>
                <span className="text-xs text-gray-400">
                  {(partnersData.find(p => p.name === selectedPartner)?.balance || 0) > 0 ? '(Le client nous doit)' : 
                   (partnersData.find(p => p.name === selectedPartner)?.balance || 0) < 0 ? '(Nous devons au fournisseur)' : '(Compte soldé)'}
                </span>
              </div>
           </div>

           {/* Detailed Table */}
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="bg-gray-50 px-6 py-4 border-b font-medium text-gray-700 flex justify-between items-center">
               <span>Historique des Transactions {reportRange.start ? '(Filtré)' : ''}</span>
               {partnerFilteredData.previousBalance !== 0 && (
                 <span className="text-sm text-gray-500">
                   Report Antérieur : <span className="font-bold">{partnerFilteredData.previousBalance.toLocaleString()} MAD</span>
                 </span>
               )}
             </div>
             <table className="w-full text-left text-sm">
                <thead className="bg-white text-gray-500 border-b">
                  <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Opération</th>
                    <th className="px-6 py-3">Détails Produit</th>
                    <th className="px-6 py-3 text-right">Montant Total</th>
                    <th className="px-6 py-3 text-right">Montant Payé</th>
                    <th className="px-6 py-3">Moyen Paiement</th>
                    <th className="px-6 py-3">Reste</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                   {partnerFilteredData.history.length === 0 ? (
                     <tr><td colSpan={7} className="p-8 text-center text-gray-400">Aucune transaction sur cette période.</td></tr>
                   ) : (
                     partnerFilteredData.history.map(tx => {
                       const unpaid = tx.priceTotal - (tx.amountPaid || 0);
                       return (
                         <tr key={tx.id} className="hover:bg-gray-50 group">
                           <td className="px-6 py-3 text-gray-600">{new Date(tx.date).toLocaleDateString()}</td>
                           <td className="px-6 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                tx.type === TransactionType.VENTE ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {tx.type}
                              </span>
                           </td>
                           <td className="px-6 py-3">
                              <div className="text-gray-800 font-medium">{tx.productType}</div>
                              {tx.details && <div className="text-xs text-gray-500">{tx.details}</div>}
                           </td>
                           <td className="px-6 py-3 text-right font-medium">{tx.priceTotal.toLocaleString()}</td>
                           <td className="px-6 py-3 text-right text-green-600">{tx.amountPaid?.toLocaleString()}</td>
                           <td className="px-6 py-3 text-gray-600">{tx.paymentMethod}</td>
                           <td className="px-6 py-3 text-right font-bold text-red-500">
                             {unpaid > 0 ? unpaid.toLocaleString() : '-'}
                           </td>
                         </tr>
                       );
                     })
                   )}
                </tbody>
             </table>
           </div>
        </div>
      )}
    </div>
  );
};

export default TransactionManager;
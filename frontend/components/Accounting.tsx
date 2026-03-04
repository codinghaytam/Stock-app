import React, { useState } from 'react';
import { Transaction, Expense, Check, TransactionType, PaymentMethod, PaymentStatus, BankAccount, Currency } from '../types.ts';
import { Wallet, Banknote, CreditCard, AlertCircle, Plus, TrendingDown, TrendingUp, Calendar, Trash2, Clock, Landmark, Globe, Download, ScrollText, ArrowRight, ShieldCheck, Briefcase } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AccountingProps {
  transactions: Transaction[];
  expenses: Expense[];
  checks: Check[];
  bankAccounts: BankAccount[];
  onAddExpense: (expense: any) => void;
  onDeleteTransaction: (id: string) => void;
  onDeleteExpense: (id: string) => void;
  onAddManualCash: (amount: number, description: string, type: 'IN' | 'OUT') => void;
  onAddCheck: (check: Check) => void;
  onDeleteCheck: (id: string) => void;
  onAddBankAccount: (account: BankAccount) => void;
  onUpdateBankAccount?: (account: BankAccount) => void; // New prop for update
  username: string;
}

const Accounting: React.FC<AccountingProps> = ({ 
  transactions, expenses, checks, bankAccounts,
  onAddExpense, onDeleteTransaction, onDeleteExpense,
  onAddManualCash, onAddCheck, onDeleteCheck, onAddBankAccount, onUpdateBankAccount,
  username
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'caisse' | 'bank' | 'checks' | 'debts' | 'expenses'>('overview');
  
  // Forms States
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [newExpense, setNewExpense] = useState({ 
    description: '', 
    amount: '', 
    category: 'Autre',
    paymentMethod: PaymentMethod.ESPECE 
  });
  
  const [showCashForm, setShowCashForm] = useState(false);
  const [newCash, setNewCash] = useState({ amount: '', description: '', type: 'IN' as 'IN' | 'OUT' });

  // Specific Transfer to Director Form
  const [showTransferDirector, setShowTransferDirector] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');

  // Specific Transfer to Bank Form
  const [showTransferBank, setShowTransferBank] = useState(false);
  const [transferBankAmount, setTransferBankAmount] = useState('');
  const [selectedTransferBankId, setSelectedTransferBankId] = useState('');

  const [showCheckForm, setShowCheckForm] = useState(false);
  const [newCheck, setNewCheck] = useState<Partial<Check>>({ 
    number: '', bank: '', amount: 0, partnerName: '', 
    direction: 'Recu', status: 'En Coffre', dueDate: new Date().toISOString().split('T')[0] 
  });

  const [showBankForm, setShowBankForm] = useState(false);
  const [newBank, setNewBank] = useState<Partial<BankAccount>>({ bankName: '', accountNumber: '', currency: Currency.MAD, balance: 0 });

  // Permissions
  const canDelete = ['mojo', 'boss', 'hajar', 'safae', 'ZITLBLAD1'].includes(username);

  // --- CALCULATIONS ---

  // 1. Caisse Usine (ESPECE)
  const cashIn = transactions
    .filter(t => t.type === TransactionType.VENTE && t.paymentMethod === PaymentMethod.ESPECE)
    .reduce((sum, t) => sum + (t.amountPaid || 0), 0);
  
  const cashOutTransactions = transactions
    .filter(t => t.type === TransactionType.ACHAT && t.paymentMethod === PaymentMethod.ESPECE)
    .reduce((sum, t) => sum + (t.amountPaid || 0), 0);
  
  const cashOutExpenses = expenses
    .filter(e => e.paymentMethod === PaymentMethod.ESPECE)
    .reduce((sum, e) => sum + e.amount, 0);

  const totalCash = cashIn - (cashOutTransactions + cashOutExpenses); 

  // 2. Caisse Directeur
  // Entrées : Transferts depuis l'usine (Dépenses catégorie 'Transfert' et méthode 'Espèce' avec description spécifique)
  const directorInTransfers = expenses
    .filter(e => e.category === 'Transfert' && e.paymentMethod === PaymentMethod.ESPECE)
    .reduce((sum, e) => sum + e.amount, 0);
  
  // Note: On pourrait aussi avoir des ventes payées directement au directeur (rare mais possible)
  const directorInSales = transactions
    .filter(t => t.type === TransactionType.VENTE && t.paymentMethod === PaymentMethod.CAISSE_DIRECTEUR)
    .reduce((sum, t) => sum + (t.amountPaid || 0), 0);

  // Sorties : Achats payés par le directeur + Dépenses payées par le directeur
  const directorOutPurchases = transactions
    .filter(t => t.type === TransactionType.ACHAT && t.paymentMethod === PaymentMethod.CAISSE_DIRECTEUR)
    .reduce((sum, t) => sum + (t.amountPaid || 0), 0);

  const directorOutExpenses = expenses
    .filter(e => e.paymentMethod === PaymentMethod.CAISSE_DIRECTEUR)
    .reduce((sum, e) => sum + e.amount, 0);

  const totalDirectorCash = (directorInTransfers + directorInSales) - (directorOutPurchases + directorOutExpenses);

  // 3. Chèques
  const checksInHand = checks
    .filter(c => c.direction === 'Recu' && c.status === 'En Coffre')
    .reduce((sum, c) => sum + c.amount, 0);

  // 4. Dettes & Créances
  const receivables = transactions
    .filter(t => t.type === TransactionType.VENTE && t.paymentStatus !== PaymentStatus.PAYE)
    .reduce((sum, t) => sum + (t.priceTotal - (t.amountPaid || 0)), 0);

  const payables = transactions
    .filter(t => t.type === TransactionType.ACHAT && t.paymentStatus !== PaymentStatus.PAYE)
    .reduce((sum, t) => sum + (t.priceTotal - (t.amountPaid || 0)), 0);

  // --- PDF GENERATORS ---

  const generateCashPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(53, 81, 45);
    doc.rect(0, 0, 210, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("JOURNAL DE CAISSE (ESPÈCES)", 14, 13);
    doc.setFontSize(10);
    doc.text(`Date d'édition : ${new Date().toLocaleDateString()}`, 150, 13);

    // Data Preparation
    const data = [
        ...transactions.filter(t => t.paymentMethod === PaymentMethod.ESPECE).map(t => ({
          date: t.date,
          type: t.type === TransactionType.VENTE ? 'Recette Vente' : 'Paiement Achat',
          desc: `${t.productType} - ${t.partnerName}`,
          in: t.type === TransactionType.VENTE ? t.amountPaid : 0,
          out: t.type === TransactionType.ACHAT ? t.amountPaid : 0,
        })),
        ...expenses.filter(e => e.paymentMethod === PaymentMethod.ESPECE).map(e => ({
          date: e.date,
          type: e.category === 'Transfert' ? 'Transfert/Versement' : (e.category === 'Autre' && e.description.includes('Manuel') ? 'Opération Manuelle' : `Dépense (${e.category})`),
          desc: e.description,
          in: e.amount < 0 ? Math.abs(e.amount) : 0,
          out: e.amount > 0 ? e.amount : 0,
        }))
    ].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const tableRows = data.map(item => [
        new Date(item.date).toLocaleDateString(),
        item.type,
        item.desc,
        item.in ? `+${(item.in || 0).toLocaleString()}` : '',
        item.out ? `-${(item.out || 0).toLocaleString()}` : ''
    ]);

    autoTable(doc, {
        startY: 30,
        head: [['Date', 'Type', 'Description', 'Entrée', 'Sortie']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [65, 102, 54] },
        columnStyles: {
            3: { halign: 'right', textColor: [0, 128, 0], fontStyle: 'bold' },
            4: { halign: 'right', textColor: [192, 0, 0], fontStyle: 'bold' }
        }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`SOLDE ACTUEL CAISSE : ${totalCash.toLocaleString()} MAD`, 14, finalY);

    doc.save('Journal_Caisse.pdf');
  };

  const generateExpensesPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(180, 50, 50); // Reddish header for expenses
    doc.rect(0, 0, 210, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("RAPPORT DES DÉPENSES", 14, 13);
    
    const expenseData = expenses.filter(e => e.amount > 0).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const totalExp = expenseData.reduce((acc, e) => acc + e.amount, 0);

    const rows = expenseData.map(e => [
        new Date(e.date).toLocaleDateString(),
        e.category,
        e.description,
        e.paymentMethod,
        e.amount.toLocaleString()
    ]);

    autoTable(doc, {
        startY: 30,
        head: [['Date', 'Catégorie', 'Description', 'Paiement', 'Montant (MAD)']],
        body: rows,
        theme: 'striped',
        headStyles: { fillColor: [180, 50, 50] },
        columnStyles: { 4: { halign: 'right', fontStyle: 'bold' } }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setTextColor(0, 0, 0);
    doc.text(`TOTAL DÉPENSES : ${totalExp.toLocaleString()} MAD`, 14, finalY);

    doc.save('Rapport_Depenses.pdf');
  };

  // --- HANDLERS ---

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddExpense({
      ...newExpense,
      amount: Number(newExpense.amount),
      date: new Date().toISOString(),
      paymentMethod: newExpense.paymentMethod // Use selected method
    });
    setNewExpense({ description: '', amount: '', category: 'Autre', paymentMethod: PaymentMethod.ESPECE });
    setShowExpenseForm(false);
  };

  const handleCashSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddManualCash(Number(newCash.amount), newCash.description, newCash.type);
    setShowCashForm(false);
    setNewCash({ amount: '', description: '', type: 'IN' });
  };

  const handleTransferDirector = (e: React.FormEvent) => {
      e.preventDefault();
      const amount = Number(transferAmount);
      if(amount > totalCash) {
          alert("Solde Caisse Usine insuffisant pour ce transfert.");
          return;
      }
      if(amount > 0) {
          onAddExpense({
              date: new Date().toISOString(),
              category: 'Transfert',
              description: 'Vers Caisse Directeur (Retrait Usine)',
              amount: amount,
              paymentMethod: PaymentMethod.ESPECE
          });
          setTransferAmount('');
          setShowTransferDirector(false);
          alert("Transfert effectué ! L'argent est maintenant dans la Caisse Directeur.");
      }
  };

  const handleTransferBank = (e: React.FormEvent) => {
      e.preventDefault();
      const amount = Number(transferBankAmount);
      
      if(amount > totalCash) {
          alert("Solde Caisse Usine insuffisant pour ce versement.");
          return;
      }
      
      if(amount > 0 && selectedTransferBankId && onUpdateBankAccount) {
          const bank = bankAccounts.find(b => b.id === selectedTransferBankId);
          if(bank) {
              // 1. Create Expense to reduce Cash
              onAddExpense({
                  date: new Date().toISOString(),
                  category: 'Transfert',
                  description: `Versement vers Banque (${bank.bankName})`,
                  amount: amount,
                  paymentMethod: PaymentMethod.ESPECE
              });

              // 2. Update Bank Account Balance (Increase)
              onUpdateBankAccount({
                  ...bank,
                  balance: bank.balance + amount
              });

              setTransferBankAmount('');
              setSelectedTransferBankId('');
              setShowTransferBank(false);
              alert(`Versement de ${amount.toLocaleString()} MAD vers ${bank.bankName} effectué.`);
          }
      }
  };

  const handleCheckSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddCheck({
      id: `CHK${Date.now()}`,
      number: newCheck.number!,
      bank: newCheck.bank!,
      amount: Number(newCheck.amount),
      dueDate: newCheck.dueDate!,
      status: newCheck.status as any,
      direction: newCheck.direction as any,
      partnerName: newCheck.partnerName!
    });
    setShowCheckForm(false);
  };

  const handleBankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddBankAccount({
      id: `BK${Date.now()}`,
      bankName: newBank.bankName!,
      accountNumber: newBank.accountNumber!,
      currency: newBank.currency || Currency.MAD,
      balance: Number(newBank.balance)
    });
    setShowBankForm(false);
    setNewBank({ bankName: '', accountNumber: '', currency: Currency.MAD, balance: 0 });
  };

  return (
    <div className="space-y-6">
      
      {/* Navigation Sub-tabs */}
      <div className="flex border-b border-gray-200 bg-white px-6 pt-4 rounded-t-xl gap-6 overflow-x-auto">
        {[
          { id: 'overview', label: 'Vue Globale' },
          { id: 'bank', label: 'Comptes Bancaires' },
          { id: 'caisse', label: 'Journal Caisse' },
          { id: 'checks', label: 'Chèques' },
          { id: 'debts', label: 'Dettes & Créances' },
          { id: 'expenses', label: 'Dépenses' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`pb-4 text-sm font-medium transition-colors relative whitespace-nowrap ${
              activeSubTab === tab.id 
                ? 'text-olive-600 border-b-2 border-olive-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* --- CONTENT --- */}

      {/* OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-green-200 p-2 rounded-lg text-green-700"><Wallet size={24} /></div>
                <span className="text-xs font-bold text-green-700 uppercase tracking-wider">Caisse Usine</span>
              </div>
              <div className="text-3xl font-bold text-gray-800">{totalCash.toLocaleString()} <span className="text-sm font-normal text-gray-500">MAD</span></div>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700 shadow-sm text-white">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-slate-700 p-2 rounded-lg text-yellow-400"><Briefcase size={24} /></div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Caisse Directeur</span>
              </div>
              <div className="text-3xl font-bold text-white">{totalDirectorCash.toLocaleString()} <span className="text-sm font-normal text-slate-400">MAD</span></div>
              <p className="text-xs text-slate-400 mt-1">Fonds privés / Réserve</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-indigo-100 p-2 rounded-lg text-indigo-700"><Landmark size={24} /></div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Banques (Total)</span>
              </div>
              <div className="text-3xl font-bold text-gray-800">
                {bankAccounts.reduce((acc, b) => acc + (b.currency === Currency.MAD ? b.balance : 0), 0).toLocaleString()} <span className="text-sm font-normal text-gray-500">MAD</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Hors devises étrangères</p>
            </div>

            {/* CHECK TOTAL CARD */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-purple-100 p-2 rounded-lg text-purple-700"><ScrollText size={24} /></div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Chèques (Coffre)</span>
              </div>
              <div className="text-3xl font-bold text-gray-800">
                {checksInHand.toLocaleString()} <span className="text-sm font-normal text-gray-500">MAD</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">En portefeuille</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-red-100 p-2 rounded-lg text-red-700"><TrendingDown size={24} /></div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Dettes</span>
              </div>
              <div className="text-3xl font-bold text-gray-800">{payables.toLocaleString()} <span className="text-sm font-normal text-gray-500">MAD</span></div>
            </div>
          </div>
        </div>
      )}

      {/* BANK ACCOUNTS */}
      {activeSubTab === 'bank' && (
        <div className="space-y-6">
           <div className="flex justify-between items-center">
             <h3 className="text-lg font-bold text-gray-800">Vos Comptes Bancaires</h3>
             <button 
               onClick={() => setShowBankForm(true)}
               className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-sm"
             >
               <Plus size={18} /> Nouveau Compte
             </button>
           </div>

           {showBankForm && (
             <div className="bg-white p-6 rounded-xl shadow-lg border border-indigo-100 max-w-2xl mx-auto">
               <h4 className="font-bold mb-4">Ajouter un Compte Bancaire</h4>
               <form onSubmit={handleBankSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nom de la Banque</label>
                    <input className="w-full border rounded p-2" required placeholder="ex: CIH, BMCE" value={newBank.bankName} onChange={e => setNewBank({...newBank, bankName: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Numéro de Compte / RIB</label>
                    <input className="w-full border rounded p-2" required placeholder="XXXX-XXXX" value={newBank.accountNumber} onChange={e => setNewBank({...newBank, accountNumber: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Devise</label>
                    <select className="w-full border rounded p-2" value={newBank.currency} onChange={e => setNewBank({...newBank, currency: e.target.value as Currency})}>
                       {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Solde Initial</label>
                    <input type="number" className="w-full border rounded p-2" required value={newBank.balance} onChange={e => setNewBank({...newBank, balance: Number(e.target.value)})} />
                  </div>
                  <div className="col-span-full flex justify-end gap-2 mt-2">
                    <button type="button" onClick={() => setShowBankForm(false)} className="px-4 py-2 text-gray-600">Annuler</button>
                    <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded">Ajouter</button>
                  </div>
               </form>
             </div>
           )}

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {bankAccounts.map(account => (
                <div key={account.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative overflow-hidden group hover:border-indigo-300 transition-all">
                   <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Landmark size={60} className="text-indigo-900" />
                   </div>
                   
                   <div className="flex justify-between items-start mb-4">
                     <div>
                       <h3 className="font-bold text-xl text-gray-800">{account.bankName}</h3>
                       <p className="text-sm text-gray-500 font-mono mt-1">{account.accountNumber}</p>
                     </div>
                     <span className={`px-2 py-1 rounded text-xs font-bold ${
                        account.currency === Currency.MAD ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700 flex items-center gap-1'
                     }`}>
                        {account.currency !== Currency.MAD && <Globe size={12}/>}
                        {account.currency}
                     </span>
                   </div>
                   
                   <div className="mt-6 pt-4 border-t border-gray-100">
                      <span className="text-sm text-gray-500 block mb-1">Solde Actuel</span>
                      <span className={`text-2xl font-bold ${account.balance >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                        {account.balance.toLocaleString()} {account.currency}
                      </span>
                   </div>
                </div>
              ))}
              {bankAccounts.length === 0 && (
                <div className="col-span-3 text-center py-12 text-gray-400 border-2 border-dashed rounded-xl">
                  Aucun compte bancaire configuré.
                </div>
              )}
           </div>
        </div>
      )}

      {/* CAISSE DETAILS */}
      {activeSubTab === 'caisse' && (
        <div className="space-y-6">
            
            {/* DIRECTOR CASH INFO */}
            <div className="bg-gray-900 text-white rounded-xl shadow-md p-6 flex flex-col md:flex-row justify-between items-center gap-4">
               <div>
                   <h3 className="text-lg font-bold flex items-center gap-2">
                       <ShieldCheck className="text-yellow-500"/> Caisse Directeur (Réserve)
                   </h3>
                   <p className="text-gray-400 text-sm">Gestion des fonds privés et retraits usine</p>
               </div>
               <div className="text-center md:text-right">
                   <div className="text-3xl font-mono font-bold text-yellow-400">{totalDirectorCash.toLocaleString()} MAD</div>
                   <div className="text-xs text-gray-500 mt-1">Disponible</div>
               </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center flex-wrap gap-2">
                    <div>
                        <h3 className="font-bold text-gray-700">Mouvements Caisse Usine</h3>
                        <p className="text-xs text-green-600 font-bold">Solde Usine: {totalCash.toLocaleString()} MAD</p>
                    </div>
                    <div className="flex gap-2 items-center flex-wrap">
                        {/* BUTTON: TRANSFER TO BANK */}
                        <button 
                            onClick={() => {
                                setShowTransferBank(!showTransferBank);
                                setShowTransferDirector(false);
                                setShowCashForm(false);
                            }}
                            className="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm hover:bg-indigo-700 flex items-center gap-2 shadow-sm"
                        >
                            <Landmark size={14}/> Verser en Banque
                        </button>

                        <button 
                            onClick={() => {
                                setShowTransferDirector(!showTransferDirector);
                                setShowTransferBank(false);
                                setShowCashForm(false);
                            }}
                            className="bg-gray-800 text-white px-3 py-1.5 rounded text-sm hover:bg-gray-900 flex items-center gap-2 shadow-sm border border-gray-600"
                        >
                            <ArrowRight size={14}/> Verser au Directeur
                        </button>
                        <button 
                            onClick={generateCashPDF}
                            className="bg-white text-gray-700 border border-gray-300 px-3 py-1.5 rounded text-sm hover:bg-gray-50 flex items-center gap-1"
                        >
                            <Download size={14}/> PDF
                        </button>
                        <button 
                            onClick={() => {
                                setShowCashForm(!showCashForm);
                                setShowTransferBank(false);
                                setShowTransferDirector(false);
                            }}
                            className="bg-olive-600 text-white px-3 py-1.5 rounded text-sm hover:bg-olive-700 flex items-center gap-1"
                        >
                            <Plus size={14}/> Manuel
                        </button>
                    </div>
                </div>

                {/* TRANSFER TO DIRECTOR FORM */}
                {showTransferDirector && (
                    <form onSubmit={handleTransferDirector} className="p-4 bg-gray-100 border-b border-gray-300 animate-fade-in">
                        <div className="flex items-end gap-4 max-w-lg mx-auto">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Montant à verser (MAD)</label>
                                <input 
                                    type="number" 
                                    required 
                                    max={totalCash}
                                    className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-gray-500 outline-none"
                                    value={transferAmount}
                                    onChange={e => setTransferAmount(e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                            <button className="bg-gray-900 text-white px-6 py-2 rounded font-bold hover:bg-black transition-colors">
                                Valider Transfert
                            </button>
                        </div>
                        <p className="text-center text-xs text-gray-500 mt-2">
                            Cela créera une sortie de la Caisse Usine et une entrée dans la Caisse Directeur.
                        </p>
                    </form>
                )}

                {/* TRANSFER TO BANK FORM */}
                {showTransferBank && (
                    <form onSubmit={handleTransferBank} className="p-4 bg-indigo-50 border-b border-indigo-200 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto items-end">
                            <div>
                                <label className="block text-xs font-bold text-indigo-800 mb-1 uppercase">Compte Bancaire de destination</label>
                                <select 
                                    required
                                    className="w-full border border-indigo-300 rounded p-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                    value={selectedTransferBankId}
                                    onChange={e => setSelectedTransferBankId(e.target.value)}
                                >
                                    <option value="">Sélectionner un compte...</option>
                                    {bankAccounts.filter(b => b.currency === Currency.MAD).map(b => (
                                        <option key={b.id} value={b.id}>{b.bankName} - {b.accountNumber}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-indigo-800 mb-1 uppercase">Montant (MAD)</label>
                                    <input 
                                        type="number" 
                                        required 
                                        max={totalCash}
                                        className="w-full border border-indigo-300 rounded p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={transferBankAmount}
                                        onChange={e => setTransferBankAmount(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                                <button className="bg-indigo-700 text-white px-4 py-2 rounded font-bold hover:bg-indigo-800 transition-colors h-[42px]">
                                    Valider
                                </button>
                            </div>
                        </div>
                        <p className="text-center text-xs text-indigo-600 mt-2 flex items-center justify-center gap-1">
                            <Landmark size={12}/>
                            L'argent sortira physiquement de la caisse pour être crédité sur le solde bancaire.
                        </p>
                    </form>
                )}

                {/* MANUAL CASH FORM */}
                {showCashForm && (
                    <form onSubmit={handleCashSubmit} className="p-4 bg-green-50 border-b grid grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="block text-xs font-bold mb-1">Type</label>
                            <select 
                                className="w-full border rounded p-2"
                                value={newCash.type}
                                onChange={(e) => setNewCash({...newCash, type: e.target.value as any})}
                            >
                            <option value="IN">Entrée (+)</option>
                            <option value="OUT">Sortie (-)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1">Montant</label>
                            <input type="number" required className="w-full border rounded p-2" value={newCash.amount} onChange={e=>setNewCash({...newCash, amount: e.target.value})}/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1">Motif</label>
                            <input type="text" required className="w-full border rounded p-2" value={newCash.description} onChange={e=>setNewCash({...newCash, description: e.target.value})}/>
                        </div>
                        <button className="bg-green-600 text-white p-2 rounded hover:bg-green-700">Valider</button>
                    </form>
                )}

                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500">
                    <tr>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Type</th>
                        <th className="px-6 py-3">Description</th>
                        <th className="px-6 py-3 text-right">Entrée</th>
                        <th className="px-6 py-3 text-right">Sortie</th>
                        <th className="px-6 py-3 w-10"></th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                    {/* Combine transactions and expenses for the view */}
                    {[
                        ...transactions.filter(t => t.paymentMethod === PaymentMethod.ESPECE).map(t => ({
                        id: t.id,
                        date: t.date,
                        type: t.type === TransactionType.VENTE ? 'Recette Vente' : 'Paiement Achat',
                        description: `${t.productType} - ${t.partnerName}`,
                        in: t.type === TransactionType.VENTE ? t.amountPaid : 0,
                        out: t.type === TransactionType.ACHAT ? t.amountPaid : 0,
                        isExpense: false
                        })),
                        ...expenses.filter(e => e.paymentMethod === PaymentMethod.ESPECE).map(e => ({
                        id: e.id,
                        date: e.date,
                        type: e.category === 'Transfert' ? 'Transfert/Versement' : (e.category === 'Autre' && e.description.includes('Manuel') ? 'Opération Manuelle' : 'Dépense'),
                        description: `${e.category} - ${e.description}`,
                        in: e.amount < 0 ? Math.abs(e.amount) : 0, // Negative expense = Cash In (Hack for manual in)
                        out: e.amount > 0 ? e.amount : 0,
                        isExpense: true
                        }))
                    ].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 group">
                        <td className="px-6 py-4 text-gray-600">{new Date(item.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 font-medium">{item.type}</td>
                        <td className="px-6 py-4 text-gray-500">{item.description}</td>
                        <td className="px-6 py-4 text-right font-medium text-green-600">{item.in ? `+${item.in}` : '-'}</td>
                        <td className="px-6 py-4 text-right font-medium text-red-600">{item.out ? `-${item.out}` : '-'}</td>
                        <td className="px-6 py-4">
                            {canDelete && (
                                <button 
                                onClick={() => item.isExpense ? onDeleteExpense(item.id) : onDeleteTransaction(item.id)}
                                className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" title="Supprimer">
                                <Trash2 size={16} />
                                </button>
                            )}
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* CHECKS MANAGEMENT */}
      {activeSubTab === 'checks' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-700">Portefeuille Chèques</h3>
            <button 
                 onClick={() => setShowCheckForm(!showCheckForm)}
                 className="bg-gray-800 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 flex items-center gap-1"
               >
                 <Plus size={14}/> Ajouter Chèque
            </button>
          </div>

          {showCheckForm && (
             <form onSubmit={handleCheckSubmit} className="p-4 bg-gray-50 border-b grid grid-cols-1 md:grid-cols-3 gap-4">
                <input type="text" placeholder="Numéro" className="border p-2 rounded" required value={newCheck.number} onChange={e => setNewCheck({...newCheck, number: e.target.value})} />
                <input type="text" placeholder="Banque" className="border p-2 rounded" required value={newCheck.bank} onChange={e => setNewCheck({...newCheck, bank: e.target.value})} />
                <input type="number" placeholder="Montant" className="border p-2 rounded" required value={newCheck.amount} onChange={e => setNewCheck({...newCheck, amount: Number(e.target.value)})} />
                <input type="text" placeholder="Partenaire" className="border p-2 rounded" required value={newCheck.partnerName} onChange={e => setNewCheck({...newCheck, partnerName: e.target.value})} />
                <input type="date" placeholder="Échéance" className="border p-2 rounded" required value={newCheck.dueDate} onChange={e => setNewCheck({...newCheck, dueDate: e.target.value})} />
                <select className="border p-2 rounded" value={newCheck.direction} onChange={e => setNewCheck({...newCheck, direction: e.target.value as any})}>
                  <option value="Recu">Reçu (Client)</option>
                  <option value="Emis">Émis (Fournisseur)</option>
                </select>
                <div className="col-span-full flex justify-end">
                   <button className="bg-olive-600 text-white px-6 py-2 rounded">Enregistrer Chèque</button>
                </div>
             </form>
          )}

          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-6 py-3">Échéance</th>
                <th className="px-6 py-3">N° Chèque</th>
                <th className="px-6 py-3">Banque</th>
                <th className="px-6 py-3">Partenaire</th>
                <th className="px-6 py-3">Montant</th>
                <th className="px-6 py-3">Statut</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {checks.map(check => {
                // Alert logic: Due in less than 24h (86400000ms) and not processed
                const timeLeft = new Date(check.dueDate).getTime() - Date.now();
                const isUrgent = timeLeft < 86400000 && timeLeft > -86400000 && check.status === 'En Coffre'; // +/- 24h window for alert

                return (
                  <tr key={check.id} className={`hover:bg-gray-50 ${isUrgent ? 'bg-red-50' : ''}`}>
                    <td className="px-6 py-4 font-medium flex items-center gap-2">
                      {isUrgent && <Clock size={16} className="text-red-600 animate-pulse" />}
                      <span className={isUrgent ? 'text-red-700 font-bold' : 'text-gray-600'}>
                         {new Date(check.dueDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-600">{check.number}</td>
                    <td className="px-6 py-4 text-gray-600">{check.bank}</td>
                    <td className="px-6 py-4">
                       {check.partnerName} 
                       <span className={`ml-2 text-[10px] px-1 rounded border ${check.direction === 'Recu' ? 'border-green-300 text-green-700' : 'border-red-300 text-red-700'}`}>{check.direction}</span>
                    </td>
                    <td className="px-6 py-4 font-bold">{check.amount.toLocaleString()} MAD</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        check.status === 'En Coffre' ? 'bg-blue-100 text-blue-700' :
                        check.status === 'Encaissé' ? 'bg-green-100 text-green-700' :
                        check.status === 'Rejeté' ? 'bg-red-100 text-red-700' : 'bg-gray-100'
                      }`}>
                        {check.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                        {canDelete && (
                            <button onClick={() => onDeleteCheck(check.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={16} /></button>
                        )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* DEBTS & RECEIVABLES & EXPENSES ... (Keeping structure identical for brevity as only types/props changed in those sections effectively) */}
      {/* ... keeping the rest of the tabs same ... */}
       {activeSubTab === 'debts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="p-4 border-b border-red-100 bg-red-50">
               <h3 className="font-bold text-red-800 flex items-center gap-2">
                 <TrendingDown size={18} /> Dettes Fournisseurs (À Payer)
               </h3>
             </div>
             <table className="w-full text-sm">
               <tbody className="divide-y divide-gray-100">
                 {transactions
                    .filter(t => t.type === TransactionType.ACHAT && t.paymentStatus !== PaymentStatus.PAYE)
                    .map(t => {
                      const debt = t.priceTotal - (t.amountPaid || 0);
                      return (
                        <tr key={t.id} className="hover:bg-red-50/30">
                          <td className="px-4 py-3 text-gray-600">{new Date(t.date).toLocaleDateString()}</td>
                          <td className="px-4 py-3 font-medium">{t.partnerName}</td>
                          <td className="px-4 py-3 text-right font-bold text-red-600">{debt.toLocaleString()} MAD</td>
                        </tr>
                      );
                    })}
               </tbody>
             </table>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="p-4 border-b border-orange-100 bg-orange-50">
               <h3 className="font-bold text-orange-800 flex items-center gap-2">
                 <AlertCircle size={18} /> Créances Clients (À Recevoir)
               </h3>
             </div>
             <table className="w-full text-sm">
               <tbody className="divide-y divide-gray-100">
                 {transactions
                    .filter(t => t.type === TransactionType.VENTE && t.paymentStatus !== PaymentStatus.PAYE)
                    .map(t => {
                      const credit = t.priceTotal - (t.amountPaid || 0);
                      return (
                        <tr key={t.id} className="hover:bg-orange-50/30">
                          <td className="px-4 py-3 text-gray-600">{new Date(t.date).toLocaleDateString()}</td>
                          <td className="px-4 py-3 font-medium">{t.partnerName}</td>
                          <td className="px-4 py-3 text-right font-bold text-orange-600">{credit.toLocaleString()} MAD</td>
                        </tr>
                      );
                    })}
               </tbody>
             </table>
          </div>
        </div>
      )}

      {/* EXPENSES */}
      {activeSubTab === 'expenses' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-800">Journal des Dépenses</h3>
            <div className="flex gap-2">
                <button 
                  onClick={generateExpensesPDF}
                  className="bg-red-100 text-red-700 px-3 py-1 rounded-lg text-sm hover:bg-red-200 flex items-center gap-1"
                >
                  <Download size={16}/> PDF
                </button>
                <button 
                  onClick={() => setShowExpenseForm(!showExpenseForm)}
                  className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700"
                >
                  <Plus size={16} /> Ajouter Dépense
                </button>
            </div>
          </div>

          {showExpenseForm && (
            <form onSubmit={handleExpenseSubmit} className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
               <div className="md:col-span-2">
                 <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                 <input 
                    type="text" 
                    required 
                    className="w-full p-2 border rounded" 
                    value={newExpense.description}
                    onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                 />
               </div>
               <div>
                 <label className="block text-xs font-medium text-gray-600 mb-1">Catégorie</label>
                 <select 
                    className="w-full p-2 border rounded"
                    value={newExpense.category}
                    onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                 >
                   <option>Electricité</option>
                   <option>Carburant</option>
                   <option>Maintenance</option>
                   <option>Salaires</option>
                   <option>Autre</option>
                 </select>
               </div>
               <div>
                 <label className="block text-xs font-medium text-gray-600 mb-1">Paiement</label>
                 <select 
                    className="w-full p-2 border rounded"
                    value={newExpense.paymentMethod}
                    onChange={e => setNewExpense({...newExpense, paymentMethod: e.target.value as PaymentMethod})}
                 >
                   <option value={PaymentMethod.ESPECE}>Espèce (Usine)</option>
                   <option value={PaymentMethod.CAISSE_DIRECTEUR}>Caisse Directeur</option>
                   <option value={PaymentMethod.CHEQUE}>Chèque</option>
                   <option value={PaymentMethod.VIREMENT}>Virement</option>
                 </select>
               </div>
               <div>
                 <label className="block text-xs font-medium text-gray-600 mb-1">Montant (MAD)</label>
                 <input 
                    type="number" 
                    required 
                    className="w-full p-2 border rounded" 
                    value={newExpense.amount}
                    onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
                 />
               </div>
               <button type="submit" className="bg-olive-600 text-white p-2 rounded hover:bg-olive-700 md:col-span-5 w-full flex justify-center items-center gap-2">
                   <Plus size={16}/> Enregistrer la Dépense
               </button>
            </form>
          )}

          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Catégorie</th>
                <th className="px-4 py-2">Description</th>
                <th className="px-4 py-2">Paiement</th>
                <th className="px-4 py-2 text-right">Montant</th>
                <th className="px-4 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expenses.filter(e => e.amount > 0).map(e => (
                <tr key={e.id} className="hover:bg-gray-50 group">
                  <td className="px-4 py-3 text-gray-600">{new Date(e.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">{e.category}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-800">{e.description}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                      {e.paymentMethod === PaymentMethod.CAISSE_DIRECTEUR ? 
                        <span className="text-yellow-600 font-bold flex items-center gap-1"><Briefcase size={12}/> Directeur</span> : 
                        e.paymentMethod
                      }
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{e.amount.toLocaleString()} MAD</td>
                  <td className="px-4 py-3">
                    {canDelete && (
                        <button 
                        onClick={() => onDeleteExpense(e.id)}
                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" title="Supprimer">
                        <Trash2 size={16} />
                        </button>
                    )}
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-gray-400">Aucune dépense enregistrée</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Accounting;
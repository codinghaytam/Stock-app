import React, { useState, useMemo } from 'react';
import { Employee, AttendanceRecord, PaymentMethod, SalaryPayment, BankAccount } from '../types.ts';
import { User, Calendar, Clock, Banknote, Plus, Trash2, CheckCircle, XCircle, ChevronLeft, ChevronRight, Sunrise, Sunset, HandCoins, CreditCard, AlertTriangle, History } from 'lucide-react';

interface TimekeepingProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  salaryPayments?: SalaryPayment[]; // New prop
  bankAccounts?: BankAccount[]; // New prop
  onAddEmployee: (emp: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  onUpdateAttendance: (record: AttendanceRecord) => void;
  onAddExpense: (expense: any) => void;
  onPaySalary?: (employeeId: string, periodStart: string, amount: number, method: PaymentMethod | 'Impayé', bankAccountId?: string) => void;
  onDeletePayment?: (id: string) => void;
}

const Timekeeping: React.FC<TimekeepingProps> = ({ 
  employees, attendance, salaryPayments = [], bankAccounts = [],
  onAddEmployee, onDeleteEmployee, onUpdateAttendance, onAddExpense, onPaySalary, onDeletePayment
}) => {
  const [view, setView] = useState<'weekly' | 'employees'>('weekly');
  
  // State for Week Navigation (Store the Monday of the current week)
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0];
  });

  // New Employee Form
  const [showAddEmp, setShowAddEmp] = useState(false);
  const [newEmp, setNewEmp] = useState<Partial<Employee>>({ name: '', role: 'Ouvrier', baseSalary: 100 });

  // Payment Modal State
  const [paymentModal, setPaymentModal] = useState<{employeeId: string, amount: number} | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | 'Impayé'>('Espèce' as any);
  const [selectedBankId, setSelectedBankId] = useState('');

  // --- HELPERS ---

  const getWeekDays = () => {
    const days = [];
    const start = new Date(currentWeekStart);
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  };

  const weekDays = getWeekDays();

  const changeWeek = (offset: number) => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + (offset * 7));
    setCurrentWeekStart(d.toISOString().split('T')[0]);
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if(newEmp.name) {
      onAddEmployee({
        id: `EMP${Date.now()}`,
        name: newEmp.name,
        role: newEmp.role as any,
        baseSalary: Number(newEmp.baseSalary)
      });
      setShowAddEmp(false);
      setNewEmp({ name: '', role: 'Ouvrier', baseSalary: 100 });
    }
  };

  const toggleAttendance = (empId: string, date: string, type: 'status' | 'overtime' | 'advance', value?: any) => {
    const existing = attendance.find(a => a.date === date && a.employeeId === empId);
    
    let updatedRecord: AttendanceRecord;

    if (existing) {
       updatedRecord = { ...existing };
       if (type === 'status') {
         // Cycle: Présent -> Matin (1/2) -> Après-midi (1/2) -> Absent -> Congé -> Présent
         if (existing.status === 'Présent') updatedRecord.status = 'Matin';
         else if (existing.status === 'Matin') updatedRecord.status = 'Après-midi';
         else if (existing.status === 'Après-midi') updatedRecord.status = 'Absent';
         else if (existing.status === 'Absent') updatedRecord.status = 'Congé';
         else updatedRecord.status = 'Présent';
       } else if (type === 'overtime') {
         updatedRecord.hoursOvertime = value;
       } else if (type === 'advance') {
         updatedRecord.advanceAmount = value;
       }
    } else {
      updatedRecord = {
        id: `ATT${Date.now()}-${empId}`,
        date: date,
        employeeId: empId,
        status: 'Présent', // Default to present when clicking for first time
        hoursNormal: 8,
        hoursOvertime: 0,
        advanceAmount: type === 'advance' ? value : 0
      };
      if (type === 'status' && !existing) updatedRecord.status = 'Présent';
    }
    onUpdateAttendance(updatedRecord);
  };

  const handleAdvanceInput = (emp: Employee, date: string, amount: number) => {
     toggleAttendance(emp.id, date, 'advance', amount);
  };

  const confirmAdvanceExpense = (emp: Employee, date: string, amount: number) => {
    if (amount > 0) {
      const confirm = window.confirm(`Confirmer l'avance de ${amount} DH pour ${emp.name} ?\nCela sera DÉDUIT automatiquement de la caisse espèces.`);
      if (confirm) {
        onAddExpense({
          date: new Date().toISOString(),
          category: 'Salaires',
          description: `Avance sur salaire - ${emp.name} (${new Date(date).toLocaleDateString()})`,
          amount: amount,
          paymentMethod: PaymentMethod.ESPECE
        });
        alert('Avance enregistrée et déduite de la caisse.');
      }
    }
  };

  const handleManualAdvance = (emp: Employee) => {
      const amountStr = prompt(`Entrez le montant de l'avance pour ${emp.name} (DH):`);
      if (amountStr) {
          const amount = parseFloat(amountStr);
          if (amount > 0) {
              onAddExpense({
                  date: new Date().toISOString(),
                  category: 'Salaires',
                  description: `Avance (Mensuel) - ${emp.name}`,
                  amount: amount,
                  paymentMethod: PaymentMethod.ESPECE
              });
              alert(`Avance de ${amount} DH enregistrée et déduite de la caisse.`);
          }
      }
  };

  // Calculate Weekly Salary for Workers
  const calculateWeeklyTotal = (emp: Employee) => {
    if (emp.role === 'Employé') return null; // Monthly paid

    let earned = 0;
    let advances = 0;

    weekDays.forEach(date => {
      const record = attendance.find(a => a.date === date && a.employeeId === emp.id);
      if (record) {
        if (record.status === 'Présent') {
          earned += emp.baseSalary; // e.g. 100 DH
        } else if (record.status === 'Matin' || record.status === 'Après-midi') {
          earned += (emp.baseSalary / 2); // e.g. 50 DH
        }
        // Overtime is added on top
        earned += (record.hoursOvertime || 0) * 12; // 12 DH/h
        
        // Advances deducted
        advances += (record.advanceAmount || 0);
      }
    });
    return { earned, advances, net: earned - advances };
  };

  const confirmSalaryPayment = () => {
      if(paymentModal && onPaySalary) {
          if(paymentMethod === PaymentMethod.VIREMENT && !selectedBankId) {
              alert("Veuillez sélectionner un compte bancaire.");
              return;
          }
          onPaySalary(paymentModal.employeeId, currentWeekStart, paymentModal.amount, paymentMethod, selectedBankId);
          setPaymentModal(null);
          setPaymentMethod('Espèce' as any);
          setSelectedBankId('');
      }
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      
      {/* Payment Modal */}
      {paymentModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
                  <div className="bg-olive-700 text-white p-4">
                      <h3 className="font-bold text-lg">Paiement Salaire</h3>
                      <p className="text-olive-200 text-sm">Semaine du {new Date(currentWeekStart).toLocaleDateString()}</p>
                  </div>
                  <div className="p-6 space-y-4">
                      <div className="flex justify-between items-center bg-gray-50 p-3 rounded">
                          <span className="text-gray-600">Montant Net</span>
                          <span className="font-bold text-xl text-gray-800">{paymentModal.amount.toLocaleString()} DH</span>
                      </div>
                      
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">Mode de Paiement</label>
                          <div className="grid grid-cols-3 gap-2">
                              <button 
                                onClick={() => setPaymentMethod(PaymentMethod.ESPECE)}
                                className={`p-2 rounded border text-sm flex flex-col items-center gap-1 ${paymentMethod === PaymentMethod.ESPECE ? 'bg-olive-50 border-olive-500 text-olive-700' : 'bg-white'}`}
                              >
                                  <Banknote size={16}/> Espèce
                              </button>
                              <button 
                                onClick={() => setPaymentMethod(PaymentMethod.VIREMENT)}
                                className={`p-2 rounded border text-sm flex flex-col items-center gap-1 ${paymentMethod === PaymentMethod.VIREMENT ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white'}`}
                              >
                                  <CreditCard size={16}/> Virement
                              </button>
                              <button 
                                onClick={() => setPaymentMethod('Impayé')}
                                className={`p-2 rounded border text-sm flex flex-col items-center gap-1 ${paymentMethod === 'Impayé' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white'}`}
                              >
                                  <AlertTriangle size={16}/> Impayé
                              </button>
                          </div>
                      </div>

                      {paymentMethod === PaymentMethod.VIREMENT && (
                          <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1">Compte Bancaire</label>
                              <select 
                                className="w-full border rounded p-2 text-sm"
                                value={selectedBankId}
                                onChange={e => setSelectedBankId(e.target.value)}
                              >
                                  <option value="">Choisir banque...</option>
                                  {bankAccounts.map(b => (
                                      <option key={b.id} value={b.id}>{b.bankName} ({b.currency})</option>
                                  ))}
                              </select>
                          </div>
                      )}

                      <div className="flex gap-2 pt-2">
                          <button onClick={() => setPaymentModal(null)} className="flex-1 py-2 text-gray-500 hover:bg-gray-100 rounded">Annuler</button>
                          <button onClick={confirmSalaryPayment} className="flex-1 py-2 bg-olive-600 text-white rounded font-bold hover:bg-olive-700">Confirmer</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <div className="flex justify-between items-center">
         <div>
           <h2 className="text-2xl font-bold text-gray-800">Pointage & RH</h2>
           <p className="text-gray-500">Suivi hebdomadaire, avances et salaires</p>
         </div>
         <div className="bg-white p-1 rounded-lg border flex shadow-sm">
            <button 
              onClick={() => setView('weekly')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${view === 'weekly' ? 'bg-olive-100 text-olive-800 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <Calendar size={18} /> Pointage Semaine
            </button>
            <button 
              onClick={() => setView('employees')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${view === 'employees' ? 'bg-olive-100 text-olive-800 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <User size={18} /> Effectif & Avances
            </button>
         </div>
      </div>

      {view === 'weekly' && (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Week Navigation */}
            <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                <button onClick={() => changeWeek(-1)} className="p-2 hover:bg-gray-200 rounded-full"><ChevronLeft size={20}/></button>
                <span className="font-bold text-lg text-gray-700 capitalize">
                    Semaine du {new Date(currentWeekStart).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <button onClick={() => changeWeek(1)} className="p-2 hover:bg-gray-200 rounded-full"><ChevronRight size={20}/></button>
                </div>
                
                {/* Legend */}
                <div className="flex gap-4 text-xs flex-wrap justify-end">
                    <div className="flex items-center gap-1"><span className="w-3 h-3 bg-green-100 border border-green-300 rounded-full"></span> Présent</div>
                    <div className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-100 border border-blue-300 rounded-full"></span> Matin</div>
                    <div className="flex items-center gap-1"><span className="w-3 h-3 bg-indigo-100 border border-indigo-300 rounded-full"></span> Après-midi</div>
                    <div className="flex items-center gap-1"><span className="w-3 h-3 bg-red-100 border border-red-300 rounded-full"></span> Absent</div>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                <thead className="bg-white text-gray-500 border-b">
                    <tr>
                    <th className="px-4 py-4 min-w-[150px] sticky left-0 bg-white z-10 border-r shadow-sm">Employé</th>
                    {weekDays.map((day, idx) => (
                        <th key={day} className={`px-2 py-4 text-center min-w-[90px] ${idx === 6 ? 'text-orange-600 bg-orange-50' : ''}`}>
                        <div className="flex flex-col items-center">
                            <span className="uppercase text-[10px] font-bold">{new Date(day).toLocaleDateString('fr-FR', { weekday: 'short' })}</span>
                            <span className="text-sm font-bold">{new Date(day).getDate()}</span>
                        </div>
                        </th>
                    ))}
                    <th className="px-4 py-4 text-right font-bold bg-gray-50 min-w-[120px]">Net à Payer<br/><span className="text-[10px] font-normal text-gray-400">Pour Samedi</span></th>
                    <th className="px-4 py-4 text-center font-bold bg-gray-50 w-24">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {employees.map(emp => {
                    const salaryData = calculateWeeklyTotal(emp);
                    const paymentRecord = salaryPayments.find(p => p.employeeId === emp.id && p.periodStart === currentWeekStart);

                    return (
                        <tr key={emp.id} className="hover:bg-gray-50 group">
                        <td className="px-4 py-3 sticky left-0 bg-white group-hover:bg-gray-50 z-10 border-r shadow-sm">
                            <div className="font-medium text-gray-800">{emp.name}</div>
                            <div className="text-xs text-gray-500">{emp.role}</div>
                        </td>
                        
                        {weekDays.map((day, idx) => {
                            const record = attendance.find(a => a.date === day && a.employeeId === emp.id);
                            const status = record?.status; // undefined = not set yet (default empty)
                            const overtime = record?.hoursOvertime || 0;
                            const advance = record?.advanceAmount || 0;
                            const isSunday = idx === 6;

                            return (
                            <td key={day} className={`px-1 py-2 text-center border-l border-gray-100 ${isSunday ? 'bg-orange-50/30' : ''}`}>
                                <div className="flex flex-col items-center gap-1">
                                    {/* Status Button */}
                                    <button 
                                    onClick={() => toggleAttendance(emp.id, day, 'status')}
                                    disabled={!!paymentRecord} // Disable editing if paid
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow-sm ${
                                        status === 'Présent' ? 'bg-green-100 text-green-700' :
                                        status === 'Matin' ? 'bg-blue-100 text-blue-700' :
                                        status === 'Après-midi' ? 'bg-indigo-100 text-indigo-700' :
                                        status === 'Absent' ? 'bg-red-100 text-red-700' :
                                        status === 'Congé' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-white border border-gray-200 text-gray-300 hover:bg-gray-100'
                                    }`}
                                    title={status || 'Non pointé'}
                                    >
                                    {status === 'Présent' && <CheckCircle size={16} />}
                                    {status === 'Matin' && <Sunrise size={16} />}
                                    {status === 'Après-midi' && <Sunset size={16} />}
                                    {status === 'Absent' && <XCircle size={16} />}
                                    {status === 'Congé' && <span className="text-xs font-bold">C</span>}
                                    {!status && <span className="text-xs">.</span>}
                                    </button>
                                    
                                    {(emp.role === 'Ouvrier' && status && status !== 'Absent') && (
                                    <>
                                        {/* Overtime Input */}
                                        <div className="relative w-10">
                                        <input 
                                            type="number" 
                                            min="0" max="10"
                                            disabled={!!paymentRecord}
                                            className="w-full text-center text-xs border border-gray-200 rounded bg-white focus:border-olive-500 outline-none h-6"
                                            value={overtime === 0 ? '' : overtime}
                                            onChange={(e) => toggleAttendance(emp.id, day, 'overtime', Number(e.target.value))}
                                            placeholder="+h"
                                        />
                                        </div>

                                        {/* Advance Input (Money) - AVEC CASE NOMMEE AVANCE */}
                                        <div className="relative w-12 group/advance">
                                        <input 
                                            type="number"
                                            min="0"
                                            disabled={!!paymentRecord}
                                            className={`w-full text-center text-[10px] border rounded outline-none h-5 transition-colors ${
                                                advance > 0 ? 'bg-red-50 border-red-300 text-red-700 font-bold' : 'bg-gray-50 border-gray-100 text-gray-400 placeholder-gray-300'
                                            }`}
                                            value={advance === 0 ? '' : advance}
                                            onChange={(e) => handleAdvanceInput(emp, day, Number(e.target.value))}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    confirmAdvanceExpense(emp, day, advance);
                                                    (e.target as HTMLInputElement).blur();
                                                }
                                            }}
                                            placeholder="AVANCE"
                                            title="Saisir montant Avance puis ENTRÉE pour déduire de la caisse"
                                        />
                                        </div>
                                    </>
                                    )}
                                </div>
                            </td>
                            );
                        })}

                        <td className="px-4 py-3 text-right bg-gray-50 border-l">
                            {emp.role === 'Ouvrier' && salaryData ? (
                            <div className="flex flex-col items-end">
                                <span className={`font-bold text-lg ${salaryData.net < 0 ? 'text-red-600' : 'text-olive-700'}`}>
                                {salaryData.net.toLocaleString()} DH
                                </span>
                                {salaryData.advances > 0 && (
                                <span className="text-[10px] text-red-500 bg-red-50 px-1 rounded">
                                    -{salaryData.advances} DH (Avances)
                                </span>
                                )}
                            </div>
                            ) : (
                            <span className="text-xs text-gray-400 italic">Mensuel</span>
                            )}
                        </td>

                        {/* ACTION COLUMN FOR PAYMENT */}
                        <td className="px-2 py-3 text-center border-l bg-gray-50">
                            {paymentRecord ? (
                                <div className="flex flex-col items-center">
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                                        paymentRecord.method === 'Impayé' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                    }`}>
                                        {paymentRecord.method}
                                    </span>
                                    {paymentRecord.method === 'Impayé' && (
                                        <span className="text-[10px] text-gray-400">En attente</span>
                                    )}
                                </div>
                            ) : (
                                emp.role === 'Ouvrier' && salaryData && salaryData.net > 0 && (
                                    <button 
                                        onClick={() => setPaymentModal({employeeId: emp.id, amount: salaryData.net})}
                                        className="bg-blue-600 text-white p-2 rounded-lg shadow hover:bg-blue-700 text-xs font-bold"
                                    >
                                        Payer
                                    </button>
                                )
                            )}
                        </td>
                        </tr>
                    );
                    })}
                    {employees.length === 0 && (
                    <tr><td colSpan={10} className="p-8 text-center text-gray-400">Aucun employé. Ajoutez-en dans l'onglet "Effectif".</td></tr>
                    )}
                </tbody>
                </table>
            </div>
            <div className="p-2 bg-yellow-50 text-yellow-800 text-xs text-center border-t border-yellow-100 flex justify-center items-center gap-2">
                <HandCoins size={14}/>
                <span>Les avances saisies sont déduites automatiquement de la caisse espèces après validation. Le paiement final du salaire peut être fait par Espèce, Virement ou noté Impayé.</span>
            </div>
            </div>

            {/* HISTORIQUE PAIEMENTS */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
                    <History size={18} className="text-gray-500"/>
                    <h3 className="font-bold text-gray-700">Historique des Paiements Salaires (Semaine en cours)</h3>
                </div>
                <div className="p-0">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 border-b">
                            <tr>
                                <th className="px-6 py-3">Employé</th>
                                <th className="px-6 py-3">Date Paiement</th>
                                <th className="px-6 py-3">Méthode</th>
                                <th className="px-6 py-3 text-right">Montant</th>
                                <th className="px-6 py-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {salaryPayments
                                .filter(p => p.periodStart === currentWeekStart)
                                .map(payment => {
                                    const emp = employees.find(e => e.id === payment.employeeId);
                                    return (
                                        <tr key={payment.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-3 font-medium">{emp?.name || 'Inconnu'}</td>
                                            <td className="px-6 py-3 text-gray-500">{new Date(payment.date).toLocaleDateString()}</td>
                                            <td className="px-6 py-3">
                                                <span className={`px-2 py-1 rounded text-xs border ${
                                                    payment.method === 'Impayé' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'
                                                }`}>
                                                    {payment.method}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-right font-bold">{payment.amount.toLocaleString()} MAD</td>
                                            <td className="px-6 py-3">
                                                {onDeletePayment && (
                                                    <button 
                                                        onClick={() => onDeletePayment(payment.id)}
                                                        className="text-gray-300 hover:text-red-500 transition-colors"
                                                        title="Supprimer paiement"
                                                    >
                                                        <Trash2 size={16}/>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            {salaryPayments.filter(p => p.periodStart === currentWeekStart).length === 0 && (
                                <tr><td colSpan={5} className="p-6 text-center text-gray-400 italic">Aucun paiement effectué cette semaine.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {view === 'employees' && (
        <div className="space-y-6">
           <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-end gap-4">
              <div className="flex-1">
                 <label className="block text-sm font-medium mb-1">Nom Complet</label>
                 <input className="w-full border rounded p-2" value={newEmp.name} onChange={e => setNewEmp({...newEmp, name: e.target.value})} placeholder="Ex: Ahmed Benali" />
              </div>
              <div className="w-40">
                 <label className="block text-sm font-medium mb-1">Rôle</label>
                 <select className="w-full border rounded p-2 bg-white" value={newEmp.role} onChange={e => setNewEmp({...newEmp, role: e.target.value as any})}>
                   <option value="Ouvrier">Ouvrier</option>
                   <option value="Employé">Employé</option>
                 </select>
              </div>
              <div className="w-40">
                 <label className="block text-sm font-medium mb-1">{newEmp.role === 'Ouvrier' ? 'Salaire / Jour' : 'Salaire / Mois'}</label>
                 <input type="number" className="w-full border rounded p-2" value={newEmp.baseSalary} onChange={e => setNewEmp({...newEmp, baseSalary: Number(e.target.value)})} />
              </div>
              <button onClick={handleAddEmployee} className="bg-olive-600 text-white px-4 py-2 rounded font-medium hover:bg-olive-700 h-[42px]">Ajouter</button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {employees.map(emp => (
               <div key={emp.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative group">
                  <div className="flex justify-between items-start mb-4">
                     <div className="bg-gray-100 p-3 rounded-full"><User size={24} className="text-gray-600" /></div>
                     <button onClick={() => onDeleteEmployee(emp.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={18} /></button>
                  </div>
                  <h3 className="font-bold text-lg text-gray-800">{emp.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">{emp.role}</p>
                  
                  <div className="space-y-2 border-t pt-4">
                     <div className="flex justify-between text-sm">
                       <span className="text-gray-500">Base Salaire</span>
                       <span className="font-mono">{emp.baseSalary} DH {emp.role === 'Ouvrier' ? '/j' : '/m'}</span>
                     </div>
                     <div className="flex justify-between text-sm">
                       <span className="text-gray-500">Heures Supp (Ouvrier)</span>
                       <span className="font-mono">12 DH/h</span>
                     </div>
                     
                     <button 
                       onClick={() => handleManualAdvance(emp)}
                       className="w-full mt-4 bg-red-50 text-red-700 border border-red-200 py-2 rounded-lg text-sm font-bold hover:bg-red-100 flex items-center justify-center gap-2"
                     >
                        <HandCoins size={16}/> Donner Avance (Caisse)
                     </button>
                  </div>
               </div>
             ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default Timekeeping;
import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import Sidebar from '@/components/Sidebar.tsx';
import Dashboard from '@/components/Dashboard.tsx';
import StockManager from '@/components/StockManager.tsx';
import VehicleManager from '@/components/VehicleManager.tsx';
import TransactionForm from '@/components/TransactionForm.tsx';
import TransactionManager from '@/components/TransactionManager.tsx';
import ProductionManager from '@/components/ProductionManager.tsx';
import Accounting from '@/components/Accounting.tsx';
import Timekeeping from '@/components/Timekeeping.tsx';
import SellerDashboard from '@/components/SellerDashboard.tsx';
import SellersTracker from '@/components/SellersTracker.tsx';
import ActivityHistory from '@/components/ActivityHistory.tsx';
import FuelManager from '@/components/FuelManager.tsx';
import AdminPanel from '@/components/AdminPanel.tsx';
import EmailManager from '@/components/EmailManager.tsx';
import InvoiceManager from '@/components/InvoiceManager.tsx';
import ContractManager from '@/components/ContractManager.tsx';
import {
  AttendanceRecord,
  BankAccount,
  Check,
  Currency,
  EmailAccount,
  EmailMessage,
  Employee,
  Expense,
  FuelLog,
  LogEntry,
  PaymentMethod,
  PaymentStatus,
  ProductType,
  SalaryPayment,
  StockItem,
  Tank,
  Transaction,
  TransactionType,
  Vehicle
} from './types.ts';
import { Plus } from 'lucide-react';
import { websocketService } from './services/websocketService.ts';
import { api, clearAuthSession, loadAuthSession } from './services/apiClient.ts';
import { config } from './services/config.ts';
import BackendError from './components/BackendError.tsx';

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

export default function App() {
  const navigate = useNavigate();
  const [backendDown, setBackendDown] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'seller'>('admin');
  const [currentUsername, setCurrentUsername] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [sellerVehicleId, setSellerVehicleId] = useState('');
  const [authReady, setAuthReady] = useState(false);

  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', []);
  const [tanks, setTanks] = useLocalStorage<Tank[]>('tanks', []);
  const [stock, setStock] = useLocalStorage<StockItem[]>('stock', []);
  const [vehicles, setVehicles] = useLocalStorage<Vehicle[]>('vehicles', []);
  const [checks, setChecks] = useLocalStorage<Check[]>('checks', []);
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', []);
  const [employees, setEmployees] = useLocalStorage<Employee[]>('employees', []);
  const [attendance, setAttendance] = useLocalStorage<AttendanceRecord[]>('attendance', []);
  const [salaryPayments, setSalaryPayments] = useLocalStorage<SalaryPayment[]>('salary_payments', []);
  const [bankAccounts, setBankAccounts] = useLocalStorage<BankAccount[]>('bankAccounts', []);
  const [blockedUsers, setBlockedUsers] = useLocalStorage<string[]>('blocked_users', []);
  const [fuelStock, setFuelStock] = useLocalStorage('fuel_stock', 0);
  const [fuelLogs, setFuelLogs] = useLocalStorage<FuelLog[]>('fuel_logs', []);
  const [activityLogs, setActivityLogs] = useLocalStorage<LogEntry[]>('activity_logs', []);
  const [emailAccounts, setEmailAccounts] = useLocalStorage<EmailAccount[]>('email_accounts', config.getDefaultEmailAccounts());
  const [emails, setEmails] = useLocalStorage<EmailMessage[]>('emails', [
    {
      id: 'm1',
      accountId: '1',
      folder: 'inbox',
      from: 'system@app.com',
      to: 'direction@marrakech-agro.com',
      subject: 'Bienvenue sur Olive Manager',
      body: 'Le système est opérationnel.',
      date: new Date().toISOString(),
      read: false
    }
  ]);
  const [alertsOverride, setAlertsOverride] = useState<{ emails: number; accounting: number; fuel: number; stock: number } | null>(null);

  const systemAlerts = useMemo(() => {
    const unreadEmails = emails.filter(e => !e.read && e.folder === 'inbox').length;
    const urgentChecks = checks.filter(c => {
      if (c.status !== 'En Coffre') return false;
      const due = new Date(c.dueDate).getTime();
      const now = Date.now();
      const diffDays = (due - now) / (1000 * 3600 * 24);
      return diffDays <= 3;
    }).length;
    const lowFuel = fuelStock < config.fuelLowStockThreshold ? 1 : 0;
    const lowTanks = tanks.filter(t => t.currentLevel < (t.capacity * (config.tankLowLevelThresholdPercent / 100))).length;
    return { emails: unreadEmails, accounting: urgentChecks, fuel: lowFuel, stock: lowTanks };
  }, [emails, checks, fuelStock, tanks]);

  const displayedAlerts = alertsOverride ?? systemAlerts;

  useEffect(() => {
    const savedAuth = window.localStorage.getItem('auth_session');
    if (!savedAuth) return;
    try {
      const { role, username, vehicleId } = JSON.parse(savedAuth);
      const currentBlocked = JSON.parse(window.localStorage.getItem('blocked_users') || '[]');
      if (role && username && !currentBlocked.includes(username)) {
        setUserRole(role);
        setCurrentUsername(username);
        if (vehicleId) setSellerVehicleId(vehicleId);
        setIsAuthenticated(true);
      } else {
        window.localStorage.removeItem('auth_session');
      }
    } catch (e) {
      console.error('Failed to parse auth session');
      window.localStorage.removeItem('auth_session');
    }
  }, []);

  useEffect(() => {
    (async () => {
      const session = loadAuthSession();
      if (!session?.token) {
        setAuthReady(true);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        const me = res.data;
        if (me?.username) {
          setIsAuthenticated(true);
          setUserRole(me.role === 'SUPER_ADMIN' || me.role === 'ADMIN' ? 'admin' : 'seller');
          setCurrentUsername(me.username);
          if (session.vehicleId) setSellerVehicleId(session.vehicleId);
          if (session.role === 'seller') navigate('/seller', { replace: true });
          else navigate('/dashboard', { replace: true });
          websocketService.connect(session.token, 5);
          websocketService.onAlerts((payload) => {
            setAlertsOverride({
              emails: payload.unreadEmails,
              accounting: payload.urgentChecks,
              fuel: payload.lowFuel,
              stock: payload.lowTankCount
            });
          });
          websocketService.onMaxRetries(() => console.warn('WebSocket reached max retries'));
        } else {
          clearAuthSession();
        }
      } catch (e: any) {
        if (e?.response?.status === 401 || e?.response?.status === 403) clearAuthSession();
        else {
          console.error('Backend not reachable at startup', e);
          setBackendDown(true);
        }
      } finally {
        setAuthReady(true);
      }
    })();
  }, [navigate]);

  useEffect(() => {
    if (!isAuthenticated || !currentUsername) return;
    const token = window.localStorage.getItem('olivemanager_token');
    if (!token) return;
    websocketService.connect(token, 5);
  }, [isAuthenticated, currentUsername]);

  const addLog = (user: string, action: string, details: string, amount?: number) => {
    const newLog: LogEntry = {
      id: `LOG${Date.now()}-${Math.random()}`,
      date: new Date().toISOString(),
      user,
      action,
      details,
      amount
    };
    setActivityLogs(prev => [newLog, ...prev]);
  };

  const handleLogout = async () => {
    setIsAuthenticated(false);
    setSellerVehicleId('');
    setCurrentUsername('');
    setAlertsOverride(null);
    clearAuthSession();
    try {
      await api.post('/auth/logout');
    } catch {
      // client-side logout still succeeds
    }
    navigate('/login', { replace: true });
  };

  const handleDeleteTransaction = (id: string) => {
    if (!confirm('Supprimer cette transaction ?')) return;
    setTransactions(prev => prev.filter(t => t.id !== id));
    addLog(currentUsername, 'Suppression', `Transaction supprimée: ${id}`);
  };

  const handleDeleteExpense = (id: string) => {
    if (!confirm('Supprimer cette dépense ?')) return;
    setExpenses(prev => prev.filter(e => e.id !== id));
    addLog(currentUsername, 'Suppression', `Dépense supprimée: ${id}`);
  };

  const handleDeleteCheck = (id: string) => {
    if (!confirm('Supprimer ce chèque ?')) return;
    setChecks(prev => prev.filter(c => c.id !== id));
    addLog(currentUsername, 'Suppression', `Chèque supprimé: ${id}`);
  };

  const handleDeleteEmployee = (id: string) => {
    if (!confirm('Supprimer cet employé ?')) return;
    setEmployees(prev => prev.filter(e => e.id !== id));
    addLog(currentUsername, 'Suppression', `Employé supprimé: ${id}`);
  };

  const handleDeleteFuelLog = (id: string) => {
    if (!confirm('Supprimer cet historique carburant ?')) return;
    setFuelLogs(prev => prev.filter(f => f.id !== id));
    addLog(currentUsername, 'Suppression', `Log carburant supprimé: ${id}`);
  };

  const handleDeleteTank = (id: string) => {
    if (!confirm('Supprimer cette citerne ?')) return;
    setTanks(prev => prev.filter(t => t.id !== id));
    addLog(currentUsername, 'Suppression', `Citerne supprimée: ${id}`);
  };

  const handleDeleteStock = (id: string) => {
    if (!confirm('Supprimer cet élément du stock ?')) return;
    setStock(prev => prev.filter(s => s.id !== id));
    addLog(currentUsername, 'Suppression', `Stock supprimé: ${id}`);
  };

  const handleTransferOil = (fromId: string, toId: string, qty: number) => {
    setTanks(prev => {
      const fromTank = prev.find(t => t.id === fromId);
      const toTank = prev.find(t => t.id === toId);

      if (!fromTank || !toTank) return prev;
      if (fromTank.currentLevel < qty) {
        alert('Quantité source insuffisante !');
        return prev;
      }

      return prev.map(t => {
        if (t.id === fromId) {
          const newLevel = t.currentLevel - qty;
          return { ...t, currentLevel: newLevel, status: newLevel === 0 ? 'Empty' : ('Filling' as any) };
        }
        if (t.id === toId) {
          const newLevel = t.currentLevel + qty;
          const newAcidity = ((t.currentLevel * t.acidity) + (qty * fromTank.acidity)) / newLevel;
          const newWaxes = ((t.currentLevel * t.waxes) + (qty * fromTank.waxes)) / newLevel;
          const newAvgCost = ((t.currentLevel * t.avgCost) + (qty * fromTank.avgCost)) / newLevel;
          return {
            ...t,
            currentLevel: newLevel,
            acidity: Number(newAcidity.toFixed(2)),
            waxes: Math.round(newWaxes),
            avgCost: Number(newAvgCost.toFixed(2)),
            status: newLevel >= t.capacity ? 'Full' : ('Filling' as any)
          };
        }
        return t;
      });
    });
    addLog(currentUsername, 'Transfert Huile', `De ${fromId} vers ${toId} (${qty}L)`);
  };

  const handleDeleteVehicle = (id: string) => {
    if (!confirm('Supprimer ce véhicule ?')) return;
    setVehicles(prev => prev.filter(v => v.id !== id));
    addLog(currentUsername, 'Suppression', `Véhicule supprimé: ${id}`);
  };

  const handleDeleteSalaryPayment = (id: string) => {
    if (!confirm('Supprimer ce paiement de salaire ?\n(NB: Pensez à vérifier la caisse si nécessaire)')) return;
    setSalaryPayments(prev => prev.filter(p => p.id !== id));
    addLog(currentUsername, 'Suppression', `Paiement salaire annulé: ${id}`);
  };

  const handleToggleBlockUser = (targetUser: string) => {
    if (targetUser === 'mojo' || targetUser === 'boss') return;
    setBlockedUsers(prev => {
      if (prev.includes(targetUser)) {
        addLog(currentUsername, 'Admin', `Utilisateur débloqué: ${targetUser}`);
        return prev.filter(u => u !== targetUser);
      }
      addLog(currentUsername, 'Admin', `Utilisateur bloqué: ${targetUser}`);
      return [...prev, targetUser];
    });
  };

  const handleSendEmail = (fromAccountId: string, to: string, subject: string, body: string) => {
    const fromAccount = emailAccounts.find(a => a.id === fromAccountId);
    if (!fromAccount) return;

    const date = new Date().toISOString();
    const sentMsg: EmailMessage = {
      id: `MSG-${Date.now()}-sent`,
      accountId: fromAccountId,
      folder: 'sent',
      from: fromAccount.email,
      to,
      subject,
      body,
      date,
      read: true
    };

    const recipientAccount = emailAccounts.find(a => a.email.toLowerCase() === to.toLowerCase().trim());
    let inboxMsg: EmailMessage | null = null;
    if (recipientAccount) {
      inboxMsg = {
        id: `MSG-${Date.now()}-inbox`,
        accountId: recipientAccount.id,
        folder: 'inbox',
        from: fromAccount.email,
        to,
        subject,
        body,
        date,
        read: false
      };
    }

    setEmails(prev => {
      const newEmails = [...prev, sentMsg];
      if (inboxMsg) newEmails.push(inboxMsg);
      return newEmails;
    });

    addLog(currentUsername, 'Email', `Envoi de ${fromAccount.email} vers ${to}`);
  };

  const handleUpdateEmail = (updatedEmail: EmailMessage) => {
    setEmails(prev => prev.map(e => e.id === updatedEmail.id ? updatedEmail : e));
  };

  const handleDeleteEmail = (emailId: string) => {
    setEmails(prev => prev.filter(e => e.id !== emailId));
  };

  const handleAddEmailAccount = (name: string, email: string) => {
    const newAcc: EmailAccount = {
      id: `ACC-${Date.now()}`,
      name,
      email,
      color: 'bg-gray-500'
    };
    setEmailAccounts(prev => [...prev, newAcc]);
  };

  const handleAddTank = (tank: Tank) => {
    setTanks(prev => [...prev, tank]);
    addLog(currentUsername, 'Ajout Citerne', `Nouvelle citerne: ${tank.name} (${tank.capacity}L)`);
  };

  const handleAddStock = (item: StockItem) => {
    setStock(prev => {
      const exists = prev.find(s => s.name === item.name && s.type === item.type && s.brand === item.brand && s.bottleSize === item.bottleSize);
      if (exists) {
        return prev.map(s => s.id === exists.id ? { ...s, quantity: s.quantity + item.quantity } : s);
      }
      return [...prev, item];
    });
    addLog(currentUsername, 'Ajout Stock', `Ajout: ${item.name} (+${item.quantity})`);
  };

  const handleProduction = (data: any) => {
    setStock(prev => prev.map(s => {
      if (s.id === data.inputStockId) {
        return { ...s, quantity: Math.max(0, s.quantity - data.inputQuantity) };
      }
      return s;
    }));

    setTanks(prev => prev.map(t => {
      if (t.id === data.outputTankId) {
        const totalVol = t.currentLevel + data.outputOilQty;
        const newAcidity = ((t.currentLevel * t.acidity) + (data.outputOilQty * data.acidity)) / totalVol;
        const newWaxes = ((t.currentLevel * t.waxes) + (data.outputOilQty * data.waxes)) / totalVol;

        let newStatus = t.status;
        if (totalVol >= t.capacity) newStatus = 'Full';
        else if (totalVol > 0) newStatus = 'Filling';

        return {
          ...t,
          currentLevel: totalVol,
          acidity: parseFloat(newAcidity.toFixed(2)),
          waxes: Math.round(newWaxes),
          status: newStatus as any
        };
      }
      return t;
    }));

    setStock(prev => {
      let newStock = [...prev];

      const addWaste = (type: ProductType, qty: number) => {
        if (qty <= 0) return;
        const existing = newStock.find(s => s.type === type);
        if (existing) {
          newStock = newStock.map(s => s.id === existing.id ? { ...s, quantity: s.quantity + qty } : s);
        } else {
          newStock.push({
            id: `W${Date.now()}-${type}`,
            name: type,
            type,
            quantity: qty,
            unit: 'kg'
          });
        }
      };

      addWaste(ProductType.GRIGNONS, data.wasteGrignons);
      addWaste(ProductType.FITOUR, data.wasteFitour);

      return newStock;
    });

    addLog(currentUsername, 'Production', `Production Huile: ${data.outputOilQty}L (Déchets: ${data.wasteGrignons + data.wasteFitour}kg)`);
  };

  const handleLoadVehicle = (vehicleId: string, itemsToLoad: {stockItemId: string, quantity: number}[]) => {
    setStock(prevStock => {
      let newStock = [...prevStock];
      itemsToLoad.forEach(loadItem => {
        const idx = newStock.findIndex(s => s.id === loadItem.stockItemId);
        if (idx >= 0) {
          newStock[idx] = { ...newStock[idx], quantity: newStock[idx].quantity - loadItem.quantity };
        }
      });
      return newStock;
    });

    const vehicle = vehicles.find(v => v.id === vehicleId);
    setVehicles(prevVehicles => prevVehicles.map(v => {
      if (v.id !== vehicleId) return v;
      let currentMobileStock = v.mobileStock ? [...v.mobileStock] : [];
      itemsToLoad.forEach(loadItem => {
        const sourceStock = stock.find(s => s.id === loadItem.stockItemId);
        if (!sourceStock) return;
        const existingMobileItemIndex = currentMobileStock.findIndex(
          m => m.brand === sourceStock.brand && m.bottleSize === sourceStock.bottleSize
        );
        if (existingMobileItemIndex >= 0) {
          currentMobileStock[existingMobileItemIndex].quantity += loadItem.quantity;
        } else {
          currentMobileStock.push({
            stockItemId: sourceStock.id,
            name: sourceStock.name,
            brand: sourceStock.brand!,
            bottleSize: sourceStock.bottleSize!,
            quantity: loadItem.quantity
          });
        }
      });
      return { ...v, mobileStock: currentMobileStock };
    }));

    addLog(currentUsername, 'Chargement Camion', `Véhicule: ${vehicle?.plateNumber}. Articles chargés: ${itemsToLoad.length}`);
    alert('Chargement du véhicule effectué avec succès !');
  };

  const handleMobileSale = (vehicleId: string, saleData: any) => {
    const newTransactions: Transaction[] = saleData.items.map((item: any) => ({
      id: `TX-MOB-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      date: new Date().toISOString(),
      type: TransactionType.VENTE,
      productType: ProductType.HUILE_BOUTEILLE,
      quantity: item.quantity,
      unit: 'unités',
      priceTotal: item.priceTotal,
      originalAmount: item.priceTotal,
      currency: Currency.MAD,
      exchangeRate: 1,
      partnerName: saleData.clientName,
      vehicleId,
      details: `${item.brand} ${item.bottleSize}`,
      location: saleData.location,
      paymentMethod: saleData.paymentMethod,
      paymentStatus: saleData.paymentStatus,
      amountPaid: item.amountPaid
    }));

    setTransactions(prev => [...newTransactions, ...prev]);

    setVehicles(prevVehicles => prevVehicles.map(v => {
      if (v.id !== vehicleId || !v.mobileStock) return v;
      const updatedStock = v.mobileStock.map(ms => ({ ...ms }));
      saleData.items.forEach((soldItem: any) => {
        const idx = updatedStock.findIndex(s => s.brand === soldItem.brand && s.bottleSize === soldItem.bottleSize);
        if (idx >= 0) {
          updatedStock[idx].quantity = Math.max(0, updatedStock[idx].quantity - soldItem.quantity);
        }
      });
      return { ...v, mobileStock: updatedStock };
    }));

    const v = vehicles.find(x => x.id === vehicleId);
    addLog(currentUsername, 'Vente Mobile (Manuel)', `Camion ${v?.plateNumber} -> ${saleData.clientName}`);
    alert('Vente mobile enregistrée !');
  };

  const handleAddTransaction = (newTx: any) => {
    const tx: Transaction = { ...newTx, id: `TX${Date.now()}` };
    setTransactions(prev => [tx, ...prev]);
    setShowTransactionForm(false);

    if (tx.productType === ProductType.HUILE_VRAC) {
      let tankUpdates: { id: string; qty: number }[] = [];
      if (tx.tankDistributions && tx.tankDistributions.length > 0) {
        tankUpdates = tx.tankDistributions.map(d => ({ id: d.tankId, qty: d.quantity }));
      } else if (tx.tankId) {
        tankUpdates = [{ id: tx.tankId, qty: tx.quantity }];
      }

      setTanks(prev => prev.map(tank => {
        const update = tankUpdates.find(u => u.id === tank.id);
        if (!update) return tank;

        let newLevel = tank.currentLevel;
        let newAcidity = tank.acidity;
        let newWaxes = tank.waxes;
        let newAvgCost = tank.avgCost;

        if (tx.type === TransactionType.VENTE) {
          newLevel = Math.max(0, tank.currentLevel - update.qty);
        } else if (tx.type === TransactionType.ACHAT || tx.type === TransactionType.PRODUCTION) {
          newLevel = Math.min(tank.capacity, tank.currentLevel + update.qty);
          if (newLevel > 0) {
            if (tx.acidity !== undefined && tx.waxes !== undefined) {
              newAcidity = ((tank.currentLevel * tank.acidity) + (update.qty * tx.acidity)) / newLevel;
              newWaxes = ((tank.currentLevel * tank.waxes) + (update.qty * tx.waxes)) / newLevel;
            }
            const unitCost = tx.priceTotal / tx.quantity;
            newAvgCost = ((tank.currentLevel * tank.avgCost) + (update.qty * unitCost)) / newLevel;
          }
        }

        let newStatus: any;
        if (newLevel === 0) {
          newStatus = 'Empty';
          newAcidity = 0;
          newWaxes = 0;
          newAvgCost = 0;
        } else if (newLevel >= tank.capacity) newStatus = 'Full';
        else newStatus = 'Filling';

        return {
          ...tank,
          currentLevel: newLevel,
          acidity: Number(newAcidity.toFixed(2)),
          waxes: Math.round(newWaxes),
          avgCost: Number(newAvgCost.toFixed(2)),
          status: newStatus as any
        };
      }));
    }

    if (tx.paymentMethod === PaymentMethod.VIREMENT && tx.bankAccountId) {
      setBankAccounts(prev => prev.map(acc => {
        if (acc.id !== tx.bankAccountId) return acc;
        const amount = tx.originalAmount || (tx.amountPaid / (tx.exchangeRate || 1));
        const change = tx.type === TransactionType.VENTE ? amount : -amount;
        return { ...acc, balance: acc.balance + change };
      }));
    }

    addLog(currentUsername, 'Transaction', `Nouvelle ${tx.type}: ${tx.quantity} ${tx.productType} (${tx.partnerName})`, tx.priceTotal);
  };

  const handleAddExpense = (expense: any) => {
    const newExp: Expense = { ...expense, id: `EXP${Date.now()}` };
    setExpenses(prev => [newExp, ...prev]);
    addLog(currentUsername, 'Dépense', `${expense.category}: ${expense.description}`, expense.amount);
  };

  const handleAddManualCash = (amount: number, description: string, type: 'IN' | 'OUT') => {
    const finalAmount = type === 'OUT' ? amount : -amount;
    const newExp: Expense = {
      id: `MAN${Date.now()}`,
      date: new Date().toISOString(),
      category: 'Autre',
      description: `Manuel: ${description}`,
      amount: finalAmount,
      paymentMethod: PaymentMethod.ESPECE
    };
    setExpenses(prev => [newExp, ...prev]);
    addLog(currentUsername, 'Caisse Manuel', `${type}: ${description}`, amount);
  };

  const handleAddCheck = (check: Check) => {
    setChecks(prev => [check, ...prev]);
    addLog(currentUsername, 'Chèque Ajouté', `N°${check.number} - ${check.amount} DH`);
  };

  const handleAddBankAccount = (account: BankAccount) => {
    setBankAccounts(prev => [...prev, account]);
    addLog(currentUsername, 'Banque', `Nouveau compte: ${account.bankName}`);
  };

  const handleUpdateBankAccount = (updatedAccount: BankAccount) => {
    setBankAccounts(prev => prev.map(acc => acc.id === updatedAccount.id ? updatedAccount : acc));
    addLog(currentUsername, 'Banque', `Mise à jour solde: ${updatedAccount.bankName}`);
  };

  const handleAddEmployee = (emp: Employee) => {
    setEmployees(prev => [...prev, emp]);
    addLog(currentUsername, 'RH', `Nouvel employé: ${emp.name}`);
  };

  const handleUpdateAttendance = (record: AttendanceRecord) => {
    setAttendance(prev => {
      const existing = prev.findIndex(a => a.id === record.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = record;
        return updated;
      }
      return [...prev, record];
    });
  };

  const handlePaySalary = (employeeId: string, periodStart: string, amount: number, method: PaymentMethod | 'Impayé', bankAccountId?: string) => {
    const payment: SalaryPayment = {
      id: `SAL${Date.now()}`,
      employeeId,
      periodStart,
      amount,
      method,
      bankAccountId,
      date: new Date().toISOString()
    };
    setSalaryPayments(prev => [...prev, payment]);

    const employee = employees.find(e => e.id === employeeId);

    if (method === PaymentMethod.ESPECE) {
      handleAddExpense({
        date: new Date().toISOString(),
        category: 'Salaires',
        description: `Salaire - ${employee?.name}`,
        amount,
        paymentMethod: PaymentMethod.ESPECE
      });
    } else if (method === PaymentMethod.VIREMENT && bankAccountId) {
      setBankAccounts(prev => prev.map(acc => acc.id === bankAccountId ? { ...acc, balance: acc.balance - amount } : acc));
    }

    addLog(currentUsername, 'Paiement Salaire', `Payé ${amount} DH à ${employee?.name} (${method})`);
  };

  const handleAddVehicle = (v: Vehicle) => {
    setVehicles(prev => [...prev, v]);
    addLog(currentUsername, 'Véhicule', `Ajout: ${v.plateNumber}`);
  };

  const handleUpdateVehicleMission = (id: string, missionData: any) => {
    setVehicles(prev => prev.map(v => v.id === id ? { ...v, ...missionData } : v));
  };

  const handleAddFuel = (quantity: number, cost: number, paymentMethod: PaymentMethod) => {
    setFuelStock(prev => prev + quantity);
    const newLog: FuelLog = {
      id: `FUEL${Date.now()}`,
      date: new Date().toISOString(),
      type: 'ACHAT',
      quantity,
      cost,
      currentStockAfter: fuelStock + quantity
    };
    setFuelLogs(prev => [newLog, ...prev]);

    handleAddExpense({
      category: 'Carburant',
      description: `Achat Gasoil Usine (${quantity}L)${paymentMethod === PaymentMethod.TIERS ? ' (Payé par Tiers)' : ''}`,
      amount: cost,
      paymentMethod,
      date: new Date().toISOString()
    });

    addLog(currentUsername, 'Achat Carburant', `${quantity}L ajoutés au stock (Coût: ${cost})`);
  };

  const handleConsumeFuel = (vehicleId: string, quantity: number) => {
    if (fuelStock < quantity) {
      alert('Stock insuffisant !');
      return;
    }
    setFuelStock(prev => prev - quantity);
    const vehicle = vehicles.find(v => v.id === vehicleId);
    const newLog: FuelLog = {
      id: `FUEL${Date.now()}`,
      date: new Date().toISOString(),
      type: 'CONSOMMATION',
      quantity,
      vehicleId,
      driverName: vehicle?.driverName,
      plateNumber: vehicle?.plateNumber,
      currentStockAfter: fuelStock - quantity
    };
    setFuelLogs(prev => [newLog, ...prev]);
    addLog(currentUsername, 'Conso Carburant', `${vehicle?.plateNumber} a pris ${quantity}L`);
  };

  const handleCashDrop = (vehicleId: string, amount: number) => {
    handleAddExpense({
      date: new Date().toISOString(),
      category: 'Versement Caisse',
      description: `Versement vendeur - ${vehicles.find(v => v.id === vehicleId)?.plateNumber}`,
      amount,
      paymentMethod: PaymentMethod.ESPECE
    });
    addLog(currentUsername, 'Versement Caisse', `Vendeur ${vehicles.find(v => v.id === vehicleId)?.plateNumber} versement: ${amount} DH`);
    alert(`Versement de ${amount} DH enregistré avec succès !`);
  };

  const sellerContent = (() => {
    if (userRole !== 'seller') return null;
    if (!sellerVehicleId) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl shadow-lg max-w-sm w-full text-center">
            <h2 className="text-xl font-bold mb-4">Sélectionnez votre Véhicule</h2>
            <div className="space-y-3">
              {vehicles.map(v => (
                <button
                  key={v.id}
                  onClick={() => setSellerVehicleId(v.id)}
                  className="w-full p-4 border rounded-lg hover:bg-olive-50 hover:border-olive-500 font-bold text-left flex justify-between"
                >
                  <span>{v.plateNumber}</span>
                  <span className="text-gray-500 font-normal">{v.driverName}</span>
                </button>
              ))}
            </div>
            <button onClick={handleLogout} className="mt-6 text-gray-500 text-sm hover:underline">Se déconnecter</button>
          </div>
        </div>
      );
    }

    const currentVehicle = vehicles.find(v => v.id === sellerVehicleId);
    if (!currentVehicle) {
      return <div>Erreur Véhicule (Introuvable). <button onClick={handleLogout}>Déconnexion</button></div>;
    }

    return (
      <SellerDashboard
        vehicle={currentVehicle}
        factoryStock={stock}
        transactions={transactions}
        username={currentUsername}
        onSale={(vid, data) => {
          const totalCartValue = data.items.reduce((sum: number, i: any) => sum + (i.quantity * i.price), 0);

          const newTransactions: Transaction[] = data.items.map((item: any) => {
            const itemTotal = item.quantity * item.price;
            let itemPaid = 0;
            if (data.paymentStatus === PaymentStatus.PAYE) {
              itemPaid = itemTotal;
            } else if (data.paymentStatus === PaymentStatus.IMPAYE) {
              itemPaid = 0;
            } else if (data.paymentStatus === PaymentStatus.PARTIEL) {
              if (totalCartValue > 0) {
                itemPaid = (data.amountPaid || 0) * (itemTotal / totalCartValue);
              }
            }

            return {
              id: `TX-MOB-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              date: new Date().toISOString(),
              type: TransactionType.VENTE,
              productType: ProductType.HUILE_BOUTEILLE,
              quantity: item.quantity,
              unit: 'unités',
              priceTotal: itemTotal,
              originalAmount: itemTotal,
              currency: Currency.MAD,
              exchangeRate: 1,
              partnerName: data.clientName,
              vehicleId: vid,
              details: `${item.brand} ${item.bottleSize}`,
              location: data.location,
              paymentMethod: data.paymentMethod,
              paymentStatus: data.paymentStatus,
              amountPaid: itemPaid
            };
          });
          setTransactions(prev => [...newTransactions, ...prev]);

          setVehicles(prevVehicles => prevVehicles.map(v => {
            if (v.id !== vid || !v.mobileStock) return v;
            const updatedStock = v.mobileStock.map(ms => ({ ...ms }));
            data.items.forEach((soldItem: any) => {
              const idx = updatedStock.findIndex(s => s.brand === soldItem.brand && s.bottleSize === soldItem.bottleSize);
              if (idx >= 0) {
                updatedStock[idx].quantity = Math.max(0, updatedStock[idx].quantity - soldItem.quantity);
              }
            });
            return { ...v, mobileStock: updatedStock };
          }));

          addLog(`Vendeur (${currentVehicle.plateNumber})`, 'Vente Mobile', `Client: ${data.clientName} (${data.items.length} articles)`, totalCartValue);
        }}
        onCashDrop={handleCashDrop}
        onDeleteTransaction={handleDeleteTransaction}
        onLogout={handleLogout}
      />
    );
  })();

  if (backendDown) return <BackendError />;
  if (!authReady) return <div className="min-h-screen flex items-center justify-center">Chargement…</div>;

  if (userRole === 'seller') {
    return sellerContent;
  }

  // Admin content — always render the tree to keep hook order stable
  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        username={currentUsername}
        alerts={displayedAlerts}
      />

      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard transactions={transactions} tanks={tanks} expenses={expenses} username={currentUsername} />} />
            <Route path="/seller" element={<Navigate to="/dashboard" replace />} />
            <Route path="/accounting" element={<Accounting transactions={transactions} expenses={expenses} checks={checks} bankAccounts={bankAccounts} onAddExpense={handleAddExpense} onDeleteTransaction={handleDeleteTransaction} onDeleteExpense={handleDeleteExpense} onAddManualCash={handleAddManualCash} onAddCheck={handleAddCheck} onDeleteCheck={handleDeleteCheck} onAddBankAccount={handleAddBankAccount} onUpdateBankAccount={handleUpdateBankAccount} username={currentUsername} />} />
            <Route path="/invoices" element={<InvoiceManager />} />
            <Route path="/contracts" element={<ContractManager tanks={tanks} onUpdateTank={() => {}} username={currentUsername} />} />
            <Route path="/stock" element={<StockManager tanks={tanks} stockItems={stock} onAddTank={handleAddTank} onAddStock={handleAddStock} onTransferOil={handleTransferOil} onDeleteTank={handleDeleteTank} onDeleteStock={handleDeleteStock} username={currentUsername} />} />
            <Route path="/vehicles" element={<VehicleManager vehicles={vehicles} factoryStock={stock} onAddVehicle={handleAddVehicle} onUpdateMission={handleUpdateVehicleMission} onLoadVehicle={handleLoadVehicle} onMobileSale={handleMobileSale} onDeleteVehicle={handleDeleteVehicle} username={currentUsername} />} />
            <Route path="/fuel" element={<FuelManager currentStock={fuelStock} logs={fuelLogs} vehicles={vehicles} onAddFuel={handleAddFuel} onConsumeFuel={handleConsumeFuel} username={currentUsername} onDeleteLog={handleDeleteFuelLog} />} />
            <Route path="/sellers" element={<SellersTracker vehicles={vehicles} transactions={transactions} />} />
            <Route path="/production" element={<ProductionManager stockItems={stock} tanks={tanks} onProduction={handleProduction} />} />
            <Route path="/partners" element={<TransactionManager transactions={transactions} tanks={tanks} vehicles={vehicles} onDeleteTransaction={handleDeleteTransaction} username={currentUsername} />} />
            <Route path="/hr" element={<Timekeeping employees={employees} attendance={attendance} salaryPayments={salaryPayments} bankAccounts={bankAccounts} onAddEmployee={handleAddEmployee} onDeleteEmployee={handleDeleteEmployee} onUpdateAttendance={handleUpdateAttendance} onAddExpense={handleAddExpense} onPaySalary={handlePaySalary} onDeletePayment={handleDeleteSalaryPayment} />} />
            <Route path="/history" element={<ActivityHistory logs={activityLogs} />} />
            <Route path="/emails" element={<EmailManager accounts={emailAccounts} emails={emails} onSendEmail={handleSendEmail} onUpdateEmail={handleUpdateEmail} onDeleteEmail={handleDeleteEmail} onAddAccount={handleAddEmailAccount} />} />
            <Route path="/admin" element={config.isAdmin(currentUsername) ? <AdminPanel vehicles={vehicles} blockedUsers={blockedUsers} onToggleBlock={handleToggleBlockUser} /> : <Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>

      {(activeTab === 'partners') && (
        <button
          onClick={() => setShowTransactionForm(true)}
          className="fixed bottom-8 right-8 bg-olive-600 text-white p-4 rounded-full shadow-lg shadow-olive-600/40 hover:bg-olive-700 transition-all hover:scale-105 z-40 group"
        >
          <Plus size={24} />
          <span className="absolute right-full mr-4 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap top-1/2 -translate-y-1/2">
            Nouvelle Transaction
          </span>
        </button>
      )}

      {showTransactionForm && (
        <TransactionForm
          onSubmit={handleAddTransaction}
          onCancel={() => setShowTransactionForm(false)}
          tanks={tanks}
          vehicles={vehicles}
          bankAccounts={bankAccounts}
        />
      )}
    </div>
  );
}

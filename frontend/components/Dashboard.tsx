import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Transaction, Tank, TransactionType, Expense } from '../types.ts';
import { TrendingUp, AlertTriangle, Scale, Truck, Lock, Coins } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  tanks: Tank[];
  expenses?: Expense[]; // Needed for Profit Calculation
  username?: string; // To control visibility
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, tanks, expenses = [], username }) => {
  // Check Permissions
  const isSuperAdmin = username === 'mojo' || username === 'boss';
  const isRestrictedAdmin = username === 'hajar' || username === 'safae';

  // Quick stats
  const totalSales = transactions
    .filter(t => t.type === TransactionType.VENTE)
    .reduce((acc, t) => acc + t.priceTotal, 0);

  // Profit Calculation (Simplified: Sales - Purchases - Expenses)
  const totalPurchases = transactions
    .filter(t => t.type === TransactionType.ACHAT)
    .reduce((acc, t) => acc + t.priceTotal, 0);
  
  const totalExpenses = expenses.reduce((acc, e) => acc + (e.amount > 0 ? e.amount : 0), 0); // Exclude cash adjustments
  const netProfit = totalSales - totalPurchases - totalExpenses;

  const totalVolume = tanks.reduce((acc, t) => acc + t.currentLevel, 0);
  const totalCapacity = tanks.reduce((acc, t) => acc + t.capacity, 0);
  const capacityUtilized = Math.round((totalVolume / totalCapacity) * 100);

  // Chart data preparation
  const salesData = transactions
    .filter(t => t.type === TransactionType.VENTE)
    .slice(-7)
    .map(t => ({
      name: new Date(t.date).toLocaleDateString('fr-FR', { weekday: 'short' }),
      vente: t.priceTotal
    }));

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Tableau de Bord</h2>
          <p className="text-gray-500">Aperçu global de l'activité de l'usine {username ? `(${username})` : ''}</p>
        </div>
      </header>


      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* REVENUE CARD - RESTRICTED */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Chiffre d'Affaires</p>
              <h3 className="text-2xl font-bold text-gray-800">
                 {isRestrictedAdmin ? (
                     <span className="flex items-center gap-2 text-gray-400 font-mono text-xl"><Lock size={16}/> Masqué</span>
                 ) : (
                     `${totalSales.toLocaleString()} MAD`
                 )}
              </h3>
            </div>
            <div className="bg-green-100 p-2 rounded-lg text-green-600">
              <TrendingUp size={20} />
            </div>
          </div>
          {!isRestrictedAdmin && <p className="text-xs text-green-600 mt-2">+12% ce mois</p>}
        </div>

        {/* PROFIT CARD - SUPER ADMIN ONLY */}
        {isSuperAdmin && (
            <div className="bg-white p-5 rounded-xl shadow-sm border border-emerald-100 bg-emerald-50/50">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-emerald-700 font-bold">Bénéfice Net</p>
                  <h3 className={`text-2xl font-bold ${netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {netProfit.toLocaleString()} MAD
                  </h3>
                </div>
                <div className="bg-emerald-200 p-2 rounded-lg text-emerald-800">
                  <Coins size={20} />
                </div>
              </div>
              <p className="text-[10px] text-emerald-600 mt-2">(Ventes - Achats - Dépenses)</p>
            </div>
        )}

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Stock Huile (Citerne)</p>
              <h3 className="text-2xl font-bold text-gray-800">{totalVolume.toLocaleString()} L</h3>
            </div>
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
              <Scale size={20} />
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-3">
            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${capacityUtilized}%` }}></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">{capacityUtilized}% de capacité utilisée</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Transactions Récentes</p>
              <h3 className="text-2xl font-bold text-gray-800">{transactions.length}</h3>
            </div>
            <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
              <Truck size={20} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Dernière: Aujourd'hui</p>
        </div>

        {!isSuperAdmin && ( // Fill empty space for layout balance if not super admin
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Qualité Moyenne</p>
                  <h3 className="text-2xl font-bold text-gray-800">0.8%</h3>
                </div>
                <div className="bg-red-100 p-2 rounded-lg text-red-600">
                  <AlertTriangle size={20} />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Acidité moyenne stock</p>
            </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Ventes Récentes</h3>
          {isRestrictedAdmin ? (
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded text-gray-400 flex-col">
                  <Lock size={40} className="mb-2 opacity-50"/>
                  <span>Données financières masquées</span>
              </div>
          ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="vente" fill="#568348" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Niveaux des Citernes</h3>
          <div className="space-y-4">
            {tanks.map(tank => (
              <div key={tank.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{tank.name}</span>
                  <span className="text-gray-500">{tank.currentLevel} / {tank.capacity} L</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${tank.acidity < 0.8 ? 'bg-green-500' : tank.acidity < 2.0 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${(tank.currentLevel / tank.capacity) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                  <span>Acidité: {tank.acidity}%</span>
                  <span>Cires: {tank.waxes}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
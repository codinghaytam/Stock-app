import React, { useState } from 'react';
import { LogEntry } from '../types.ts';
import { Search, Filter, Calendar, User, Activity } from 'lucide-react';

interface ActivityHistoryProps {
  logs: LogEntry[];
}

const ActivityHistory: React.FC<ActivityHistoryProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');

  const filteredLogs = logs.filter(log => {
      if(searchTerm && !log.details.toLowerCase().includes(searchTerm.toLowerCase()) && !log.action.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if(dateFilter && !log.date.startsWith(dateFilter)) return false;
      if(userFilter && !log.user.toLowerCase().includes(userFilter.toLowerCase())) return false;
      return true;
  }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Historique des Activités</h2>
              <p className="text-gray-500">Journal complet des opérations (Qui a fait quoi ?)</p>
            </div>
        </div>

        {/* FILTERS */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                <input 
                  type="text" 
                  placeholder="Rechercher une action, un détail..." 
                  className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-olive-500"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="w-full md:w-48 relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                <input 
                  type="date" 
                  className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-olive-500"
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value)}
                />
            </div>
             <div className="w-full md:w-48 relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                <select 
                  className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-olive-500 bg-white"
                  value={userFilter}
                  onChange={e => setUserFilter(e.target.value)}
                >
                    <option value="">Tous les utilisateurs</option>
                    <option value="Admin">Admin (Mojo)</option>
                    <option value="hajar">Hajar</option>
                    <option value="safae">Safae</option>
                    <option value="Vendeur">Vendeurs</option>
                </select>
            </div>
        </div>

        {/* LOGS TABLE */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 border-b">
                    <tr>
                        <th className="px-6 py-4 font-medium">Date & Heure</th>
                        <th className="px-6 py-4 font-bold text-gray-700">Identifiant (Auteur)</th>
                        <th className="px-6 py-4 font-medium">Action</th>
                        <th className="px-6 py-4 font-medium">Détails</th>
                        <th className="px-6 py-4 font-medium text-right">Montant</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredLogs.length === 0 && (
                        <tr><td colSpan={5} className="p-8 text-center text-gray-400">Aucune activité trouvée.</td></tr>
                    )}
                    {filteredLogs.map(log => (
                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                                {new Date(log.date).toLocaleDateString()} <span className="text-xs text-gray-400 ml-1">{new Date(log.date).toLocaleTimeString()}</span>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm inline-flex items-center gap-1 ${
                                    log.user === 'mojo' ? 'bg-purple-600 text-white' : 
                                    (log.user === 'hajar' || log.user === 'safae') ? 'bg-pink-100 text-pink-700 border border-pink-200' :
                                    log.user.includes('Vendeur') ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                                    'bg-gray-100 text-gray-700'
                                }`}>
                                    <User size={12}/>
                                    {log.user}
                                </span>
                            </td>
                            <td className="px-6 py-4 font-medium text-gray-800">{log.action}</td>
                            <td className="px-6 py-4 text-gray-600">{log.details}</td>
                            <td className="px-6 py-4 text-right">
                                {log.amount ? <span className="font-mono font-medium">{log.amount.toLocaleString()}</span> : '-'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
};

export default ActivityHistory;
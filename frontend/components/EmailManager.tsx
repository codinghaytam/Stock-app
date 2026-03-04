import React, { useState, useMemo } from 'react';
import { EmailAccount, EmailMessage } from '../types.ts';
import { Mail, Inbox, Send, Trash2, Plus, User, Search, Paperclip, Check, ChevronDown, RefreshCw, X } from 'lucide-react';

interface EmailManagerProps {
  accounts: EmailAccount[];
  emails: EmailMessage[];
  onSendEmail: (fromId: string, to: string, subject: string, body: string) => void;
  onUpdateEmail: (email: EmailMessage) => void;
  onDeleteEmail: (id: string) => void;
  onAddAccount: (name: string, email: string) => void;
}

const EmailManager: React.FC<EmailManagerProps> = ({ accounts, emails, onSendEmail, onUpdateEmail, onDeleteEmail, onAddAccount }) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [selectedFolder, setSelectedFolder] = useState<'inbox' | 'sent' | 'trash'>('inbox');
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);

  // Forms
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');

  const [newAccName, setNewAccName] = useState('');
  const [newAccEmail, setNewAccEmail] = useState('');

  const currentAccount = accounts.find(a => a.id === selectedAccountId);

  // Derived Data
  const filteredEmails = useMemo(() => {
      return emails.filter(e => e.accountId === selectedAccountId && e.folder === selectedFolder)
                   .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [emails, selectedAccountId, selectedFolder]);

  const unreadCount = emails.filter(e => e.accountId === selectedAccountId && e.folder === 'inbox' && !e.read).length;

  const handleSelectEmail = (email: EmailMessage) => {
      setSelectedEmail(email);
      if(!email.read) {
          onUpdateEmail({...email, read: true});
      }
  };

  const handleDelete = () => {
      if(selectedEmail) {
          if(selectedEmail.folder === 'trash') {
              onDeleteEmail(selectedEmail.id);
              setSelectedEmail(null);
          } else {
              onUpdateEmail({...selectedEmail, folder: 'trash'});
              setSelectedEmail(null);
          }
      }
  };

  const handleSend = (e: React.FormEvent) => {
      e.preventDefault();
      onSendEmail(selectedAccountId, composeTo, composeSubject, composeBody);
      setIsComposing(false);
      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
      alert("Email envoyé avec succès !");
  };

  const handleCreateAccount = (e: React.FormEvent) => {
      e.preventDefault();
      if(newAccName && newAccEmail) {
          onAddAccount(newAccName, newAccEmail);
          setShowAddAccount(false);
          setNewAccName('');
          setNewAccEmail('');
      }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-fade-in">
        
        {/* SIDEBAR (Accounts & Folders) */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
            {/* Account Switcher */}
            <div className="p-4 border-b border-gray-200">
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Compte Actif</label>
                <div className="relative group">
                    <button className="w-full flex items-center gap-2 bg-white border p-2 rounded-lg shadow-sm text-left">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${currentAccount?.color || 'bg-gray-500'}`}>
                            {currentAccount?.name.charAt(0)}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="font-bold text-sm truncate">{currentAccount?.name}</p>
                            <p className="text-xs text-gray-500 truncate">{currentAccount?.email}</p>
                        </div>
                        <ChevronDown size={16} className="text-gray-400"/>
                    </button>
                    
                    {/* Dropdown */}
                    <div className="absolute top-full left-0 w-full bg-white border rounded-lg shadow-xl mt-1 z-20 hidden group-hover:block">
                        {accounts.map(acc => (
                            <button 
                                key={acc.id}
                                onClick={() => { setSelectedAccountId(acc.id); setSelectedEmail(null); }}
                                className="w-full text-left p-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                            >
                                <div className={`w-6 h-6 rounded-full ${acc.color}`}></div>
                                <span className="truncate">{acc.name}</span>
                            </button>
                        ))}
                        <button 
                            onClick={() => setShowAddAccount(true)}
                            className="w-full text-left p-2 hover:bg-gray-50 flex items-center gap-2 text-sm text-blue-600 font-bold border-t"
                        >
                            <Plus size={16}/> Ajouter un compte
                        </button>
                    </div>
                </div>
            </div>

            {/* Folders */}
            <nav className="flex-1 p-4 space-y-1">
                <button 
                    onClick={() => { setSelectedFolder('inbox'); setSelectedEmail(null); setIsComposing(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium ${selectedFolder === 'inbox' ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                    <div className="flex items-center gap-3">
                        <Inbox size={18}/> Boîte de réception
                    </div>
                    {unreadCount > 0 && <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>}
                </button>
                <button 
                    onClick={() => { setSelectedFolder('sent'); setSelectedEmail(null); setIsComposing(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium ${selectedFolder === 'sent' ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                    <div className="flex items-center gap-3">
                        <Send size={18}/> Envoyés
                    </div>
                </button>
                <button 
                    onClick={() => { setSelectedFolder('trash'); setSelectedEmail(null); setIsComposing(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium ${selectedFolder === 'trash' ? 'bg-red-100 text-red-800' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                    <div className="flex items-center gap-3">
                        <Trash2 size={18}/> Corbeille
                    </div>
                </button>
            </nav>

            <div className="p-4">
                <button 
                    onClick={() => { setIsComposing(true); setSelectedEmail(null); }}
                    className="w-full bg-olive-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-olive-700 flex items-center justify-center gap-2"
                >
                    <Plus size={20}/> Nouveau Message
                </button>
            </div>
        </div>

        {/* EMAIL LIST */}
        <div className="w-80 border-r border-gray-200 flex flex-col bg-white">
            <div className="p-4 border-b border-gray-100">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                    <input type="text" placeholder="Rechercher..." className="w-full pl-9 pr-3 py-2 bg-gray-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"/>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto">
                {filteredEmails.length === 0 && (
                    <div className="text-center py-10 text-gray-400 text-sm">Aucun message.</div>
                )}
                {filteredEmails.map(email => (
                    <div 
                        key={email.id}
                        onClick={() => handleSelectEmail(email)}
                        className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${selectedEmail?.id === email.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''} ${!email.read ? 'bg-gray-50' : ''}`}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <h4 className={`text-sm truncate w-2/3 ${!email.read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                                {selectedFolder === 'sent' ? `À: ${email.to}` : email.from}
                            </h4>
                            <span className="text-xs text-gray-400 whitespace-nowrap">
                                {new Date(email.date).toLocaleDateString([], {day: 'numeric', month: 'short'})}
                            </span>
                        </div>
                        <p className={`text-sm mb-1 truncate ${!email.read ? 'font-bold text-gray-800' : 'text-gray-600'}`}>{email.subject}</p>
                        <p className="text-xs text-gray-400 truncate">{email.body}</p>
                    </div>
                ))}
            </div>
        </div>

        {/* READING PANE / COMPOSER */}
        <div className="flex-1 bg-gray-50 flex flex-col relative">
            {isComposing ? (
                <div className="absolute inset-0 bg-white z-10 flex flex-col">
                    <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                        <h3 className="font-bold text-gray-700">Nouveau Message</h3>
                        <button onClick={() => setIsComposing(false)} className="text-gray-500 hover:text-red-500"><X size={20}/></button>
                    </div>
                    <form onSubmit={handleSend} className="flex-1 p-6 space-y-4 flex flex-col">
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-bold text-gray-500 w-16">De:</span>
                            <div className="flex-1 p-2 bg-gray-100 rounded text-gray-600 text-sm">{currentAccount?.email}</div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-bold text-gray-500 w-16">À:</span>
                            <input 
                                required
                                type="email" 
                                className="flex-1 border-b border-gray-300 p-2 focus:border-blue-500 outline-none"
                                placeholder="Destinataire..."
                                value={composeTo}
                                onChange={e => setComposeTo(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-bold text-gray-500 w-16">Sujet:</span>
                            <input 
                                required
                                type="text" 
                                className="flex-1 border-b border-gray-300 p-2 focus:border-blue-500 outline-none font-medium"
                                placeholder="Objet du message..."
                                value={composeSubject}
                                onChange={e => setComposeSubject(e.target.value)}
                            />
                        </div>
                        <textarea 
                            required
                            className="flex-1 resize-none border rounded-lg p-4 focus:ring-2 focus:ring-blue-500 outline-none mt-4"
                            placeholder="Rédigez votre message ici..."
                            value={composeBody}
                            onChange={e => setComposeBody(e.target.value)}
                        ></textarea>
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setIsComposing(false)} className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Annuler</button>
                            <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2">
                                <Send size={18}/> Envoyer
                            </button>
                        </div>
                    </form>
                </div>
            ) : selectedEmail ? (
                <div className="absolute inset-0 bg-white z-10 flex flex-col">
                    {/* Email Header */}
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-xl font-bold text-gray-800">{selectedEmail.subject}</h2>
                            <div className="flex gap-2">
                                <button onClick={handleDelete} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors" title="Supprimer">
                                    <Trash2 size={20}/>
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                                <User size={20}/>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900">{selectedFolder === 'sent' ? `À: ${selectedEmail.to}` : selectedEmail.from}</p>
                                <p className="text-xs text-gray-500">{new Date(selectedEmail.date).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    {/* Email Body */}
                    <div className="flex-1 p-8 overflow-y-auto text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {selectedEmail.body}
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                    <Mail size={64} className="mb-4 opacity-20"/>
                    <p>Sélectionnez un message pour le lire</p>
                </div>
            )}
        </div>

        {/* MODAL ADD ACCOUNT */}
        {showAddAccount && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                <div className="bg-white rounded-xl p-6 w-96 shadow-2xl">
                    <h3 className="font-bold text-lg mb-4">Ajouter une boîte mail</h3>
                    <form onSubmit={handleCreateAccount} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Nom du service/personne</label>
                            <input className="w-full border rounded p-2" required value={newAccName} onChange={e => setNewAccName(e.target.value)} placeholder="Ex: Maintenance"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Adresse Email</label>
                            <input className="w-full border rounded p-2" required type="email" value={newAccEmail} onChange={e => setNewAccEmail(e.target.value)} placeholder="Ex: maintenance@usine.com"/>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={() => setShowAddAccount(false)} className="text-gray-500 px-4 py-2 hover:bg-gray-100 rounded">Annuler</button>
                            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Créer</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default EmailManager;
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Plus, Minus, Wallet, 
  FileText, ArrowRightLeft, Camera, X, 
  Calendar, Briefcase, Tag, Receipt,
  Menu, Sparkles, ArrowUpRight, ArrowDownRight,
  Home, PieChart, Settings, Search, Filter,
  Download, TrendingUp, TrendingDown, ChevronDown, List,
  Building2, Users, Database, Trash2, Bell, Shield, LogOut,
  ChevronRight, Trash, RefreshCcw, Wifi, WifiOff, CloudUpload, Image as ImageIcon
} from 'lucide-react';

// Constants for Local Storage keys
const STORAGE_KEYS = {
  TRANSACTIONS: 'wtr_ledger_transactions',
  CATEGORIES: 'wtr_ledger_categories',
  BUSINESS_PROFILE: 'wtr_ledger_business_profile',
  TEAM_MEMBERS: 'wtr_ledger_team_members',
  CONFIG: 'wtr_ledger_config'
};

const API_URL = 'https://script.google.com/macros/s/AKfycbxF8UafxvgTgEvW80v-p9OJcAAurVh9BhFlXK06eXDM9v2hCzuJ_QA6aPI3uc7QOWEboA/exec';

const DEFAULT_CATEGORIES = {
  expense: ['ค่าวัสดุ/อุปกรณ์', 'ค่าน้ำ/ค่าไฟ', 'ค่าของกิน', 'ค่าเครื่องมือ', 'อื่นๆ'],
  income: ['งานต่อเรือ', 'งานตัดเลเซอร์', 'งานประกอบท่อ', 'ขายเศษวัสดุ', 'อื่นๆ']
};

const DEFAULT_BUSINESS_PROFILE = {
  name: "WTR Garage Co., Ltd.",
  taxId: "0123456789012",
  address: "123 หมู่ 4 ต.บ้านไร่ อ.ดำเนินสะดวก จ.ราชบุรี 70130"
};

const DEFAULT_TEAM_MEMBERS = [
  { id: 1, name: 'WTR Admin', role: 'เจ้าของกิจการ', access: 'Full Access', initial: 'W' },
  { id: 2, name: 'สมศรี บัญชี', role: 'เสมียน', access: 'บันทึกรายการ', initial: 'S' }
];

export default function App() {
  // Navigation & UI State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('expense');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
  const [breakdownType, setBreakdownType] = useState('income'); 
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [reportPeriod, setReportPeriod] = useState('monthly');
  const [newUserRole, setNewUserRole] = useState('admin');
  
  // Sync State
  const [syncStatus, setSyncStatus] = useState('idle'); 
  const [lastSynced, setLastSynced] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // File Upload State
  const [selectedImages, setSelectedImages] = useState([]);
  const fileInputRef = useRef(null);

  // Data State with Cache
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return saved ? JSON.parse(saved) : [];
  });

  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [businessProfile, setBusinessProfile] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BUSINESS_PROFILE);
    return saved ? JSON.parse(saved) : DEFAULT_BUSINESS_PROFILE;
  });

  const [teamMembers, setTeamMembers] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TEAM_MEMBERS);
    return saved ? JSON.parse(saved) : DEFAULT_TEAM_MEMBERS;
  });

  // Sync to Storage
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.BUSINESS_PROFILE, JSON.stringify(businessProfile)); }, [businessProfile]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.TEAM_MEMBERS, JSON.stringify(teamMembers)); }, [teamMembers]);

  // Online Detection
  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const syncWithGoogleSheets = useCallback(async () => {
    if (!isOnline) return;
    setSyncStatus('syncing');
    try {
      const txRes = await fetch(`${API_URL}?action=getTransactions`, { redirect: 'follow' });
      const txData = await txRes.json();
      if (Array.isArray(txData)) setTransactions(txData);

      const catRes = await fetch(`${API_URL}?action=getCategories`, { redirect: 'follow' });
      const catData = await catRes.json();
      if (Array.isArray(catData)) {
        const newCats = { income: [], expense: [] };
        catData.forEach(c => {
          if (c.type === 'income') newCats.income.push(c.item || c.name);
          if (c.type === 'expense') newCats.expense.push(c.item || c.name);
        });
        if (newCats.income.length > 0 || newCats.expense.length > 0) setCategories(newCats);
      }

      setLastSynced(new Date());
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      setSyncStatus('error');
    }
  }, [isOnline]);

  useEffect(() => { syncWithGoogleSheets(); }, [syncWithGoogleSheets]);

  // Calculations
  const totals = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const breakdownData = useMemo(() => {
    const calc = (type) => {
      const filtered = transactions.filter(t => t.type === type);
      const total = filtered.reduce((s, t) => s + t.amount, 0);
      const categoryMap = {};
      filtered.forEach(t => categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount);
      return {
        total,
        items: Object.entries(categoryMap).map(([name, amount]) => ({
          name, amount, percent: total > 0 ? Math.round((amount / total) * 100) : 0,
          color: type === 'income' ? '#DDFD54' : '#AE88F9'
        })).sort((a, b) => b.amount - a.amount)
      };
    };
    return { income: calc('income'), expense: calc('expense') };
  }, [transactions]);

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    partyName: '', itemName: '', unitPrice: '', quantity: '1',
    totalAmount: '', category: '', paymentMethod: 'cash',
  });

  const handleOpenModal = (type) => {
    setModalType(type);
    setSelectedImages([]);
    setFormData({
      date: new Date().toISOString().split('T')[0], partyName: '', itemName: '', unitPrice: '', quantity: '1',
      totalAmount: '', category: categories[type][0] || '', paymentMethod: 'cash',
    });
    setIsModalOpen(true);
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImages(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          file: file,
          preview: URL.createObjectURL(file),
          base64: reader.result
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (id) => {
    setSelectedImages(prev => prev.filter(img => img.id !== id));
  };

  const handleFormSubmit = async (e) => {
    if (e) e.preventDefault();
    const finalAmount = parseFloat(formData.unitPrice) * parseFloat(formData.quantity) || parseFloat(formData.totalAmount);
    if (!finalAmount || finalAmount <= 0) return;

    setSyncStatus('syncing');
    let receiptUrls = "";

    // 1. Upload Images to Google Drive if any
    if (isOnline && selectedImages.length > 0) {
      try {
        const uploadRes = await fetch(API_URL, {
          method: 'POST',
          body: JSON.stringify({
            action: 'uploadFiles',
            payload: {
              txId: Date.now(),
              files: selectedImages.map(img => ({
                name: img.file.name,
                type: img.file.type,
                base64: img.base64
              }))
            }
          })
        });
        const uploadData = await uploadRes.json();
        if (uploadData.status === 'success') {
          receiptUrls = uploadData.urls.join(", ");
        }
      } catch (err) {
        console.error("Upload failed", err);
      }
    }

    const newTx = {
      id: Date.now(), type: modalType, date: formData.date, party: formData.partyName || 'ทั่วไป',
      desc: formData.itemName || (modalType === 'income' ? 'รายรับ' : 'รายจ่าย'),
      amount: finalAmount, method: formData.paymentMethod,
      time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      category: formData.category, 
      receiptUrl: receiptUrls // Added link to Sheet
    };

    // 2. Update UI & Cache
    setTransactions([newTx, ...transactions]);
    setIsModalOpen(false);

    // 3. Save Transaction to Sheet
    if (isOnline) {
      try {
        await fetch(API_URL, {
          method: 'POST', mode: 'no-cors',
          body: JSON.stringify({ action: 'addTransaction', payload: newTx })
        });
        setSyncStatus('success');
        setTimeout(() => setSyncStatus('idle'), 3000);
      } catch (error) {
        setSyncStatus('error');
      }
    } else {
      setSyncStatus('idle');
    }
  };

  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [newCategoryType, setNewCategoryType] = useState('income');
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    const catName = newCategoryName.trim();
    setCategories(prev => ({ ...prev, [newCategoryType]: [...prev[newCategoryType], catName] }));
    setIsAddCategoryModalOpen(false);
    setNewCategoryName('');

    if (isOnline) {
      setSyncStatus('syncing');
      try {
        await fetch(API_URL, {
          method: 'POST', mode: 'no-cors',
          body: JSON.stringify({ action: 'addCategory', payload: { type: newCategoryType, name: catName } })
        });
        setSyncStatus('success');
        setTimeout(() => setSyncStatus('idle'), 2000);
      } catch (e) { setSyncStatus('error'); }
    }
  };

  const handleDeleteCategory = (type, cat) => {
    if (window.confirm(`ลบหมวดหมู่ ${cat}?`)) {
       setCategories(prev => ({ ...prev, [type]: prev[type].filter(c => c !== cat) }));
    }
  };

  const handleMigration = async () => {
    if (!window.confirm('อัปโหลดข้อมูล Local สู่ Cloud?')) return;
    if (!isOnline) return alert('No connection');
    setSyncStatus('syncing');
    try {
      for (const tx of transactions) {
        await fetch(API_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action: 'addTransaction', payload: tx }) });
      }
      alert(`Migrated ${transactions.length} items`);
      setSyncStatus('success');
    } catch (e) { setSyncStatus('error'); }
  };

  const formatCurrency = (val) => `฿${val.toLocaleString()}`;

  return (
    <div className="min-h-screen bg-[#F8F7FA] text-[#1D1B20] font-sans flex flex-col selection:bg-[#DDFD54] selection:text-[#1D1B20]">
      {/* Hidden File Input */}
      <input 
        type="file" 
        multiple 
        accept="image/*" 
        capture="environment"
        ref={fileInputRef} 
        onChange={handleImageSelect} 
        className="hidden" 
      />

      <nav className="px-3 md:px-8 py-3 md:py-5 w-full sticky top-0 z-50 bg-[#F8F7FA]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto bg-white rounded-full px-4 md:px-6 py-2.5 md:py-3 flex justify-between items-center shadow-lg border border-[#EAE3F4]/50 z-50">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 text-[#1D1B20]" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex items-center gap-2">
              <Sparkles className="text-[#AE88F9]" size={20} />
              <h1 className="font-black text-xl tracking-tighter">WTR<span className="text-[#AE88F9]">.</span></h1>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-2 absolute left-1/2 -translate-x-1/2 bg-[#F8F7FA] p-1 rounded-full border border-[#EAE3F4]/50">
            {['dashboard', 'reports', 'settings'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`flex items-center gap-2 font-black px-5 py-2.5 rounded-full transition-all ${activeTab === tab ? 'bg-white text-[#1D1B20] shadow-sm' : 'text-[#7A7585] hover:text-[#1D1B20]'}`}>
                {tab === 'dashboard' ? <Home size={18} /> : tab === 'reports' ? <PieChart size={18} /> : <Settings size={18} />} {tab.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
             <div className={`p-2 rounded-full flex items-center gap-2 ${syncStatus === 'syncing' ? 'bg-amber-50 text-amber-500 animate-pulse' : 'bg-green-50 text-emerald-500'}`}>
               {isOnline ? (syncStatus === 'syncing' ? <RefreshCcw size={16} className="animate-spin" /> : <Wifi size={16} />) : <WifiOff size={16} />}
             </div>
             <div className="w-10 h-10 bg-[#DDFD54] rounded-full flex items-center justify-center font-black text-xs shadow-sm">WTR</div>
          </div>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-[#1D1B20]/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="absolute top-[80px] left-3 right-3 bg-white rounded-[32px] p-4 flex flex-col gap-2">
            {['dashboard', 'reports', 'settings'].map(t => (
              <button key={t} onClick={() => setActiveTab(t)} className={`flex items-center gap-4 font-black p-4 rounded-[24px] ${activeTab === t ? 'bg-[#DDFD54]' : 'text-[#7A7585]'}`}>
                {t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
             <div className="lg:col-span-8 space-y-8">
                <div className="pt-4">
                  <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-[#1D1B20] leading-none">Smart Ledger<br/><span className="text-[#AE88F9]">For WTR.</span></h2>
                  <p className="text-[#7A7585] font-black mt-6 uppercase tracking-widest text-xs">Manage your cloud database with photos</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="md:col-span-2 bg-[#AE88F9] p-10 rounded-[56px] text-white shadow-2xl relative overflow-hidden group">
                      <p className="text-white/60 font-black text-xs uppercase tracking-widest mb-2">Net Cash Balance</p>
                      <h3 className="text-5xl md:text-7xl font-black tracking-tighter truncate">{formatCurrency(totals.balance)}</h3>
                      <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                   </div>
                   <div className="bg-[#DDFD54] p-10 rounded-[56px] flex flex-col justify-between shadow-sm">
                      <div className="w-12 h-12 bg-white/40 rounded-full flex items-center justify-center"><ArrowUpRight size={24} /></div>
                      <div><p className="text-black/60 font-black text-xs uppercase tracking-widest mb-1">Income</p><h4 className="text-2xl font-black truncate">{formatCurrency(totals.income)}</h4></div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <button onClick={() => handleOpenModal('income')} className="bg-[#1D1B20] text-white p-8 md:p-12 rounded-[56px] flex flex-col justify-between min-h-[220px] shadow-2xl hover:scale-[1.02] transition-transform">
                      <div className="bg-[#333038] p-4 rounded-3xl text-[#DDFD54] w-fit shadow-lg"><Plus size={32} /></div>
                      <div className="text-left font-black text-2xl md:text-3xl tracking-tighter uppercase">+ Income</div>
                   </button>
                   <button onClick={() => handleOpenModal('expense')} className="bg-white border-2 border-[#EAE3F4] p-8 md:p-12 rounded-[56px] flex flex-col justify-between min-h-[220px] shadow-md hover:scale-[1.02] transition-transform">
                      <div className="bg-[#F8F7FA] p-4 rounded-3xl text-[#AE88F9] w-fit shadow-sm"><Minus size={32} /></div>
                      <div className="text-left font-black text-2xl md:text-3xl tracking-tighter uppercase">- Expense</div>
                   </button>
                </div>
             </div>

             {/* Recent Activity Sidebar */}
             <div className="lg:col-span-4 bg-white rounded-[56px] shadow-2xl flex flex-col h-[750px] overflow-hidden border border-[#EAE3F4] animate-in slide-in-from-right-8 duration-700">
                <div className="p-10 border-b border-[#F8F7FA] flex justify-between items-center">
                   <h3 className="font-black text-2xl tracking-tighter uppercase">Activity</h3>
                   <button onClick={() => setIsHistoryOpen(true)} className="text-[#AE88F9] font-black text-sm">VIEW ALL</button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
                   {transactions.map(tx => (
                     <div key={tx.id} className="flex items-center justify-between p-5 bg-[#F8F7FA] rounded-[32px] hover:bg-[#F2EFF5] transition-all group">
                        <div className="flex items-center gap-4 min-w-0">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${tx.type === 'income' ? 'bg-[#DDFD54]' : 'bg-[#AE88F9] text-white'}`}>
                              {tx.receiptUrl ? <ImageIcon size={20} /> : (tx.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />)}
                           </div>
                           <div className="truncate">
                              <p className="font-black text-[15px] truncate text-[#1D1B20] leading-none mb-1">{tx.desc}</p>
                              <p className="text-[10px] font-black text-[#7A7585] uppercase tracking-tighter">{tx.party} • {tx.time}</p>
                           </div>
                        </div>
                        <p className={`font-black tracking-tighter ${tx.type === 'income' ? 'text-[#1D1B20]' : 'text-[#AE88F9]'}`}>{tx.amount.toLocaleString()}</p>
                     </div>
                   ))}
                   {transactions.length === 0 && <div className="h-full flex items-center justify-center text-[#7A7585] font-black opacity-30 uppercase">No Data</div>}
                </div>
             </div>
          </div>
        )}

        {/* Categories Tab in Settings */}
        {activeTab === 'settings' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
             <div className="bg-[#1D1B20] p-12 rounded-[56px] text-white shadow-2xl relative overflow-hidden">
                <h3 className="font-black text-2xl mb-8 flex items-center gap-3"><CloudUpload /> CLOUD MANAGEMENT</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                   <div className="bg-white/10 p-6 rounded-3xl border border-white/10 backdrop-blur-md">
                      <p className="text-[10px] font-black text-[#DDFD54] tracking-widest uppercase mb-2">Connected URL</p>
                      <p className="text-xs opacity-50 font-mono truncate">{API_URL}</p>
                   </div>
                   <div className="flex flex-col gap-3">
                      <button onClick={syncWithGoogleSheets} className="bg-[#DDFD54] text-[#1D1B20] py-4 rounded-2xl font-black text-sm active:scale-95 transition-transform">SYNC DATA NOW</button>
                      <button onClick={handleMigration} className="bg-white/10 text-white py-4 rounded-2xl font-black text-sm border border-white/20 active:scale-95 transition-transform">UPLOAD LOCAL CACHE</button>
                   </div>
                </div>
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#AE88F9]/20 rounded-full blur-3xl -mb-32 -mr-32"></div>
             </div>

             <div className="bg-white border-2 border-[#EAE3F4] p-12 rounded-[56px] shadow-sm">
                <h3 className="font-black text-2xl mb-10 uppercase tracking-tighter">Budget Registry</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                   <div>
                      <h4 className="font-black text-emerald-500 text-xs mb-4 tracking-widest uppercase flex items-center gap-2"><ArrowUpRight size={18} /> Income Sources</h4>
                      <div className="flex flex-wrap gap-2">
                         {categories.income.map(c => <div key={c} className="bg-[#F8F7FA] border border-[#EAE3F4] px-4 py-2 rounded-2xl text-[11px] font-black flex items-center gap-2">{c}<button onClick={() => handleDeleteCategory('income', c)}><X size={14}/></button></div>)}
                         <button onClick={() => {setNewCategoryType('income'); setIsAddCategoryModalOpen(true);}} className="bg-[#DDFD54] px-4 py-2 rounded-2xl text-[11px] font-black">+ ADD NEW</button>
                      </div>
                   </div>
                   <div>
                      <h4 className="font-black text-[#AE88F9] text-xs mb-4 tracking-widest uppercase flex items-center gap-2"><ArrowDownRight size={18} /> Expense Types</h4>
                      <div className="flex flex-wrap gap-2">
                         {categories.expense.map(c => <div key={c} className="bg-[#F8F7FA] border border-[#EAE3F4] px-4 py-2 rounded-2xl text-[11px] font-black flex items-center gap-2">{c}<button onClick={() => handleDeleteCategory('expense', c)}><X size={14}/></button></div>)}
                         <button onClick={() => {setNewCategoryType('expense'); setIsAddCategoryModalOpen(true);}} className="bg-[#AE88F9] text-white px-4 py-2 rounded-2xl text-[11px] font-black">+ ADD NEW</button>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}
      </main>

      {/* Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4 bg-[#1D1B20]/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-xl rounded-t-[48px] md:rounded-[64px] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-12 duration-500">
              <div className={`p-10 md:p-14 flex justify-between items-center ${modalType === 'income' ? 'bg-[#DDFD54]' : 'bg-[#AE88F9] text-white'}`}>
                 <h2 className="text-4xl font-black tracking-tighter uppercase leading-none">New Entry<br/><span className="text-xl md:text-2xl opacity-60">Record {modalType}</span></h2>
                 <button onClick={() => setIsModalOpen(false)} className="bg-white/20 p-4 rounded-full active:rotate-90 transition-transform"><X size={24} /></button>
              </div>
              <form onSubmit={handleFormSubmit} className="p-8 md:p-12 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase opacity-40 ml-1">Date</label><input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-[#F8F7FA] p-5 rounded-[24px] outline-none font-black" /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase opacity-40 ml-1">Type</label><select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-[#F8F7FA] p-5 rounded-[24px] outline-none font-black appearance-none">{categories[modalType].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                 </div>
                 <input type="text" placeholder="PARTNER NAME / CUSTOMER" value={formData.partyName} onChange={e => setFormData({...formData, partyName: e.target.value})} className="w-full bg-[#F8F7FA] p-6 rounded-[24px] outline-none font-black text-sm focus:border-black border-2 border-transparent transition" />
                 <input type="text" placeholder="ITEM DESCRIPTION" value={formData.itemName} onChange={e => setFormData({...formData, itemName: e.target.value})} className="w-full bg-[#F8F7FA] p-6 rounded-[24px] outline-none font-black text-sm focus:border-black border-2 border-transparent transition" />
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="number" placeholder="PRICE/UNIT" value={formData.unitPrice} onChange={e => setFormData({...formData, unitPrice: e.target.value})} className="w-full bg-[#F8F7FA] p-6 rounded-[24px] outline-none font-black text-sm" />
                    <input type="number" placeholder="QTY" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="w-full bg-[#F8F7FA] p-6 rounded-[24px] outline-none font-black text-sm" />
                 </div>
                 
                 {/* Receipt Section */}
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase opacity-40 ml-1">Attachments (Photos)</label>
                    <div className="flex flex-wrap gap-3">
                       {selectedImages.map(img => (
                          <div key={img.id} className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-md group">
                             <img src={img.preview} alt="Receipt" className="w-full h-full object-cover" />
                             <button type="button" onClick={() => removeImage(img.id)} className="absolute top-1 right-1 bg-white/80 p-1 rounded-full text-rose-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                <X size={14} />
                             </button>
                          </div>
                       ))}
                       <button type="button" onClick={() => fileInputRef.current?.click()} className="w-20 h-20 rounded-2xl border-2 border-dashed border-[#EAE3F4] flex flex-col items-center justify-center text-[#7A7585] hover:bg-[#F8F7FA] transition active:scale-95">
                          <Camera size={24} />
                          <span className="text-[9px] font-black mt-1">ADD</span>
                       </button>
                    </div>
                 </div>

                 <div className="p-8 bg-[#1D1B20] text-center rounded-[32px] shadow-2xl">
                    <p className="text-[10px] font-black text-white/50 mb-1 uppercase tracking-widest">Total Amount Due</p>
                    <h3 className="text-4xl font-black text-[#DDFD54]">{formatCurrency(parseFloat(formData.unitPrice) * parseFloat(formData.quantity) || 0)}</h3>
                 </div>
                 <button type="submit" disabled={syncStatus === 'syncing'} className={`w-full py-8 rounded-full text-xl font-black transition-all shadow-2xl active:scale-[0.98] flex items-center justify-center gap-3 ${modalType === 'income' ? 'bg-[#DDFD54] text-[#1D1B20]' : 'bg-[#AE88F9] text-white'}`}>
                    {syncStatus === 'syncing' ? <RefreshCcw className="animate-spin" /> : <CloudUpload />} {syncStatus === 'syncing' ? 'PROCESSING...' : 'CONFIRM ENTRY'}
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* Categories Add Modal */}
      {isAddCategoryModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-[#1D1B20]/40 backdrop-blur-md">
           <div className="bg-white p-10 rounded-[48px] w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
              <h3 className="text-2xl font-black mb-6 uppercase tracking-tighter">Add {newCategoryType}</h3>
              <input type="text" autoFocus value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddCategory()} placeholder="NAME..." className="w-full bg-[#F8F7FA] p-6 rounded-[24px] outline-none font-black text-sm mb-6" />
              <button onClick={handleAddCategory} className="w-full bg-[#1D1B20] text-white py-4 rounded-2xl font-black tracking-widest">ADD CATEGORY</button>
              <button onClick={() => setIsAddCategoryModalOpen(false)} className="w-full mt-4 text-[#7A7585] font-black text-sm">CANCEL</button>
           </div>
        </div>
      )}
    </div>
  );
}

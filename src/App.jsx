import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Plus, Minus, Wallet, 
  FileText, ArrowRightLeft, Camera, X, 
  Calendar, Briefcase, Tag, Receipt,
  Menu, Sparkles, ArrowUpRight, ArrowDownRight,
  Home, PieChart, Settings, Search, Filter,
  Download, TrendingUp, TrendingDown, ChevronDown, List,
  Building2, Users, Database, Trash2, Bell, Shield, LogOut,
  ChevronRight, Trash, RefreshCcw, Wifi, WifiOff, CloudUpload
} from 'lucide-react';

// Constants for Local Storage keys
const STORAGE_KEYS = {
  TRANSACTIONS: 'wtr_ledger_transactions',
  CATEGORIES: 'wtr_ledger_categories',
  BUSINESS_PROFILE: 'wtr_ledger_business_profile',
  TEAM_MEMBERS: 'wtr_ledger_team_members',
  CONFIG: 'wtr_ledger_config'
};

// Google Apps Script URL provided by the user
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
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle', 'syncing', 'success', 'error'
  const [lastSynced, setLastSynced] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Data State with Local Storage initialization (as Cache)
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

  // Sync to Local Storage on every change (Caching)
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.BUSINESS_PROFILE, JSON.stringify(businessProfile)); }, [businessProfile]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.TEAM_MEMBERS, JSON.stringify(teamMembers)); }, [teamMembers]);

  // Handle Online/Offline Status
  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Sync Data with Google Sheets
  const syncWithGoogleSheets = useCallback(async () => {
    if (!isOnline) return;
    setSyncStatus('syncing');
    try {
      // 1. Fetch Transactions
      const txRes = await fetch(`${API_URL}?action=getTransactions`, { redirect: 'follow' });
      const txData = await txRes.json();
      if (Array.isArray(txData)) {
        // Merge or replace? For a simple ledger, we replace local with cloud's truth if they differ
        setTransactions(txData);
      }

      // 2. Fetch Categories
      const catRes = await fetch(`${API_URL}?action=getCategories`, { redirect: 'follow' });
      const catData = await catRes.json();
      if (Array.isArray(catData)) {
        const newCats = { income: [], expense: [] };
        catData.forEach(c => {
          if (c.type === 'income') newCats.income.push(c.item);
          if (c.type === 'expense') newCats.expense.push(c.item);
        });
        if (newCats.income.length > 0 || newCats.expense.length > 0) {
           setCategories(newCats);
        }
      }

      setLastSynced(new Date());
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('error');
    }
  }, [isOnline]);

  // Initial Sync from Cloud
  useEffect(() => {
    syncWithGoogleSheets();
  }, [syncWithGoogleSheets]);

  // Derived Calculations
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
      const items = Object.entries(categoryMap).map(([name, amount]) => ({
        name, amount, percent: total > 0 ? Math.round((amount / total) * 100) : 0,
        color: type === 'income' ? '#DDFD54' : '#AE88F9'
      })).sort((a, b) => b.amount - a.amount);
      return { total, items };
    };
    return { income: calc('income'), expense: calc('expense') };
  }, [transactions]);

  // Form Handlers
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    partyName: '', itemName: '', unitPrice: '', quantity: '1',
    totalAmount: '', category: '', paymentMethod: 'cash',
  });

  const handleOpenModal = (type) => {
    setModalType(type);
    setFormData({
      date: new Date().toISOString().split('T')[0], partyName: '', itemName: '', unitPrice: '', quantity: '1',
      totalAmount: '', category: categories[type][0] || '', paymentMethod: 'cash',
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    if (e) e.preventDefault();
    const finalAmount = parseFloat(formData.unitPrice) * parseFloat(formData.quantity) || parseFloat(formData.totalAmount);
    if (!finalAmount || finalAmount <= 0) return;

    const newTx = {
      id: Date.now(), type: modalType, date: formData.date, party: formData.partyName || 'ทั่วไป',
      desc: formData.itemName || (modalType === 'income' ? 'รายรับ' : 'รายจ่าย'),
      amount: finalAmount, method: formData.paymentMethod,
      time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      category: formData.category
    };

    // 1. Update UI immediately (Optimistic UI)
    setTransactions([newTx, ...transactions]);
    setIsModalOpen(false);

    // 2. Sync to Google Sheets
    if (isOnline) {
      setSyncStatus('syncing');
      try {
        await fetch(API_URL, {
          method: 'POST', mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'addTransaction', payload: newTx })
        });
        setSyncStatus('success');
        setTimeout(() => setSyncStatus('idle'), 3000);
      } catch (error) {
        console.error('Post failed:', error);
        setSyncStatus('error');
      }
    }
  };

  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [newCategoryType, setNewCategoryType] = useState('income');
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    const catName = newCategoryName.trim();
    
    // Optimistic UI
    setCategories(prev => ({ ...prev, [newCategoryType]: [...prev[newCategoryType], catName] }));
    setIsAddCategoryModalOpen(false);
    setNewCategoryName('');

    // Sync to Cloud
    if (isOnline) {
      setSyncStatus('syncing');
      try {
        await fetch(API_URL, {
          method: 'POST', mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'addCategory', payload: { type: newCategoryType, name: catName } })
        });
        setSyncStatus('success');
        setTimeout(() => setSyncStatus('idle'), 2000);
      } catch (error) {
        setSyncStatus('error');
      }
    }
  };

  const handleDeleteCategory = (type, cat) => {
    if (window.confirm(`ลบหมวดหมู่ ${cat}? ระบบจะลบเฉพาะตัวเลือกในแอปเท่านั้น ข้อมูลบน Cloud จะไม่ถูกกระทบ`)) {
       setCategories(prev => ({ ...prev, [type]: prev[type].filter(c => c !== cat) }));
    }
  };

  const handleMigration = async () => {
    if (!window.confirm('คุณต้องการอัปโหลดข้อมูลทั้งหมดในแอป (Local Storage) ขึ้นสู่ Google Sheets ใช่หรือไม่?')) return;
    if (!isOnline) return alert('กรุณาเชื่อมต่ออินเทอร์เน็ต');
    
    setSyncStatus('syncing');
    let count = 0;
    try {
      for (const tx of transactions) {
        await fetch(API_URL, {
          method: 'POST', mode: 'no-cors',
          body: JSON.stringify({ action: 'addTransaction', payload: tx })
        });
        count++;
      }
      alert(`อัปโหลดสำเร็จจำนวน ${count} รายการ`);
      setSyncStatus('success');
    } catch (e) {
      setSyncStatus('error');
      alert('การอัปโหลดติดขัด');
    }
  };

  const formatCurrency = (val) => `฿${val.toLocaleString()}`;

  return (
    <div className="min-h-screen bg-[#F8F7FA] text-[#1D1B20] font-sans flex flex-col selection:bg-[#DDFD54] selection:text-[#1D1B20]">
      {/* Floating Navbar */}
      <nav className="px-3 md:px-8 py-3 md:py-5 w-full sticky top-0 z-50 bg-[#F8F7FA]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto bg-white rounded-full px-4 md:px-6 py-2.5 md:py-3 flex justify-between items-center shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] relative z-50 transition-all duration-500">
          <div className="flex items-center gap-2 md:gap-3">
            <button className="lg:hidden p-2 -ml-2 text-[#1D1B20] hover:bg-[#F8F7FA] rounded-full transition" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex items-center gap-1.5 md:gap-2">
              <Sparkles className="text-[#AE88F9] hidden sm:block" size={20} />
              <h1 className="font-extrabold text-lg md:text-xl tracking-tight">WTR<span className="text-[#AE88F9]">.</span></h1>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-2 absolute left-1/2 -translate-x-1/2 bg-[#F8F7FA] p-1 rounded-full border border-[#EAE3F4]/50">
            {[
              { id: 'dashboard', label: 'ภาพรวม', icon: Home },
              { id: 'reports', label: 'รายงาน', icon: PieChart },
              { id: 'settings', label: 'ตั้งค่า', icon: Settings }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 font-bold px-5 py-2.5 rounded-full transition-all duration-300 ${activeTab === tab.id ? 'bg-white text-[#1D1B20] shadow-sm scale-[1.05]' : 'text-[#7A7585] hover:text-[#1D1B20]'}`}>
                <tab.icon size={18} /> {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Sync Indicator */}
            <div className={`p-2 rounded-full flex items-center gap-2 ${syncStatus === 'syncing' ? 'bg-amber-50 text-amber-500 animate-pulse' : syncStatus === 'error' ? 'bg-rose-50 text-rose-500' : 'bg-green-50 text-emerald-500'}`}>
               {isOnline ? (syncStatus === 'syncing' ? <RefreshCcw size={16} className="animate-spin" /> : <Wifi size={16} />) : <WifiOff size={16} />}
               <span className="hidden sm:block text-[10px] font-extrabold uppercase">
                  {syncStatus === 'syncing' ? 'Syncing...' : isOnline ? 'Online' : 'Offline'}
               </span>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-[#DDFD54] rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition-transform shadow-sm border border-[#1D1B20]/10">
              <span className="font-bold text-[#1D1B20] text-xs">WTR</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-[#1D1B20]/40 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="absolute top-[80px] left-3 right-3 bg-white rounded-[32px] p-3 shadow-2xl flex flex-col gap-2 animate-in slide-in-from-top-4 duration-300">
            {['dashboard', 'reports', 'settings'].map(t => (
              <button key={t} onClick={() => {setActiveTab(t); setIsMobileMenuOpen(false);}} className={`flex items-center gap-4 font-extrabold px-6 py-4 rounded-[24px] ${activeTab === t ? 'bg-[#DDFD54] text-[#1D1B20]' : 'text-[#7A7585] hover:bg-[#F8F7FA]'}`}>
                 {t === 'dashboard' ? <Home size={20} /> : t === 'reports' ? <PieChart size={20} /> : <Settings size={20} />}
                 {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Sections */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:px-8 pb-12">
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-300">
            <div className="lg:col-span-12 xl:col-span-8 space-y-6">
              <div className="pt-2">
                <h2 className="text-3xl md:text-5xl font-extrabold text-[#1D1B20] tracking-tight leading-tight">Welcome to <br/> WTR Ledger <CloudUpload size={24} className="inline ml-2 text-[#AE88F9] bg-white p-1 rounded-full shadow-sm" /></h2>
                <p className="text-sm md:text-lg text-[#7A7585] mt-4 max-w-md font-medium">จัดการบัญชีอู่ของคุณด้วยระบบ Cloud อัตโนมัติ</p>
              </div>

              {/* Status Banner */}
              {!isOnline && (
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-[20px] flex items-center gap-3 text-rose-600 font-bold text-sm">
                   <WifiOff size={20} /> ระบบกำลังทำงานในโหมด Offline (ข้อมูลจะซิงค์เมื่อคุณกลับมาเชื่อมต่อเน็ต)
                </div>
              )}

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <div className="col-span-2 md:col-span-1 lg:col-span-3 xl:col-span-1 bg-[#AE88F9] p-6 lg:p-10 rounded-[32px] md:rounded-[48px] shadow-2xl relative overflow-hidden text-white group hover:scale-[1.01] transition-transform duration-500">
                  <div className="relative z-10">
                    <div className="bg-[#DDFD54] text-[#1D1B20] text-[10px] font-black px-4 py-1.5 rounded-full w-fit mb-6 flex items-center gap-1.5 shadow-sm transform group-hover:scale-105 transition-transform">
                      <Sparkles size={12} /> AVAILABLE BALANCE
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black tracking-tighter truncate">{formatCurrency(totals.balance)}</h2>
                  </div>
                  <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                </div>
                <div className="bg-[#DDFD54] p-6 md:p-8 rounded-[32px] md:rounded-[48px] flex flex-col justify-between hover:scale-[1.02] transition-transform shadow-sm">
                  <div className="bg-white/40 w-10 h-10 rounded-full flex items-center justify-center"><ArrowUpRight size={24} /></div>
                  <div><p className="text-[#1D1B20]/60 font-extrabold mb-1.5 text-xs md:text-sm uppercase tracking-wider">Total Income</p><h3 className="text-2xl md:text-3xl font-black truncate tracking-tight">{formatCurrency(totals.income)}</h3></div>
                </div>
                <div className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[48px] flex flex-col justify-between shadow-sm hover:scale-[1.02] transition-transform border border-[#EAE3F4]">
                  <div className="bg-[#F8F7FA] w-10 h-10 rounded-full flex items-center justify-center text-[#AE88F9]"><ArrowDownRight size={24} /></div>
                  <div><p className="text-[#7A7585] font-extrabold mb-1.5 text-xs md:text-sm uppercase tracking-wider">Total Expense</p><h3 className="text-2xl md:text-3xl font-black truncate tracking-tight text-[#AE88F9]">{formatCurrency(totals.expense)}</h3></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 md:gap-6">
                <button onClick={() => handleOpenModal('income')} className="bg-[#1D1B20] text-white p-6 md:p-10 rounded-[32px] md:rounded-[48px] flex flex-col justify-between items-start min-h-[160px] md:min-h-[220px] shadow-2xl hover:-translate-y-2 transition-all duration-300 group">
                  <div className="bg-[#333038] p-4 rounded-3xl text-[#DDFD54] group-hover:scale-110 transition-transform shadow-lg"><Plus size={28} /></div>
                  <div className="text-left"><span className="block font-black text-2xl md:text-3xl tracking-tight mb-1">บันทึกรายรับ</span><span className="text-[#DDFD54]/70 text-[10px] md:text-xs font-bold font-mono tracking-widest uppercase">Add Credit</span></div>
                </button>
                <button onClick={() => handleOpenModal('expense')} className="bg-white border-2 border-[#EAE3F4] p-6 md:p-10 rounded-[32px] md:rounded-[48px] flex flex-col justify-between items-start min-h-[160px] md:min-h-[220px] hover:-translate-y-2 transition-all duration-300 group shadow-md">
                  <div className="bg-[#F8F7FA] p-4 rounded-3xl text-[#AE88F9] group-hover:scale-110 transition-transform shadow-sm"><Minus size={28} /></div>
                  <div className="text-left"><span className="block font-black text-2xl md:text-3xl tracking-tight mb-1">บันทึกรายจ่าย</span><span className="text-[#AE88F9]/70 text-[10px] md:text-xs font-bold font-mono tracking-widest uppercase">Dec Debit</span></div>
                </button>
              </div>
            </div>

            {/* Sidebar Recent Activity */}
            <div className="lg:col-span-12 xl:col-span-4 bg-white rounded-[32px] md:rounded-[48px] shadow-xl flex flex-col h-fit lg:h-[750px] overflow-hidden border border-[#EAE3F4] animate-in slide-in-from-right-4 duration-500">
               <div className="p-8 border-b border-[#F8F7FA] flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 z-20">
                  <h3 className="font-black text-2xl tracking-tighter">กิจกรรมล่าสุด</h3>
                  <div className="flex gap-2">
                    <button onClick={syncWithGoogleSheets} className={`p-2.5 rounded-full hover:bg-[#F8F7FA] transition ${syncStatus === 'syncing' ? 'animate-spin' : ''}`}><RefreshCcw size={18} /></button>
                    <button onClick={() => setIsHistoryOpen(true)} className="text-sm font-black text-[#AE88F9] px-4 py-2 hover:bg-[#F8F7FA] rounded-full transition">ALL</button>
                  </div>
               </div>
               <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 custom-scrollbar">
                  {transactions.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-[#7A7585] py-20 opacity-30">
                      <FileText size={64} strokeWidth={1} />
                      <p className="font-bold mt-4">NO DATA FOUND</p>
                    </div>
                  ) : (
                    transactions.slice(0, 15).map(tx => (
                      <div key={tx.id} className="flex items-center justify-between p-4 bg-[#F8F7FA] rounded-[24px] hover:bg-[#F2EFF5] transition-all duration-300 relative group cursor-pointer border border-transparent hover:border-[#EAE3F4]">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transform group-hover:rotate-12 transition-transform ${tx.type === 'income' ? 'bg-[#DDFD54]' : 'bg-[#AE88F9] text-white'}`}>
                              {tx.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                           </div>
                           <div className="min-w-0">
                              <h4 className="font-black text-sm md:text-[15px] truncate text-[#1D1B20] leading-none mb-1">{tx.desc}</h4>
                              <p className="text-[10px] md:text-ts text-[#7A7585] truncate font-bold uppercase tracking-tight">{tx.party} • {tx.time}</p>
                           </div>
                        </div>
                        <div className="text-right ml-4">
                           <p className={`font-black text-sm md:text-base tracking-tighter ${tx.type === 'income' ? 'text-[#1D1B20]' : 'text-[#AE88F9]'}`}>
                              {tx.type === 'income' ? '+' : '-'} {tx.amount.toLocaleString()}
                           </p>
                        </div>
                      </div>
                    ))
                  )}
               </div>
            </div>
          </div>
        )}

        {/* Other tabs remain similar but styled consistently */}
        {activeTab === 'reports' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {/* Report Title */}
             <div className="flex justify-between items-end pt-4">
               <div>
                 <h2 className="text-4xl md:text-5xl font-black text-[#1D1B20] tracking-tighter">Finance Review</h2>
                 <p className="text-[#7A7585] font-bold mt-2">สรุปรายการรายสัปดาห์และรายเดือน</p>
               </div>
               <div className="bg-white p-1 rounded-full shadow-sm border border-[#EAE3F4] flex">
                 {['daily', 'weekly', 'monthly'].map(p => (
                   <button key={p} onClick={() => setReportPeriod(p)} className={`px-5 py-2 font-black text-xs rounded-full transition-all ${reportPeriod === p ? 'bg-[#1D1B20] text-[#DDFD54]' : 'text-[#7A7585]'}`}>
                     {p.toUpperCase()}
                   </button>
                 ))}
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border-2 border-[#EAE3F4] p-10 rounded-[48px] h-[450px] flex flex-col shadow-sm">
                   <h3 className="font-black text-2xl mb-8 flex items-center gap-2"><ArrowUpRight className="text-emerald-500" /> TOP INCOME</h3>
                   <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-2">
                      {breakdownData.income.items.map((it, idx) => (
                        <div key={idx} className="space-y-3">
                           <div className="flex justify-between font-black text-sm uppercase"><span>{it.name}</span><span>{formatCurrency(it.amount)}</span></div>
                           <div className="h-4 bg-[#F8F7FA] rounded-full overflow-hidden border border-[#EAE3F4]/50"><div className="h-full bg-[#DRLD54] bg-[#DDFD54] transition-all duration-1000" style={{ width: `${it.percent}%` }}></div></div>
                        </div>
                      ))}
                   </div>
                </div>
                <div className="bg-white border-2 border-[#EAE3F4] p-10 rounded-[48px] h-[450px] flex flex-col shadow-sm">
                   <h3 className="font-black text-2xl mb-8 flex items-center gap-2"><ArrowDownRight className="text-[#AE88F9]" /> TOP EXPENSE</h3>
                   <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-2">
                       {breakdownData.expense.items.map((it, idx) => (
                        <div key={idx} className="space-y-3">
                           <div className="flex justify-between font-black text-sm uppercase"><span>{it.name}</span><span>{formatCurrency(it.amount)}</span></div>
                           <div className="h-4 bg-[#F8F7FA] rounded-full overflow-hidden border border-[#EAE3F4]/50"><div className="h-full bg-[#AE88F9] transition-all duration-1000" style={{ width: `${it.percent}%` }}></div></div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="text-center pt-8">
               <h2 className="text-4xl font-black tracking-tighter">System Control</h2>
               <p className="text-[#7A7585] font-bold mt-2">จัดการหมวดหมู่และการเชื่อมต่อ Cloud</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#1D1B20] p-8 rounded-[48px] text-white shadow-2xl relative overflow-hidden">
                   <h3 className="font-black text-xl mb-6 relative z-10">CLOUD CONNECT</h3>
                   <div className="space-y-4 relative z-10">
                      <div className="bg-white/10 p-4 rounded-3xl border border-white/10">
                        <p className="text-[10px] font-black text-[#DDFD54] mb-1">GOOGLE SHEETS API URL</p>
                        <p className="text-xs truncate opacity-60 font-mono italic">{API_URL}</p>
                      </div>
                      <button onClick={syncWithGoogleSheets} className="w-full bg-[#DDFD54] text-[#1D1B20] py-4 rounded-3xl font-black text-sm hover:scale-[1.02] transition-transform">SYNC DATA NOW</button>
                      <button onClick={handleMigration} className="w-full bg-white/10 text-white py-4 rounded-3xl font-black text-sm border border-white/20 hover:bg-white/20">UPLOAD LOCAL TO CLOUD</button>
                   </div>
                   <div className="absolute top-0 right-0 w-32 h-32 bg-[#AE88F9]/30 rounded-full blur-3xl -mr-16 -mt-16"></div>
                </div>

                <div className="bg-white border-2 border-[#EAE3F4] p-8 rounded-[48px] shadow-sm">
                   <h3 className="font-black text-xl mb-6">DATA RESET</h3>
                   <div className="space-y-4">
                      <p className="text-xs text-[#7A7585] font-medium leading-relaxed">การล้างข้อมูลจะลบรายการในเมมโมรี่ของเบราว์เซอร์เท่านั้น ข้อมูลบน Google Sheets ของคุณจะยังคงปลอดภัย</p>
                      <button onClick={() => {if(window.confirm('Clear Cache?')) { localStorage.clear(); window.location.reload(); }}} className="w-full bg-rose-50 text-rose-500 py-4 rounded-3xl font-black text-sm border border-rose-100 hover:bg-rose-100">CLEAR LOCAL CACHE</button>
                   </div>
                </div>
             </div>

             {/* Categories Section */}
             <div className="bg-white border-2 border-[#EAE3F4] p-10 rounded-[48px] shadow-sm">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="font-black text-2xl tracking-tighter uppercase">Category Registry</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div>
                      <h4 className="font-black text-emerald-500 text-sm mb-4 flex items-center gap-2"><ArrowUpRight size={18} /> INCOME CATEGORIES</h4>
                      <div className="flex flex-wrap gap-2">
                        {categories.income.map(c => <div key={c} className="bg-[#F8F7FA] px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-2 border border-[#EAE3F4]">{c}<button onClick={() => handleDeleteCategory('income', c)} className="text-rose-400 hover:text-rose-600"><X size={14} /></button></div>)}
                        <button onClick={() => {setNewCategoryType('income'); setIsAddCategoryModalOpen(true);}} className="bg-[#DDFD54] px-4 py-2 rounded-2xl text-xs font-black">+ ADD</button>
                      </div>
                   </div>
                   <div>
                      <h4 className="font-black text-[#AE88F9] text-sm mb-4 flex items-center gap-2"><ArrowDownRight size={18} /> EXPENSE CATEGORIES</h4>
                      <div className="flex flex-wrap gap-2">
                        {categories.expense.map(c => <div key={c} className="bg-[#F8F7FA] px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-2 border border-[#EAE3F4]">{c}<button onClick={() => handleDeleteCategory('expense', c)} className="text-rose-400 hover:text-rose-600"><X size={14} /></button></div>)}
                        <button onClick={() => {setNewCategoryType('expense'); setIsAddCategoryModalOpen(true);}} className="bg-[#AE88F9] text-white px-4 py-2 rounded-2xl text-xs font-black">+ ADD</button>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}
      </main>

      {/* Sync/Loading Modal Overlay for Global Syncs */}
      {syncStatus === 'syncing' && activeTab === 'settings' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#1D1B20]/20 backdrop-blur-md">
           <div className="bg-white p-8 rounded-[40px] shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-200">
              <RefreshCcw size={48} className="text-[#AE88F9] animate-spin mb-4" />
              <p className="font-black text-lg">CLOUDSYNC IN PROGRESS</p>
           </div>
        </div>
      )}

      {/* Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4 bg-[#1D1B20]/60 backdrop-blur-sm transition-all animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-xl rounded-t-[40px] md:rounded-[56px] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-500">
              <div className={`p-8 md:p-12 flex justify-between items-center ${modalType === 'income' ? 'bg-[#DDFD54]' : 'bg-[#AE88F9] text-white'}`}>
                 <h2 className="text-3xl font-black uppercase tracking-tighter">NEW {modalType} Entry</h2>
                 <button onClick={() => setIsModalOpen(false)} className="bg-white/20 p-3 rounded-full hover:rotate-90 transition-transform"><X size={24} /></button>
              </div>
              <form onSubmit={handleFormSubmit} className="p-8 md:p-12 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase ml-1 opacity-50">Trans Date</label><input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-[#F8F7FA] p-5 rounded-3xl border-2 border-transparent focus:border-black transition outline-none font-bold" /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase ml-1 opacity-50">Category</label><select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-[#F8F7FA] p-5 rounded-3xl border-2 border-transparent focus:border-black transition outline-none font-bold appearance-none">{categories[modalType].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                 </div>
                 <div className="space-y-2"><label className="text-[10px] font-black uppercase ml-1 opacity-50">Party / Vendor</label><input type="text" placeholder="General Customer" value={formData.partyName} onChange={e => setFormData({...formData, partyName: e.target.value})} className="w-full bg-[#F8F7FA] p-5 rounded-3xl border-2 border-transparent focus:border-black transition outline-none font-bold" /></div>
                 <div className="space-y-2"><label className="text-[10px] font-black uppercase ml-1 opacity-50">Description</label><input type="text" placeholder="What's this for?" value={formData.itemName} onChange={e => setFormData({...formData, itemName: e.target.value})} className="w-full bg-[#F8F7FA] p-5 rounded-3xl border-2 border-transparent focus:border-black transition outline-none font-bold" /></div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase ml-1 opacity-50">Price/Unit</label><input type="number" placeholder="0.00" value={formData.unitPrice} onChange={e => setFormData({...formData, unitPrice: e.target.value})} className="w-full bg-[#F8F7FA] p-5 rounded-3xl border-2 border-transparent focus:border-black transition outline-none font-bold" /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase ml-1 opacity-50">Quantity</label><input type="number" placeholder="1" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="w-full bg-[#F8F7FA] p-4 rounded-3xl border-2 border-transparent focus:border-black transition outline-none font-bold" /></div>
                 </div>
                 <div className="p-8 bg-[#1D1B20] text-center rounded-[32px] shadow-xl">
                    <p className="text-[10px] font-black text-white/50 mb-1 uppercase tracking-widest">Grand Total Amount</p>
                    <h3 className="text-4xl font-black text-[#DDFD54]">{formatCurrency(parseFloat(formData.unitPrice) * parseFloat(formData.quantity) || 0)}</h3>
                 </div>
                 <button type="submit" disabled={syncStatus === 'syncing'} className={`w-full py-6 rounded-full text-xl font-black transition-all shadow-xl active:scale-[0.97] flex items-center justify-center gap-3 ${modalType === 'income' ? 'bg-[#DDFD54] text-[#1D1B20]' : 'bg-[#AE88F9] text-white'}`}>
                    {syncStatus === 'syncing' ? <RefreshCcw className="animate-spin" /> : <CloudUpload />} CONFIRM RECORD
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* Add Category Modal */}
      {isAddCategoryModalOpen && (
        <div className="fixed inset-0 bg-[#1D1B20]/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-sm rounded-[40px] p-10 shadow-2xl relative animate-in zoom-in-95 duration-300">
              <h3 className="text-2xl font-black tracking-tighter mb-8 uppercase">NEW {newCategoryType} ROLE</h3>
              <input type="text" autoFocus value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddCategory()} placeholder="Category Name..." className="w-full bg-[#F8F7FA] p-5 rounded-3xl border-2 border-[#EAE3F4] outline-none font-black text-sm focus:border-black mb-8" />
              <div className="flex gap-4">
                 <button onClick={() => setIsAddCategoryModalOpen(false)} className="flex-1 py-4 font-black text-rose-500 text-sm">CANCEL</button>
                 <button onClick={handleAddCategory} className="flex-1 bg-[#1D1B20] text-white py-4 rounded-2xl font-black text-sm active:scale-[0.95] transition-transform">ADD NOW</button>
              </div>
           </div>
        </div>
      )}

      {/* Full History Overlay */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-[150] bg-white animate-in slide-in-from-bottom duration-500 flex flex-col selection:bg-black selection:text-white">
           <div className="p-6 md:p-10 border-b border-[#F8F7FA] flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-20">
              <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase">Full Statement</h2>
              <button onClick={() => setIsHistoryOpen(false)} className="bg-[#F8F7FA] p-4 rounded-full text-[#1D1B20] hover:scale-110 shadow-sm transition-transform"><X size={32} /></button>
           </div>
           <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-6">
              <div className="max-w-4xl mx-auto space-y-4">
                 {transactions.map(tx => (
                    <div key={tx.id} className="flex items-center justify-between p-6 bg-white border-2 border-[#F2EFF5] rounded-[32px] hover:scale-[1.01] transition-transform">
                       <div className="flex items-center gap-6">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black ${tx.type === 'income' ? 'bg-[#DDFD54]' : 'bg-[#AE88F9] text-white'}`}>
                             {tx.type === 'income' ? <ArrowUpRight /> : <ArrowDownRight />}
                          </div>
                          <div>
                            <p className="font-black text-lg md:text-xl leading-none mb-1">{tx.desc}</p>
                            <p className="text-xs uppercase font-extrabold text-[#7A7585] tracking-widest">{tx.date} • {tx.party}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className={`text-xl md:text-2xl font-black tracking-tighter ${tx.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                             {tx.type === 'income' ? '+' : '-'} {tx.amount.toLocaleString()}
                          </p>
                       </div>
                    </div>
                 ))}
                 {transactions.length === 0 && <p className="text-center py-20 font-black opacity-20">NO TRANSACTION HISTORY</p>}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

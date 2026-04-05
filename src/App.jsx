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
  TEAM_MEMBERS: 'wtr_ledger_team_members'
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
      if (Array.isArray(txData)) {
        const sanitized = txData.map(t => ({
          ...t,
          amount: parseFloat(t.amount) || 0,
          date: t.date && t.date.toString().startsWith("1899") ? new Date().toISOString().split('T')[0] : (t.date ? t.date.toString().split('T')[0] : new Date().toISOString().split('T')[0])
        }));
        setTransactions(sanitized);
      }

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
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      setSyncStatus('error');
    }
  }, [isOnline]);

  useEffect(() => { syncWithGoogleSheets(); }, [syncWithGoogleSheets]);

  // Calculations
  const totals = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const breakdownData = useMemo(() => {
    const calc = (type) => {
      const filtered = transactions.filter(t => t.type === type);
      const total = filtered.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
      const categoryMap = {};
      filtered.forEach(t => {
          const cat = t.category || 'อื่นๆ';
          categoryMap[cat] = (categoryMap[cat] || 0) + (parseFloat(t.amount) || 0);
      });
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
    const finalAmount = (parseFloat(formData.unitPrice) * parseFloat(formData.quantity)) || parseFloat(formData.totalAmount);
    if (!finalAmount || finalAmount <= 0) return;

    setSyncStatus('syncing');
    let receiptUrls = "";

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
      receiptUrl: receiptUrls
    };

    setTransactions([newTx, ...transactions]);
    setIsModalOpen(false);

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
    if (window.confirm(`ยืนยันการลบหมวดหมู่: ${cat}?`)) {
       setCategories(prev => ({ ...prev, [type]: prev[type].filter(c => c !== cat) }));
    }
  };

  const handleMigration = async () => {
    if (!window.confirm('คุณต้องการอัปโหลดข้อมูลทั้งหมดขึ้นระบบคลาวด์ (Google Sheets) ใช่หรือไม่?')) return;
    if (!isOnline) return alert('กรุณาเชื่อมต่ออินเทอร์เน็ตก่อนทำรายการ');
    setSyncStatus('syncing');
    try {
      for (const tx of transactions) {
        await fetch(API_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action: 'addTransaction', payload: tx }) });
      }
      alert(`อัปโหลดสำเร็จจำนวน ${transactions.length} รายการ`);
      setSyncStatus('success');
    } catch (e) { setSyncStatus('error'); }
  };

  const formatCurrency = (val) => `฿${(parseFloat(val) || 0).toLocaleString()}`;

  return (
    <div className="min-h-screen bg-[#F8F7FA] text-[#1D1B20] font-sans flex flex-col selection:bg-[#DDFD54] selection:text-[#1D1B20]">
      <input type="file" multiple accept="image/*" capture="environment" ref={fileInputRef} onChange={handleImageSelect} className="hidden" />

      {/* Floating Navbar */}
      <nav className="px-3 md:px-8 py-3 md:py-5 w-full sticky top-0 z-50 bg-[#F8F7FA]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto bg-white rounded-full px-4 md:px-6 py-2.5 md:py-3 flex justify-between items-center shadow-lg border border-[#EAE3F4]/50 z-50">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 text-[#1D1B20]" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex items-center gap-2">
              <Sparkles className="text-[#AE88F9] hidden xs:block" size={20} />
              <h1 className="font-black text-lg md:text-xl tracking-tighter">WTR<span className="text-[#AE88F9]">.</span></h1>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-2 absolute left-1/2 -translate-x-1/2 bg-[#F8F7FA] p-1 rounded-full border border-[#EAE3F4]/50">
            {[
              { id: 'dashboard', label: 'ภาพรวม', icon: Home },
              { id: 'reports', label: 'รายงาน', icon: PieChart },
              { id: 'settings', label: 'ตั้งค่า', icon: Settings }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 font-black px-5 py-2.5 rounded-full transition-all ${activeTab === tab.id ? 'bg-white text-[#1D1B20] shadow-sm' : 'text-[#7A7585] hover:text-[#1D1B20]'}`}>
                <tab.icon size={18} /> {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 md:gap-3">
             <div className={`p-1.5 md:p-2 rounded-full flex items-center gap-2 ${syncStatus === 'syncing' ? 'bg-amber-50 text-amber-500 animate-pulse' : 'bg-green-50 text-emerald-500'}`}>
               {isOnline ? (syncStatus === 'syncing' ? <RefreshCcw size={16} className="animate-spin" /> : <Wifi size={16} />) : <WifiOff size={16} />}
             </div>
             <div className="w-8 h-8 md:w-10 md:h-10 bg-[#DDFD54] rounded-full flex items-center justify-center font-black text-[10px] shadow-sm">WTR</div>
          </div>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-[#1D1B20]/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="absolute top-[80px] left-3 right-3 bg-white rounded-[32px] p-4 flex flex-col gap-2">
            {[
              { id: 'dashboard', label: 'หน้าแรก / ภาพรวม', icon: Home },
              { id: 'reports', label: 'รายงานรายรับ-จ่าย', icon: PieChart },
              { id: 'settings', label: 'ตั้งค่าข้อมูลอู่', icon: Settings }
            ].map(tab => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setIsMobileMenuOpen(false); }} className={`flex items-center gap-4 font-black p-4 rounded-[24px] ${activeTab === tab.id ? 'bg-[#DDFD54]' : 'text-[#7A7585]'}`}>
                 <tab.icon size={20} />
                 {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 animate-in fade-in duration-500">
             <div className="lg:col-span-8 space-y-6 md:space-y-8">
                <div className="pt-2 md:pt-4">
                  <h2 className="text-3xl md:text-6xl font-black tracking-tighter text-[#1D1B20] leading-none">ระบบบัญชีอู่<br/><span className="text-[#AE88F9]">WTR Ledger.</span></h2>
                  <p className="text-[#7A7585] font-black mt-3 md:mt-6 uppercase tracking-widest text-[9px] md:text-xs">จัดการข้อมูลรายรับ-รายจ่ายผ่านระบบคลาวด์อัตโนมัติ</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                   <div className="md:col-span-2 bg-[#AE88F9] p-6 md:p-10 rounded-[32px] md:rounded-[56px] text-white shadow-2xl relative overflow-hidden group">
                      <p className="text-white/60 font-black text-[9px] md:text-xs uppercase tracking-widest mb-1 md:mb-2">ยอดเงินคงเหลือสุทธิ</p>
                      <h3 className="text-4xl md:text-7xl font-black tracking-tighter truncate">{formatCurrency(totals.balance)}</h3>
                      <div className="absolute top-0 right-0 w-32 md:w-48 h-32 md:h-48 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                   </div>
                   <div className="bg-[#DDFD54] p-6 md:p-10 rounded-[32px] md:rounded-[56px] flex flex-col justify-between shadow-sm">
                      <div className="w-8 h-8 md:w-12 md:h-12 bg-white/40 rounded-full flex items-center justify-center"><ArrowUpRight size={20} /></div>
                      <div><p className="text-black/60 font-black text-[9px] md:text-xs uppercase tracking-widest mb-1">รายรับรวม</p><h4 className="text-xl md:text-2xl font-black truncate">{formatCurrency(totals.income)}</h4></div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4 md:gap-6">
                   <button onClick={() => handleOpenModal('income')} className="bg-[#1D1B20] text-white p-6 md:p-12 rounded-[32px] md:rounded-[56px] flex flex-col justify-between min-h-[140px] md:min-h-[220px] shadow-2xl hover:scale-[1.02] transition-transform">
                      <div className="bg-[#333038] p-3 md:p-4 rounded-2xl md:rounded-3xl text-[#DDFD54] w-fit shadow-lg"><Plus size={24} /></div>
                      <div className="text-left font-black text-lg md:text-3xl tracking-tighter uppercase">+ บันทึกรายรับ</div>
                   </button>
                   <button onClick={() => handleOpenModal('expense')} className="bg-white border-2 border-[#EAE3F4] p-6 md:p-12 rounded-[32px] md:rounded-[56px] flex flex-col justify-between min-h-[140px] md:min-h-[220px] shadow-md hover:scale-[1.02] transition-transform">
                      <div className="bg-[#F8F7FA] p-3 md:p-4 rounded-2xl md:rounded-3xl text-[#AE88F9] w-fit shadow-sm"><Minus size={24} /></div>
                      <div className="text-left font-black text-lg md:text-3xl tracking-tighter uppercase">- บันทึกรายจ่าย</div>
                   </button>
                </div>
             </div>

             <div className="lg:col-span-4 bg-white rounded-[32px] md:rounded-[56px] shadow-2xl flex flex-col h-[600px] lg:h-[750px] overflow-hidden border border-[#EAE3F4] animate-in slide-in-from-right-8 duration-700">
                <div className="p-6 md:p-10 border-b border-[#F8F7FA] flex justify-between items-center">
                   <h3 className="font-black text-lg md:text-2xl tracking-tighter uppercase">รายการล่าสุด</h3>
                   <button onClick={() => setIsHistoryOpen(true)} className="text-[#AE88F9] font-black text-xs md:text-sm">ดูทั้งหมด</button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
                   {transactions.map(tx => (
                     <div key={tx.id} className="flex items-center justify-between p-4 md:p-5 bg-[#F8F7FA] rounded-[24px] md:rounded-[32px] hover:bg-[#F2EFF5] transition-all group">
                        <div className="flex items-center gap-3 md:gap-4 min-w-0">
                           <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 ${tx.type === 'income' ? 'bg-[#DDFD54]' : 'bg-[#AE88F9] text-white'}`}>
                              {tx.receiptUrl ? <ImageIcon size={20} /> : (tx.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />)}
                           </div>
                           <div className="truncate">
                              <p className="font-black text-xs md:text-[15px] truncate text-[#1D1B20] leading-none mb-1">{tx.desc}</p>
                              <p className="text-[9px] md:text-[10px] font-black text-[#7A7585] uppercase tracking-tighter">{tx.party} • {tx.time}</p>
                           </div>
                        </div>
                        <p className={`font-black text-xs md:text-base tracking-tighter ${tx.type === 'income' ? 'text-[#1D1B20]' : 'text-[#AE88F9]'}`}>{formatCurrency(tx.amount)}</p>
                     </div>
                   ))}
                   {transactions.length === 0 && <div className="h-full flex items-center justify-center text-[#7A7585] font-black opacity-30 uppercase">ยังไม่มีข้อมูล</div>}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex justify-between items-end pt-4">
               <div>
                 <h2 className="text-3xl md:text-5xl font-black text-[#1D1B20] tracking-tighter">รายงานยอดเงิน</h2>
                 <p className="text-[#7A7585] text-xs md:text-sm font-bold mt-2">สรุปรายการรายรับ-จ่ายตามหมวดหมู่</p>
               </div>
               <div className="bg-white p-1 rounded-full shadow-sm border border-[#EAE3F4] flex">
                 {[
                   {id: 'daily', label: 'รายวัน'},
                   {id: 'weekly', label: 'สัปดาห์'},
                   {id: 'monthly', label: 'เดือน'}
                 ].map(p => (
                   <button key={p.id} onClick={() => setReportPeriod(p.id)} className={`px-3 md:px-5 py-1.5 md:py-2 font-black text-[10px] md:text-xs rounded-full transition-all ${reportPeriod === p.id ? 'bg-[#1D1B20] text-[#DDFD54]' : 'text-[#7A7585]'}`}>
                     {p.label}
                   </button>
                 ))}
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border-2 border-[#EAE3F4] p-6 md:p-10 rounded-[32px] md:rounded-[48px] h-[350px] md:h-[450px] flex flex-col shadow-sm">
                   <h3 className="font-black text-lg md:text-2xl mb-6 md:mb-8 flex items-center gap-2"><ArrowUpRight className="text-emerald-500" /> สัดส่วนรายรับ</h3>
                   <div className="flex-1 space-y-4 md:space-y-6 overflow-y-auto custom-scrollbar pr-2">
                      {breakdownData.income.items.map((it, idx) => (
                        <div key={idx} className="space-y-2 md:space-y-3">
                           <div className="flex justify-between font-black text-[10px] md:text-sm uppercase"><span>{it.name}</span><span>{formatCurrency(it.amount)}</span></div>
                           <div className="h-3 md:h-4 bg-[#F8F7FA] rounded-full overflow-hidden border border-[#EAE3F4]/50"><div className="h-full bg-[#DDFD54] transition-all duration-1000" style={{ width: `${it.percent}%` }}></div></div>
                        </div>
                      ))}
                      {breakdownData.income.items.length === 0 && <p className="text-center py-20 text-[#7A7585] font-black opacity-30">ยังไม่มีข้อมูลรายรับ</p>}
                   </div>
                </div>
                <div className="bg-white border-2 border-[#EAE3F4] p-6 md:p-10 rounded-[32px] md:rounded-[48px] h-[350px] md:h-[450px] flex flex-col shadow-sm">
                   <h3 className="font-black text-lg md:text-2xl mb-6 md:mb-8 flex items-center gap-2"><ArrowDownRight className="text-[#AE88F9]" /> สัดส่วนรายจ่าย</h3>
                   <div className="flex-1 space-y-4 md:space-y-6 overflow-y-auto custom-scrollbar pr-2">
                       {breakdownData.expense.items.map((it, idx) => (
                        <div key={idx} className="space-y-2 md:space-y-3">
                           <div className="flex justify-between font-black text-[10px] md:text-sm uppercase"><span>{it.name}</span><span>{formatCurrency(it.amount)}</span></div>
                           <div className="h-3 md:h-4 bg-[#F8F7FA] rounded-full overflow-hidden border border-[#EAE3F4]/50"><div className="h-full bg-[#AE88F9] transition-all duration-1000" style={{ width: `${it.percent}%` }}></div></div>
                        </div>
                      ))}
                      {breakdownData.expense.items.length === 0 && <p className="text-center py-20 text-[#7A7585] font-black opacity-30">ยังไม่มีข้อมูลรายจ่าย</p>}
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500">
             <div className="text-center pt-4 md:pt-8 px-4">
               <h2 className="text-2xl md:text-4xl font-black tracking-tighter">จัดการระบบอู่</h2>
               <p className="text-[#7A7585] font-bold mt-2 text-xs md:text-sm">จัดการหมวดหมู่และการเชื่อมต่อข้อมูล Cloud</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="bg-[#1D1B20] p-8 md:p-10 rounded-[32px] md:rounded-[48px] text-white shadow-2xl relative overflow-hidden">
                   <h3 className="font-black text-lg md:text-xl mb-6 relative z-10 uppercase">Cloud Connection</h3>
                   <div className="space-y-4 relative z-10">
                      <div className="bg-white/10 p-4 rounded-3xl border border-white/10">
                        <p className="text-[9px] font-black text-[#DDFD54] mb-1 uppercase">Google Sheets API URL</p>
                        <p className="text-[10px] truncate opacity-60 font-mono italic">{API_URL}</p>
                      </div>
                      <button onClick={syncWithGoogleSheets} className="w-full bg-[#DDFD54] text-[#1D1B20] py-3 md:py-4 rounded-2xl md:rounded-3xl font-black text-xs md:text-sm hover:scale-[1.02] transition-transform">ดึงข้อมูลจาก Cloud เดี๋ยวนี้</button>
                      <button onClick={handleMigration} className="w-full bg-white/10 text-white py-3 md:py-4 rounded-2xl md:rounded-3xl font-black text-xs md:text-sm border border-white/20 hover:bg-white/20">อัปโหลดข้อมูลในเครื่องขึ้น Cloud</button>
                   </div>
                   <div className="absolute top-0 right-0 w-32 h-32 bg-[#AE88F9]/30 rounded-full blur-3xl -mr-16 -mt-16"></div>
                </div>

                <div className="bg-white border-2 border-[#EAE3F4] p-8 md:p-10 rounded-[32px] md:rounded-[48px] shadow-sm">
                   <h3 className="font-black text-lg md:text-xl mb-6">จัดการหน่วยความจำ</h3>
                   <div className="space-y-4">
                      <p className="text-[10px] text-[#7A7585] font-medium leading-relaxed">การล้างข้อมูลจะลบเฉพาะข้อมูลที่พักไว้ในเบราว์เซอร์เท่านั้น ข้อมูลบน Google Sheets ของคุณจะยังคงปลอดภัย ไม่หายไปไหนครับ</p>
                      <button onClick={() => {if(window.confirm('คุณต้องการล้าง Cache ในเครื่องใช่หรือไม่?')) { localStorage.clear(); window.location.reload(); }}} className="w-full bg-rose-50 text-rose-500 py-3 md:py-4 rounded-2xl md:rounded-3xl font-black text-xs md:text-sm border border-rose-100 hover:bg-rose-100">ล้างข้อมูลในเครื่อง (Clear Cache)</button>
                   </div>
                </div>
             </div>

             <div className="bg-white border-2 border-[#EAE3F4] p-8 md:p-10 rounded-[32px] md:rounded-[48px] shadow-sm">
                <div className="mb-8">
                  <h3 className="font-black text-xl md:text-2xl tracking-tighter uppercase">จัดการหมวดหมู่รายการ</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                   <div>
                      <h4 className="font-black text-emerald-500 text-[10px] md:text-xs mb-4 tracking-widest uppercase flex items-center gap-2"><ArrowUpRight size={18} /> หมวดหมู่รายรับ</h4>
                      <div className="flex flex-wrap gap-2">
                        {categories.income.map(c => <div key={c} className="bg-[#F8F7FA] px-3 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-2xl text-[9px] md:text-xs font-black flex items-center gap-2 border border-[#EAE3F4]">{c}<button onClick={() => handleDeleteCategory('income', c)} className="text-rose-400 hover:text-rose-600"><X size={14} /></button></div>)}
                        <button onClick={() => {setNewCategoryType('income'); setIsAddCategoryModalOpen(true);}} className="bg-[#DDFD54] px-3 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-2xl text-[9px] md:text-xs font-black">+ เพิ่ม</button>
                      </div>
                   </div>
                   <div>
                      <h4 className="font-black text-[#AE88F9] text-[10px] md:text-xs mb-4 tracking-widest uppercase flex items-center gap-2"><ArrowDownRight size={18} /> หมวดหมู่รายจ่าย</h4>
                      <div className="flex flex-wrap gap-2">
                        {categories.expense.map(c => <div key={c} className="bg-[#F8F7FA] px-3 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-2xl text-[9px] md:text-xs font-black flex items-center gap-2 border border-[#EAE3F4]">{c}<button onClick={() => handleDeleteCategory('expense', c)} className="text-rose-400 hover:text-rose-600"><X size={14} /></button></div>)}
                        <button onClick={() => {setNewCategoryType('expense'); setIsAddCategoryModalOpen(true);}} className="bg-[#AE88F9] text-white px-3 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-2xl text-[9px] md:text-xs font-black">+ เพิ่ม</button>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}
      </main>

      {/* Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-2 md:p-4 bg-[#1D1B20]/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-xl rounded-t-[32px] md:rounded-[64px] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-500 max-h-[90vh]">
              <div className={`p-6 md:p-14 flex justify-between items-center ${modalType === 'income' ? 'bg-[#DDFD54]' : 'bg-[#AE88F9] text-white'}`}>
                 <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter leading-none">บันทึกรายการใหม่<br/><span className="text-sm md:text-2xl opacity-60">ระบุ{modalType === 'income' ? 'รายรับ' : 'รายจ่าย'}</span></h2>
                 <button onClick={() => setIsModalOpen(false)} className="bg-white/20 p-2 md:p-4 rounded-full active:rotate-90 transition-transform"><X size={20} /></button>
              </div>
              <form onSubmit={handleFormSubmit} className="p-6 md:p-12 space-y-4 md:space-y-6 overflow-y-auto custom-scrollbar">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 md:space-y-2"><label className="text-[9px] md:text-[10px] font-black uppercase opacity-40 ml-1">วันที่ทำรายการ</label><input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-[#F8F7FA] p-4 md:p-5 rounded-2xl md:rounded-3xl outline-none font-black text-sm" /></div>
                    <div className="space-y-1.5 md:space-y-2"><label className="text-[9px] md:text-[10px] font-black uppercase opacity-40 ml-1">หมวดหมู่</label><select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-[#F8F7FA] p-4 md:p-5 rounded-2xl md:rounded-3xl outline-none font-black text-sm appearance-none">{categories[modalType].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                 </div>
                 <div className="space-y-1.5 md:space-y-2"><label className="text-[9px] md:text-[10px] font-black uppercase opacity-40 ml-1">{modalType === 'income' ? 'รับเงินจาก (ลูกค้า/บริษัท)' : 'จ่ายเงินให้ (ร้านค้า/ผู้ขาย)'}</label>
                 <input type="text" placeholder="ระบุชื่อ..." value={formData.partyName} onChange={e => setFormData({...formData, partyName: e.target.value})} className="w-full bg-[#F8F7FA] p-5 md:p-6 rounded-2xl md:rounded-[24px] outline-none font-black text-xs md:text-sm focus:border-black border-2 border-transparent transition" /></div>
                 
                 <div className="space-y-1.5 md:space-y-2"><label className="text-[9px] md:text-[10px] font-black uppercase opacity-40 ml-1">รายละเอียดรายการ</label>
                 <input type="text" placeholder="พิมพ์ชื่อรายการหรือสินค้า..." value={formData.itemName} onChange={e => setFormData({...formData, itemName: e.target.value})} className="w-full bg-[#F8F7FA] p-5 md:p-6 rounded-2xl md:rounded-[24px] outline-none font-black text-xs md:text-sm focus:border-black border-2 border-transparent transition" /></div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 md:space-y-2"><label className="text-[9px] md:text-[10px] font-black uppercase opacity-40 ml-1">ราคาต่อหน่วย</label><input type="number" placeholder="0.00" value={formData.unitPrice} onChange={e => setFormData({...formData, unitPrice: e.target.value})} className="w-full bg-[#F8F7FA] p-5 md:p-6 rounded-2xl md:rounded-3xl outline-none font-black text-xs md:text-sm" /></div>
                    <div className="space-y-1.5 md:space-y-2"><label className="text-[9px] md:text-[10px] font-black uppercase opacity-40 ml-1">จำนวน</label><input type="number" placeholder="1" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="w-full bg-[#F8F7FA] p-5 md:p-6 rounded-2xl md:rounded-3xl outline-none font-black text-xs md:text-sm" /></div>
                 </div>

                 <div className="space-y-1.5 md:space-y-2">
                    <label className="text-[9px] md:text-[10px] font-black uppercase opacity-40 ml-1">ช่องทางการชำระเงิน</label>
                    <div className="grid grid-cols-2 gap-3">
                       <button type="button" onClick={() => setFormData({...formData, paymentMethod: 'cash'})} className={`py-4 rounded-2xl font-black text-xs md:text-sm border-2 transition-all flex items-center justify-center gap-2 ${formData.paymentMethod === 'cash' ? 'bg-[#1D1B20] text-[#DDFD54] border-[#1D1B20] shadow-lg scale-[1.02]' : 'bg-white text-[#7A7585] border-[#EAE3F4]'}`}><Wallet size={16} /> เงินสด</button>
                       <button type="button" onClick={() => setFormData({...formData, paymentMethod: 'transfer'})} className={`py-4 rounded-2xl font-black text-xs md:text-sm border-2 transition-all flex items-center justify-center gap-2 ${formData.paymentMethod === 'transfer' ? 'bg-[#1D1B20] text-[#DDFD54] border-[#1D1B20] shadow-lg scale-[1.02]' : 'bg-white text-[#7A7585] border-[#EAE3F4]'}`}><ArrowRightLeft size={16} /> เงินโอน</button>
                    </div>
                 </div>
                 
                 <div className="space-y-3">
                    <label className="text-[9px] md:text-[10px] font-black uppercase opacity-40 ml-1">แนบรูปภาพ (ใบเสร็จ/สลิป)</label>
                    <div className="flex flex-wrap gap-2">
                       {selectedImages.map(img => (
                          <div key={img.id} className="relative w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl overflow-hidden shadow-md group">
                             <img src={img.preview} alt="Receipt" className="w-full h-full object-cover" />
                             <button type="button" onClick={() => removeImage(img.id)} className="absolute top-1 right-1 bg-white/80 p-1 rounded-full text-rose-500 shadow-sm opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                <X size={12} />
                             </button>
                          </div>
                       ))}
                       <button type="button" onClick={() => fileInputRef.current?.click()} className="w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl border-2 border-dashed border-[#EAE3F4] flex flex-col items-center justify-center text-[#7A7585] hover:bg-[#F8F7FA] transition active:scale-95">
                          <Camera size={20} />
                          <span className="text-[8px] md:text-[9px] font-black mt-1">เพิ่มรูป</span>
                       </button>
                    </div>
                 </div>

                 <div className="p-6 md:p-8 bg-[#1D1B20] text-center rounded-[24px] md:rounded-[32px] shadow-2xl">
                    <p className="text-[9px] md:text-[10px] font-black text-white/50 mb-1 uppercase tracking-widest">ยอดชำระเงินรวม</p>
                    <h3 className="text-2xl md:text-4xl font-black text-[#DDFD54]">{formatCurrency((parseFloat(formData.unitPrice) * parseFloat(formData.quantity)) || 0)}</h3>
                 </div>
                 <button type="submit" disabled={syncStatus === 'syncing'} className={`w-full py-5 md:py-8 rounded-full text-lg md:text-xl font-black transition-all shadow-2xl active:scale-[0.98] flex items-center justify-center gap-3 ${modalType === 'income' ? 'bg-[#DDFD54] text-[#1D1B20]' : 'bg-[#AE88F9] text-white'}`}>
                    {syncStatus === 'syncing' ? <RefreshCcw className="animate-spin" /> : <CloudUpload />} {syncStatus === 'syncing' ? 'กำลังบันทึกข้อมูล...' : 'ยืนยันการบันทึกรายการ'}
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* Categories Add Modal */}
      {isAddCategoryModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-[#1D1B20]/40 backdrop-blur-md">
           <div className="bg-white p-8 md:p-10 rounded-[32px] md:rounded-[48px] w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
              <h3 className="text-xl md:text-2xl font-black mb-6 uppercase tracking-tighter">เพิ่มหมวดหมู่{newCategoryType === 'income' ? 'รายรับ' : 'รายจ่าย'}</h3>
              <input type="text" autoFocus value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddCategory()} placeholder="กรอกชื่อหมวดหมู่..." className="w-full bg-[#F8F7FA] p-5 rounded-2xl md:rounded-3xl outline-none font-black text-sm mb-6" />
              <button onClick={handleAddCategory} className="w-full bg-[#1D1B20] text-white py-4 rounded-2xl font-black tracking-widest">เพิ่มข้อมูล</button>
              <button onClick={() => setIsAddCategoryModalOpen(false)} className="w-full mt-4 text-[#7A7585] font-black text-sm">ยกเลิก</button>
           </div>
        </div>
      )}

      {/* History Window */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-[150] bg-white animate-in slide-in-from-bottom duration-500 flex flex-col">
           <div className="p-6 md:p-10 border-b border-[#F8F7FA] flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-20">
              <h2 className="text-2xl md:text-5xl font-black tracking-tighter uppercase">สมุดบัญชีทั้งหมด</h2>
              <button onClick={() => setIsHistoryOpen(false)} className="bg-[#F8F7FA] p-3 md:p-4 rounded-full text-[#1D1B20] hover:scale-110 shadow-sm transition-transform"><X size={24} /></button>
           </div>
           <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-3">
              <div className="max-w-4xl mx-auto space-y-3">
                 {transactions.map(tx => (
                    <div key={tx.id} className="flex items-center justify-between p-5 md:p-6 bg-white border-2 border-[#F2EFF5] rounded-[24px] md:rounded-[32px] hover:scale-[1.01] transition-transform shadow-sm">
                       <div className="flex items-center gap-4 md:gap-6 min-w-0">
                          <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center font-black shrink-0 ${tx.type === 'income' ? 'bg-[#DDFD54]' : 'bg-[#AE88F9] text-white'}`}>
                             {tx.receiptUrl ? <ImageIcon size={20} /> : (tx.type === 'income' ? <ArrowUpRight size={20}/> : <ArrowDownRight size={20}/>)}
                          </div>
                          <div className="truncate">
                            <p className="font-black text-sm md:text-xl leading-none mb-1 truncate">{tx.desc}</p>
                            <p className="text-[9px] md:text-xs uppercase font-extrabold text-[#7A7585] tracking-widest">{tx.date} • {tx.party}</p>
                          </div>
                       </div>
                       <div className="text-right ml-4">
                          <p className={`text-sm md:text-2xl font-black tracking-tighter ${tx.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                             {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                          </p>
                       </div>
                    </div>
                  ))}
                 {transactions.length === 0 && <p className="text-center py-20 font-black opacity-20">ยังไม่มีรายการบันทึกในประวัติ</p>}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

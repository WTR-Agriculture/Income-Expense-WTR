import React, { useState, useEffect } from 'react';
import { 
  Plus, Minus, Wallet, 
  FileText, ArrowRightLeft, Camera, X, 
  Calendar, Briefcase, Tag, Receipt,
  Menu, Sparkles, ArrowUpRight, ArrowDownRight,
  Home, PieChart, Settings, Search, Filter,
  Download, TrendingUp, TrendingDown, ChevronDown, List,
  Building2, Users, Database, Trash2, Bell, Shield, LogOut
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('expense');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  // State สำหรับเปิด/ปิด หน้าต่างรายละเอียดสัดส่วน
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
  const [breakdownType, setBreakdownType] = useState('income'); 
  
  // State สำหรับหน้าต่างเพิ่มผู้ใช้งาน
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserRole, setNewUserRole] = useState('staff');
  
  // State สำหรับกรองช่วงเวลาในหน้ารายงาน
  const [reportPeriod, setReportPeriod] = useState('monthly');
  
  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    partyName: '',
    itemName: '',
    unitPrice: '',
    quantity: '1',
    totalAmount: '',
    category: '',
    paymentMethod: 'cash',
    refJob: '',
  });

  // Mock Data
  const [transactions, setTransactions] = useState([
    { id: 1, type: 'income', date: '2026-04-05', party: 'บจก. มารีน', desc: 'มัดจำงานต่อเรือ 30%', amount: 150000, method: 'transfer', time: '10:30', category: 'งานต่อเรือ' },
    { id: 2, type: 'expense', date: '2026-04-05', party: 'ร้านฮาร์ดแวร์เจริญ', desc: 'ท่อสแตนเลส 304', amount: 12500, method: 'transfer', time: '11:15', category: 'ค่าวัสดุ/อุปกรณ์' },
    { id: 3, type: 'expense', date: '2026-04-05', party: 'ร้านป้าสมหมาย', desc: 'ข้าวกล่องช่าง', amount: 450, method: 'cash', time: '12:00', category: 'ค่าของกิน' },
    { id: 4, type: 'expense', date: '2026-04-04', party: 'การไฟฟ้าส่วนภูมิภาค', desc: 'ค่าไฟโรงงาน', amount: 8500, method: 'transfer', time: '09:00', category: 'ค่าน้ำ/ค่าไฟ' },
    { id: 5, type: 'income', date: '2026-04-04', party: 'ลูกค้าหน้าร้าน', desc: 'ขายเศษเหล็ก', amount: 1200, method: 'cash', time: '08:45', category: 'ขายเศษวัสดุ' },
    { id: 6, type: 'expense', date: '2026-04-03', party: 'ปั๊ม ปตท.', desc: 'ค่าน้ำมันรถกระบะอู่', amount: 1500, method: 'cash', time: '15:30', category: 'อื่นๆ' },
    { id: 7, type: 'income', date: '2026-04-02', party: 'บจก. เลเซอร์เทค', desc: 'ค่าตัดเลเซอร์แผ่นสแตนเลส', amount: 28000, method: 'transfer', time: '14:00', category: 'งานตัดเลเซอร์' },
  ]);

  // Mock Data สำหรับรายละเอียดสัดส่วนแบบเต็ม
  const fullBreakdownData = {
    income: {
      total: 179200,
      items: [
        { name: 'งานต่อเรือ', amount: 150000, percent: 83.7, color: '#DDFD54' },
        { name: 'งานตัดเลเซอร์', amount: 28000, percent: 15.6, color: '#1D1B20' },
        { name: 'ขายเศษวัสดุ', amount: 1200, percent: 0.7, color: '#AE88F9' },
      ]
    },
    expense: {
      total: 25750,
      items: [
        { name: 'ค่าวัสดุ/อุปกรณ์', amount: 12500, percent: 48.5, color: '#1D1B20' },
        { name: 'ค่าน้ำ/ค่าไฟ', amount: 8500, percent: 33.0, color: '#AE88F9' },
        { name: 'ค่าเครื่องมือช่าง', amount: 2800, percent: 10.9, color: '#7A7585' },
        { name: 'อื่นๆ (น้ำมันรถ)', amount: 1500, percent: 5.8, color: '#EAE3F4' },
        { name: 'ค่าของกิน', amount: 450, percent: 1.8, color: '#DDFD54' },
      ]
    }
  };

  // Auto calculate total
  useEffect(() => {
    if (formData.unitPrice && formData.quantity) {
      const total = parseFloat(formData.unitPrice) * parseFloat(formData.quantity);
      setFormData(prev => ({ ...prev, totalAmount: total.toString() }));
    } else if (!formData.unitPrice) {
      setFormData(prev => ({ ...prev, totalAmount: '' }));
    }
  }, [formData.unitPrice, formData.quantity]);

  const handleOpenModal = (type) => {
    setModalType(type);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      partyName: '',
      itemName: '',
      unitPrice: '',
      quantity: '1',
      totalAmount: '',
      category: '',
      paymentMethod: 'cash',
      refJob: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenBreakdown = (type) => {
    setBreakdownType(type);
    setIsBreakdownOpen(true);
  };

  const [categories, setCategories] = useState({
    expense: ['ค่าวัสดุ/อุปกรณ์', 'ค่าน้ำ/ค่าไฟ', 'ค่าของกิน', 'ค่าเครื่องมือ', 'อื่นๆ'],
    income: ['งานต่อเรือ', 'งานตัดเลเซอร์', 'งานประกอบท่อ', 'ขายเศษวัสดุ', 'อื่นๆ']
  });

  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [newCategoryType, setNewCategoryType] = useState('income');
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleOpenAddCategory = (type) => {
    setNewCategoryType(type);
    setNewCategoryName('');
    setIsAddCategoryModalOpen(true);
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    setCategories(prev => ({
      ...prev,
      [newCategoryType]: [...prev[newCategoryType], newCategoryName.trim()]
    }));
    setIsAddCategoryModalOpen(false);
  };

  const handleDeleteCategory = (type, categoryToRemove) => {
    setCategories(prev => ({
      ...prev,
      [type]: prev[type].filter(cat => cat !== categoryToRemove)
    }));
  };

  return (
    <div className="min-h-screen bg-[#F8F7FA] text-[#1D1B20] font-sans flex flex-col selection:bg-[#DDFD54] selection:text-[#1D1B20]">
      {/* Floating Navbar */}
      <nav className="px-3 md:px-8 py-3 md:py-5 w-full sticky top-0 z-50 bg-[#F8F7FA]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto bg-white rounded-full px-4 md:px-6 py-2.5 md:py-3 flex justify-between items-center shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] relative z-50">
          <div className="flex items-center gap-2 md:gap-3">
            <button 
              className="lg:hidden p-2 -ml-2 text-[#1D1B20] hover:bg-[#F8F7FA] rounded-full transition"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={20} className="md:w-6 md:h-6" /> : <Menu size={20} className="md:w-6 md:h-6" />}
            </button>
            <div className="flex items-center gap-1.5 md:gap-2">
              <Sparkles className="text-[#AE88F9] hidden sm:block" size={20} />
              <h1 className="font-extrabold text-lg md:text-xl tracking-tight">WTR<span className="text-[#AE88F9]">.</span></h1>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-2 absolute left-1/2 -translate-x-1/2 bg-[#F8F7FA] p-1 rounded-full">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 font-semibold px-5 py-2.5 rounded-full transition ${activeTab === 'dashboard' ? 'bg-white text-[#1D1B20] shadow-sm' : 'text-[#7A7585] hover:text-[#1D1B20]'}`}
            >
              <Home size={18} /> ภาพรวม
            </button>
            <button 
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 font-semibold px-5 py-2.5 rounded-full transition ${activeTab === 'reports' ? 'bg-white text-[#1D1B20] shadow-sm' : 'text-[#7A7585] hover:text-[#1D1B20]'}`}
            >
              <PieChart size={18} /> รายงาน
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 font-semibold px-5 py-2.5 rounded-full transition ${activeTab === 'settings' ? 'bg-white text-[#1D1B20] shadow-sm' : 'text-[#7A7585] hover:text-[#1D1B20]'}`}
            >
              <Settings size={18} /> ตั้งค่า
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button className="hidden sm:block text-sm font-bold bg-[#1D1B20] text-white px-6 py-2.5 rounded-full hover:bg-[#333038] transition">
              Join today
            </button>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-[#DDFD54] rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition-transform shadow-sm">
              <span className="font-bold text-[#1D1B20] text-xs md:text-sm">WTR</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-[#1D1B20]/40 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)}>
          <div 
            className="absolute top-[80px] left-3 right-3 bg-white rounded-[32px] p-3 shadow-2xl border border-[#EAE3F4] flex flex-col gap-2 animate-in slide-in-from-top-4 duration-300"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
              className={`flex items-center gap-3 font-bold px-6 py-4 rounded-[24px] transition ${activeTab === 'dashboard' ? 'bg-[#DDFD54] text-[#1D1B20]' : 'text-[#7A7585] hover:bg-[#F8F7FA] hover:text-[#1D1B20]'}`}
            >
              <Home size={20} /> ภาพรวม (Dashboard)
            </button>
            <button 
              onClick={() => { setActiveTab('reports'); setIsMobileMenuOpen(false); }}
              className={`flex items-center gap-3 font-bold px-6 py-4 rounded-[24px] transition ${activeTab === 'reports' ? 'bg-[#DDFD54] text-[#1D1B20]' : 'text-[#7A7585] hover:bg-[#F8F7FA] hover:text-[#1D1B20]'}`}
            >
              <PieChart size={20} /> รายงาน (Reports)
            </button>
            <button 
              onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
              className={`flex items-center gap-3 font-bold px-6 py-4 rounded-[24px] transition ${activeTab === 'settings' ? 'bg-[#DDFD54] text-[#1D1B20]' : 'text-[#7A7585] hover:bg-[#F8F7FA] hover:text-[#1D1B20]'}`}
            >
              <Settings size={20} /> ตั้งค่าระบบ (Settings)
            </button>
          </div>
        </div>
      )}

      {/* Main Layout - Dashboard */}
      {activeTab === 'dashboard' && (
        <main className="flex-1 w-full max-w-7xl mx-auto p-3 md:p-6 lg:px-8 pb-12 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start animate-in fade-in duration-300">
          
          {/* Left Column (Overview & Actions) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-5 md:space-y-6">
            
            {/* Header Section */}
            <div className="pt-1 pb-2 md:pb-4 px-2 md:px-0">
              <h2 className="text-3xl md:text-5xl font-extrabold text-[#1D1B20] tracking-tight mb-2">
                Welcome <br/>
                To WTR Ledger
              </h2>
              <p className="text-sm md:text-lg text-[#7A7585] max-w-md leading-relaxed mt-2 md:mt-4">
                จัดการรายรับและรายจ่ายในอู่ของคุณได้อย่างง่ายดาย รวดเร็ว และสวยงาม
              </p>
            </div>

            {/* Bento Grid: Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
              {/* Balance Card - Hero */}
              <div className="col-span-2 md:col-span-1 lg:col-span-3 xl:col-span-1 bg-[#AE88F9] p-5 md:p-6 lg:p-8 rounded-[28px] md:rounded-[40px] flex flex-col justify-center relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8 md:-mr-10 md:-mt-10"></div>
                
                <div className="bg-[#DDFD54] text-[#1D1B20] text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full w-fit mb-3 md:mb-4 flex items-center gap-1">
                  <Sparkles size={12} /> ยอดคงเหลือวันนี้
                </div>
                <h2 className="text-4xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight z-10 mb-1 md:mb-2 truncate">
                  ฿137K
                </h2>
                <div className="mt-4 md:mt-auto md:pt-6 text-xs md:text-sm text-white/80 font-medium z-10">
                  อัปเดตล่าสุด: 12:00 น.
                </div>
              </div>

              {/* Income Card */}
              <div className="bg-[#DDFD54] p-4 sm:p-5 md:p-6 lg:p-8 rounded-[24px] md:rounded-[40px] flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300">
                <div className="flex justify-between items-start mb-4 md:mb-6">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white/50 rounded-full flex items-center justify-center shrink-0">
                    <ArrowUpRight size={20} className="text-[#1D1B20] md:w-6 md:h-6" />
                  </div>
                </div>
                <div>
                  <p className="text-[#1D1B20]/60 font-bold mb-1 text-xs md:text-base">รายรับรวม</p>
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#1D1B20] tracking-tight truncate">฿150,000</h3>
                </div>
              </div>

              {/* Expense Card */}
              <div className="bg-white p-4 sm:p-5 md:p-6 lg:p-8 rounded-[24px] md:rounded-[40px] flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="flex justify-between items-start mb-4 md:mb-6">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-[#F8F7FA] rounded-full flex items-center justify-center shrink-0">
                    <ArrowDownRight size={20} className="text-[#AE88F9] md:w-6 md:h-6" />
                  </div>
                </div>
                <div>
                  <p className="text-[#7A7585] font-bold mb-1 text-xs md:text-base">รายจ่ายรวม</p>
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#1D1B20] tracking-tight truncate">฿12,950</h3>
                </div>
              </div>
            </div>

            {/* Bento Grid: Quick Actions */}
            <div className="grid grid-cols-2 gap-3 md:gap-4 lg:gap-6 mt-6 md:mt-8">
              <button 
                onClick={() => handleOpenModal('income')}
                className="group bg-[#1D1B20] p-5 md:p-6 lg:p-8 rounded-[28px] md:rounded-[40px] flex flex-col items-start justify-between min-h-[140px] md:min-h-[180px] hover:-translate-y-1 transition-all duration-300 shadow-xl"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 bg-[#333038] text-[#DDFD54] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shrink-0">
                  <Plus size={20} className="md:w-6 md:h-6" />
                </div>
                <div className="text-left mt-4 md:mt-6 w-full">
                  <span className="block font-bold text-lg md:text-2xl text-white tracking-tight leading-tight">บันทึกรายรับ</span>
                  <span className="text-[#DDFD54] text-[11px] sm:text-sm font-medium mt-1 md:mt-1.5 block truncate">เพิ่มยอดเงินเข้าอู่</span>
                </div>
              </button>
              
              <button 
                onClick={() => handleOpenModal('expense')}
                className="group bg-white border-2 border-[#EAE3F4] p-5 md:p-6 lg:p-8 rounded-[28px] md:rounded-[40px] flex flex-col items-start justify-between min-h-[140px] md:min-h-[180px] hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 bg-[#F5F3F7] text-[#AE88F9] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shrink-0">
                  <Minus size={20} className="md:w-6 md:h-6" />
                </div>
                <div className="text-left mt-4 md:mt-6 w-full">
                  <span className="block font-bold text-lg md:text-2xl text-[#1D1B20] tracking-tight leading-tight">บันทึกรายจ่าย</span>
                  <span className="text-[#AE88F9] text-[11px] sm:text-sm font-medium mt-1 md:mt-1.5 block truncate">หักค่าใช้จ่ายต่างๆ</span>
                </div>
              </button>
            </div>
          </div>

          {/* Right Column (Recent Transactions) */}
          <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-[32px] md:rounded-[40px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col lg:sticky lg:top-28 h-auto lg:h-[calc(100vh-10rem)] mt-2 md:mt-0">
            <div className="p-5 md:p-8 flex justify-between items-center bg-white z-10 pb-3 md:pb-4 border-b border-[#F8F7FA] lg:border-none">
              <h3 className="font-extrabold text-lg md:text-xl text-[#1D1B20] tracking-tight">
                รายการล่าสุด
              </h3>
              <button 
                onClick={() => setIsHistoryOpen(true)}
                className="px-4 py-2 text-xs md:text-sm font-bold bg-[#F8F7FA] text-[#1D1B20] rounded-full hover:bg-[#EAE3F4] transition"
              >
                ดูทั้งหมด
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 px-3 md:px-6 pb-4 md:pb-6 space-y-2 md:space-y-3 custom-scrollbar pt-2 md:pt-0">
              {transactions.slice(0, 5).map(tx => (
                <div key={tx.id} className="flex items-center justify-between p-3 md:p-4 bg-[#F8F7FA] hover:bg-[#F2EFF5] rounded-[20px] md:rounded-[24px] transition cursor-pointer group">
                  <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm ${tx.type === 'income' ? 'bg-[#DDFD54] text-[#1D1B20]' : 'bg-[#AE88F9] text-white'}`}>
                      {tx.type === 'income' ? <ArrowUpRight size={18} className="md:w-5 md:h-5" /> : <ArrowDownRight size={18} className="md:w-5 md:h-5" />}
                    </div>
                    <div className="min-w-0 pr-2">
                      <h4 className="font-bold text-[#1D1B20] text-sm md:text-base truncate">{tx.desc}</h4>
                      <p className="text-[11px] md:text-sm text-[#7A7585] mt-0.5 truncate">{tx.party}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-extrabold text-sm sm:text-base md:text-lg tracking-tight ${tx.type === 'income' ? 'text-[#1D1B20]' : 'text-[#AE88F9]'}`}>
                      {tx.type === 'income' ? '+' : '-'} {tx.amount.toLocaleString()}
                    </p>
                    <p className="text-[10px] md:text-xs font-bold text-[#7A7585] mt-0.5 bg-white px-2 py-0.5 rounded-full inline-block">
                      {tx.method === 'cash' ? 'เงินสด' : 'เงินโอน'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </main>
      )}

      {/* Main Layout - Reports */}
      {activeTab === 'reports' && (
        <main className="flex-1 w-full max-w-7xl mx-auto p-3 md:p-6 lg:px-8 pb-12 space-y-5 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Header */}
          <div className="pt-1 pb-2 md:pb-4 px-2 md:px-0 flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4 md:gap-6">
            <div>
              <h2 className="text-3xl md:text-5xl font-extrabold text-[#1D1B20] tracking-tight mb-2">
                Reports
              </h2>
              <p className="text-sm md:text-lg text-[#7A7585] max-w-md leading-relaxed mt-2 md:mt-4">
                สรุปผลประกอบการและวิเคราะห์ค่าใช้จ่าย
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto overflow-hidden">
              {/* Period Selector (รายวัน, สัปดาห์, เดือน, ปี) */}
              <div className="flex bg-white p-1.5 rounded-full shadow-sm border border-[#EAE3F4] w-full sm:w-auto overflow-x-auto custom-scrollbar">
                {[
                  { id: 'daily', label: 'รายวัน' },
                  { id: 'weekly', label: 'รายสัปดาห์' },
                  { id: 'monthly', label: 'รายเดือน' },
                  { id: 'yearly', label: 'รายปี' }
                ].map(period => (
                  <button
                    key={period.id}
                    onClick={() => setReportPeriod(period.id)}
                    className={`flex-1 sm:flex-none px-4 py-2.5 md:py-2 text-xs md:text-sm font-bold rounded-full transition-all duration-300 whitespace-nowrap ${
                      reportPeriod === period.id 
                        ? 'bg-[#1D1B20] text-[#DDFD54] shadow-md' 
                        : 'text-[#7A7585] hover:text-[#1D1B20] hover:bg-[#F8F7FA]'
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>

              {/* Dynamic Date Label */}
              <button className="w-full sm:w-auto flex items-center justify-center sm:justify-between gap-2 bg-white border-2 border-[#EAE3F4] px-5 py-3 md:py-3.5 rounded-full font-bold text-[#1D1B20] hover:bg-[#F8F7FA] transition shadow-sm shrink-0">
                <Calendar size={18} className="text-[#7A7585]" />
                <span className="min-w-[100px] text-center">
                  {reportPeriod === 'daily' && '5 เม.ย. 2026'}
                  {reportPeriod === 'weekly' && 'สัปดาห์ที่ 1 (เม.ย.)'}
                  {reportPeriod === 'monthly' && 'เมษายน 2026'}
                  {reportPeriod === 'yearly' && 'ปี 2026'}
                </span>
                <ChevronDown size={18} className="text-[#7A7585]" />
              </button>

              {/* Export */}
              <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#DDFD54] border-2 border-[#DDFD54] text-[#1D1B20] px-6 py-3 md:py-3.5 rounded-full font-extrabold hover:brightness-95 transition shadow-sm shrink-0">
                <Download size={18} /> <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>

          {/* Top KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
            {/* Net Profit */}
            <div className="bg-[#1D1B20] p-6 lg:p-8 rounded-[28px] md:rounded-[40px] flex flex-col justify-between shadow-xl relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-[#DDFD54]/10 rounded-full blur-2xl"></div>
              <div className="flex items-center gap-2 mb-8 z-10">
                <div className="w-10 h-10 bg-[#333038] rounded-full flex items-center justify-center text-[#DDFD54]">
                  <Wallet size={20} />
                </div>
                <span className="font-bold text-white/80">กำไรสุทธิ (Net Profit)</span>
              </div>
              <div className="z-10">
                <h3 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-2">฿137,050</h3>
                <div className="flex items-center gap-2 text-sm font-bold text-[#DDFD54]">
                  <TrendingUp size={16} /> <span>+12.5% จากเดือนที่แล้ว</span>
                </div>
              </div>
            </div>

            {/* Income Summary */}
            <div className="bg-[#DDFD54] p-6 lg:p-8 rounded-[28px] md:rounded-[40px] flex flex-col justify-between shadow-sm group hover:-translate-y-1 transition-transform duration-300">
              <div className="flex items-center gap-2 mb-8">
                <div className="w-10 h-10 bg-white/50 rounded-full flex items-center justify-center text-[#1D1B20]">
                  <ArrowUpRight size={20} />
                </div>
                <span className="font-bold text-[#1D1B20]/60">รายรับรวม (Income)</span>
              </div>
              <div>
                <h3 className="text-3xl md:text-4xl font-extrabold text-[#1D1B20] tracking-tight mb-2">฿150,000</h3>
                <p className="text-sm font-bold text-[#1D1B20]/60">เป้าหมาย: ฿200,000</p>
              </div>
            </div>

            {/* Expense Summary */}
            <div className="bg-white border border-[#EAE3F4] p-6 lg:p-8 rounded-[28px] md:rounded-[40px] flex flex-col justify-between shadow-sm group hover:-translate-y-1 transition-transform duration-300">
              <div className="flex items-center gap-2 mb-8">
                <div className="w-10 h-10 bg-[#F8F7FA] rounded-full flex items-center justify-center text-[#AE88F9]">
                  <ArrowDownRight size={20} />
                </div>
                <span className="font-bold text-[#7A7585]">รายจ่ายรวม (Expense)</span>
              </div>
              <div>
                <h3 className="text-3xl md:text-4xl font-extrabold text-[#1D1B20] tracking-tight mb-2">฿12,950</h3>
                <p className="text-sm font-bold text-[#AE88F9]">ควบคุมได้ดีมาก (ต่ำกว่าเกณฑ์ 5%)</p>
              </div>
            </div>
          </div>

          {/* Charts & Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 lg:gap-6">
            
            {/* Cash Flow Mock Chart (ปรับให้เต็ม 2 คอลัมน์บนจอใหญ่) */}
            <div className="lg:col-span-2 bg-white border border-[#EAE3F4] p-6 lg:p-8 rounded-[28px] md:rounded-[40px] shadow-sm flex flex-col h-[350px] md:h-[400px]">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-extrabold text-xl text-[#1D1B20] tracking-tight">กระแสเงินสดรายสัปดาห์</h3>
                <div className="flex gap-3 text-xs font-bold">
                  <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#DDFD54]"></span>รายรับ</div>
                  <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#AE88F9]"></span>รายจ่าย</div>
                </div>
              </div>
              
              {/* CSS Mock Bar Chart */}
              <div className="flex-1 flex items-end justify-between gap-2 md:gap-4 pt-4 border-b-2 border-[#F8F7FA] pb-2">
                {[
                  { in: 80, out: 30, label: 'W1' },
                  { in: 40, out: 60, label: 'W2' },
                  { in: 100, out: 20, label: 'W3' },
                  { in: 60, out: 40, label: 'W4' },
                ].map((week, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full gap-2 group">
                    <div className="flex w-full items-end justify-center gap-1 sm:gap-2 h-full">
                      <div className="w-full max-w-[40px] lg:max-w-[60px] bg-[#DDFD54] rounded-t-xl transition-all duration-500 group-hover:opacity-80" style={{ height: `${week.in}%` }}></div>
                      <div className="w-full max-w-[40px] lg:max-w-[60px] bg-[#AE88F9] rounded-t-xl transition-all duration-500 group-hover:opacity-80" style={{ height: `${week.out}%` }}></div>
                    </div>
                    <span className="text-xs font-bold text-[#7A7585]">{week.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Income Categories Breakdown */}
            <div className="bg-white border border-[#EAE3F4] p-6 lg:p-8 rounded-[28px] md:rounded-[40px] shadow-sm flex flex-col h-[400px]">
              <h3 className="font-extrabold text-xl text-[#1D1B20] tracking-tight mb-6">สัดส่วนรายรับ</h3>
              
              <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                {fullBreakdownData.income.items.slice(0, 3).map((cat, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="font-bold text-[#1D1B20] text-sm md:text-base">{cat.name}</span>
                      <span className="font-extrabold text-[#7A7585] text-sm">฿{cat.amount.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-3 md:h-4 bg-[#F8F7FA] rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${cat.percent}%`, backgroundColor: cat.color }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => handleOpenBreakdown('income')}
                className="mt-4 w-full py-3 md:py-4 rounded-full font-bold text-[#1D1B20] bg-[#F8F7FA] hover:bg-[#EAE3F4] transition text-sm"
              >
                ดูรายละเอียดทั้งหมด
              </button>
            </div>

            {/* Expense Categories Breakdown */}
            <div className="bg-white border border-[#EAE3F4] p-6 lg:p-8 rounded-[28px] md:rounded-[40px] shadow-sm flex flex-col h-[400px]">
              <h3 className="font-extrabold text-xl text-[#1D1B20] tracking-tight mb-6">สัดส่วนรายจ่าย</h3>
              
              <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                {fullBreakdownData.expense.items.slice(0, 3).map((cat, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="font-bold text-[#1D1B20] text-sm md:text-base">{cat.name}</span>
                      <span className="font-extrabold text-[#7A7585] text-sm">฿{cat.amount.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-3 md:h-4 bg-[#F8F7FA] rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${cat.percent}%`, backgroundColor: cat.color }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => handleOpenBreakdown('expense')}
                className="mt-4 w-full py-3 md:py-4 rounded-full font-bold text-[#1D1B20] bg-[#F8F7FA] hover:bg-[#EAE3F4] transition text-sm"
              >
                ดูรายละเอียดทั้งหมด
              </button>
            </div>

          </div>

          {/* Recent Transactions in Reports (รายการบัญชีตามช่วงเวลา) */}
          <div className="bg-white border border-[#EAE3F4] rounded-[28px] md:rounded-[40px] shadow-sm overflow-hidden flex flex-col mt-3 md:mt-4 lg:mt-6">
            <div className="p-5 md:p-8 flex justify-between items-center bg-white z-10 pb-3 md:pb-4 border-b border-[#F8F7FA]">
              <div>
                <h3 className="font-extrabold text-lg md:text-xl text-[#1D1B20] tracking-tight">
                  รายการบัญชีตามช่วงเวลา
                </h3>
                <p className="text-xs md:text-sm text-[#7A7585] mt-0.5">
                  รายการที่เกิดขึ้นในเดือนนี้ (แสดง 5 รายการล่าสุด)
                </p>
              </div>
              <button 
                onClick={() => setIsHistoryOpen(true)}
                className="px-4 py-2 text-xs md:text-sm font-bold bg-[#F8F7FA] text-[#1D1B20] rounded-full hover:bg-[#EAE3F4] transition shrink-0"
              >
                ดูประวัติทั้งหมด
              </button>
            </div>
            
            <div className="overflow-x-auto custom-scrollbar">
              <div className="min-w-[600px] md:min-w-0 p-3 md:p-6 space-y-2 md:space-y-3">
                {transactions.slice(0, 5).map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-3 md:p-4 bg-[#F8F7FA] hover:bg-[#F2EFF5] rounded-[20px] md:rounded-[24px] transition cursor-pointer group">
                    <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                      <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm ${tx.type === 'income' ? 'bg-[#DDFD54] text-[#1D1B20]' : 'bg-[#AE88F9] text-white'}`}>
                        {tx.type === 'income' ? <ArrowUpRight size={18} className="md:w-5 md:h-5" /> : <ArrowDownRight size={18} className="md:w-5 md:h-5" />}
                      </div>
                      <div className="min-w-0 pr-2">
                        <h4 className="font-bold text-[#1D1B20] text-sm md:text-base truncate">{tx.desc}</h4>
                        <p className="text-[11px] md:text-sm text-[#7A7585] mt-0.5 truncate">{tx.party} • {tx.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="hidden sm:inline-block bg-white border border-[#EAE3F4] text-[#1D1B20] text-[10px] md:text-xs font-bold px-3 py-1 rounded-full">
                        {tx.category}
                      </span>
                      <div className="text-right shrink-0 min-w-[100px]">
                        <p className={`font-extrabold text-sm sm:text-base md:text-lg tracking-tight ${tx.type === 'income' ? 'text-[#1D1B20]' : 'text-[#AE88F9]'}`}>
                          {tx.type === 'income' ? '+' : '-'} {tx.amount.toLocaleString()}
                        </p>
                        <p className="text-[10px] md:text-xs font-bold text-[#7A7585] mt-0.5 bg-white px-2 py-0.5 rounded-full inline-block">
                          {tx.method === 'cash' ? 'เงินสด' : 'เงินโอน'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </main>
      )}

      {/* Main Layout - Settings */}
      {activeTab === 'settings' && (
        <main className="flex-1 w-full max-w-7xl mx-auto p-3 md:p-6 lg:px-8 pb-12 space-y-5 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Header */}
          <div className="pt-1 pb-2 md:pb-4 px-2 md:px-0 flex justify-between items-end">
            <div>
              <h2 className="text-3xl md:text-5xl font-extrabold text-[#1D1B20] tracking-tight mb-2">
                Settings
              </h2>
              <p className="text-sm md:text-lg text-[#7A7585] max-w-md leading-relaxed mt-2 md:mt-4">
                ตั้งค่าระบบ ข้อมูลอู่ และจัดการหมวดหมู่
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8">
            
            {/* Left Column: Profile & Data */}
            <div className="lg:col-span-5 space-y-5 lg:space-y-6">
              
              {/* Business Profile */}
              <div className="bg-white border border-[#EAE3F4] p-6 lg:p-8 rounded-[28px] md:rounded-[40px] shadow-sm">
                <div className="flex items-center gap-4 mb-6 md:mb-8">
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-[#F8F7FA] rounded-full flex items-center justify-center text-[#AE88F9] shrink-0">
                    <Building2 size={24} className="md:w-7 md:h-7" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xl text-[#1D1B20] tracking-tight">ข้อมูลอู่</h3>
                    <p className="text-xs md:text-sm font-medium text-[#7A7585] mt-0.5">โปรไฟล์และเอกสารใบกำกับ</p>
                  </div>
                </div>
                
                <div className="space-y-4 md:space-y-5">
                  <div className="space-y-1.5 md:space-y-2">
                    <label className="text-xs md:text-sm font-bold text-[#1D1B20] ml-1">ชื่ออู่ / บริษัท</label>
                    <input type="text" defaultValue="WTR Garage Co., Ltd." 
                      className="w-full bg-[#F8F7FA] px-5 py-3 md:py-4 rounded-[16px] md:rounded-[20px] text-sm md:text-base font-medium text-[#1D1B20] focus:outline-none focus:ring-2 focus:ring-[#AE88F9]/50 transition" />
                  </div>
                  <div className="space-y-1.5 md:space-y-2">
                    <label className="text-xs md:text-sm font-bold text-[#1D1B20] ml-1">เลขประจำตัวผู้เสียภาษี</label>
                    <input type="text" defaultValue="0123456789012" 
                      className="w-full bg-[#F8F7FA] px-5 py-3 md:py-4 rounded-[16px] md:rounded-[20px] text-sm md:text-base font-medium text-[#1D1B20] focus:outline-none focus:ring-2 focus:ring-[#AE88F9]/50 transition" />
                  </div>
                  <div className="space-y-1.5 md:space-y-2">
                    <label className="text-xs md:text-sm font-bold text-[#1D1B20] ml-1">ที่อยู่</label>
                    <textarea rows="3" defaultValue="123 หมู่ 4 ต.บ้านไร่ อ.ดำเนินสะดวก จ.ราชบุรี 70130" 
                      className="w-full bg-[#F8F7FA] px-5 py-4 rounded-[16px] md:rounded-[20px] text-sm md:text-base font-medium text-[#1D1B20] focus:outline-none focus:ring-2 focus:ring-[#AE88F9]/50 transition resize-none"></textarea>
                  </div>
                  <button className="w-full py-3.5 md:py-4 mt-2 rounded-full font-extrabold text-[#1D1B20] bg-[#DDFD54] hover:brightness-95 transition shadow-sm text-sm md:text-base">
                    บันทึกข้อมูล
                  </button>
                </div>
              </div>

              {/* Data Management */}
              <div className="bg-white border border-[#EAE3F4] p-6 lg:p-8 rounded-[28px] md:rounded-[40px] shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-[#F8F7FA] rounded-full flex items-center justify-center text-[#1D1B20] shrink-0">
                    <Database size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xl text-[#1D1B20] tracking-tight">การจัดการข้อมูล</h3>
                    <p className="text-xs md:text-sm font-medium text-[#7A7585] mt-0.5">สำรองและล้างข้อมูลระบบ</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <button className="w-full flex justify-between items-center bg-[#F8F7FA] p-4 rounded-[20px] hover:bg-[#EAE3F4] transition group">
                    <span className="font-bold text-[#1D1B20] text-sm md:text-base">สำรองข้อมูล (Backup)</span>
                    <Download size={18} className="text-[#7A7585] group-hover:text-[#1D1B20]" />
                  </button>
                  <button className="w-full flex justify-between items-center bg-rose-50 p-4 rounded-[20px] hover:bg-rose-100 transition group">
                    <span className="font-bold text-rose-600 text-sm md:text-base">ล้างข้อมูลทั้งหมด</span>
                    <Trash2 size={18} className="text-rose-400 group-hover:text-rose-600" />
                  </button>
                </div>
              </div>

            </div>

            {/* Right Column: Categories & Users */}
            <div className="lg:col-span-7 space-y-5 lg:space-y-6">
              
              {/* Category Management */}
              <div className="bg-[#1D1B20] p-6 lg:p-8 rounded-[28px] md:rounded-[40px] shadow-xl text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-40 h-40 bg-[#AE88F9]/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                
                <div className="flex items-center gap-4 mb-6 md:mb-8 relative z-10">
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-[#333038] rounded-full flex items-center justify-center text-[#DDFD54] shrink-0">
                    <Tag size={24} className="md:w-7 md:h-7" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xl text-white tracking-tight">จัดการหมวดหมู่</h3>
                    <p className="text-xs md:text-sm font-medium text-[#7A7585] mt-0.5">ปรับแต่งประเภทรายรับ-รายจ่าย</p>
                  </div>
                </div>

                <div className="space-y-6 md:space-y-8 relative z-10">
                  {/* Income Categories */}
                  <div>
                    <h4 className="font-bold text-[#DDFD54] mb-3 flex items-center gap-2">
                      <ArrowUpRight size={16} /> หมวดหมู่รายรับ
                    </h4>
                    <div className="flex flex-wrap gap-2 md:gap-3">
                      {categories.income.map((cat, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-[#333038] px-4 py-2 rounded-full text-sm font-medium border border-white/10 hover:border-white/30 transition">
                          {cat}
                          <button onClick={() => handleDeleteCategory('income', cat)} className="text-white/40 hover:text-rose-400 ml-1 transition">
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      <button onClick={() => handleOpenAddCategory('income')} className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full text-sm font-medium transition border border-dashed border-white/30">
                        <Plus size={14} /> เพิ่ม
                      </button>
                    </div>
                  </div>

                  {/* Expense Categories */}
                  <div>
                    <h4 className="font-bold text-[#AE88F9] mb-3 flex items-center gap-2">
                      <ArrowDownRight size={16} /> หมวดหมู่รายจ่าย
                    </h4>
                    <div className="flex flex-wrap gap-2 md:gap-3">
                      {categories.expense.map((cat, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-[#333038] px-4 py-2 rounded-full text-sm font-medium border border-white/10 hover:border-white/30 transition">
                          {cat}
                          <button onClick={() => handleDeleteCategory('expense', cat)} className="text-white/40 hover:text-rose-400 ml-1 transition">
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      <button onClick={() => handleOpenAddCategory('expense')} className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full text-sm font-medium transition border border-dashed border-white/30">
                        <Plus size={14} /> เพิ่ม
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Team Members */}
              <div className="bg-white border border-[#EAE3F4] p-6 lg:p-8 rounded-[28px] md:rounded-[40px] shadow-sm">
                <div className="flex items-center justify-between mb-6 md:mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#F8F7FA] rounded-full flex items-center justify-center text-[#1D1B20] shrink-0">
                      <Users size={20} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-xl text-[#1D1B20] tracking-tight">สิทธิ์ผู้ใช้งาน</h3>
                      <p className="text-xs md:text-sm font-medium text-[#7A7585] mt-0.5">จัดการทีมและพนักงานอู่</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsAddUserModalOpen(true)}
                    className="w-10 h-10 bg-[#F8F7FA] rounded-full flex items-center justify-center text-[#1D1B20] hover:bg-[#DDFD54] transition"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-white border border-[#EAE3F4] rounded-[20px]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#DDFD54] rounded-full flex items-center justify-center font-bold text-[#1D1B20]">W</div>
                      <div>
                        <p className="font-bold text-[#1D1B20] text-sm md:text-base">WTR Admin</p>
                        <p className="text-xs text-[#7A7585]">เจ้าของกิจการ</p>
                      </div>
                    </div>
                    <span className="bg-[#1D1B20] text-[#DDFD54] text-[10px] md:text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Shield size={12} /> Full Access
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white border border-[#EAE3F4] rounded-[20px]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#F8F7FA] rounded-full flex items-center justify-center font-bold text-[#7A7585]">S</div>
                      <div>
                        <p className="font-bold text-[#1D1B20] text-sm md:text-base">สมศรี บัญชี</p>
                        <p className="text-xs text-[#7A7585]">เสมียน</p>
                      </div>
                    </div>
                    <span className="bg-[#F8F7FA] text-[#7A7585] text-[10px] md:text-xs font-bold px-3 py-1 rounded-full">
                      บันทึกรายการ
                    </span>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-[#F8F7FA] text-center">
                  <button className="flex items-center justify-center gap-2 w-full py-3 text-rose-500 font-bold hover:bg-rose-50 rounded-full transition text-sm">
                    <LogOut size={16} /> ออกจากระบบ
                  </button>
                </div>
              </div>

            </div>

          </div>
        </main>
      )}

      {/* Entry Modal Overlay (หน้าต่างบันทึกรายรับ-รายจ่าย) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#1D1B20]/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center sm:p-4 lg:p-6 transition-opacity">
          <div className={`bg-white w-full max-w-lg lg:max-w-xl rounded-t-[32px] md:rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] md:max-h-[85vh] transition-transform animate-in slide-in-from-bottom-8 duration-300`}>
            
            {/* Modal Header */}
            <div className={`px-6 py-5 md:px-8 md:py-6 flex justify-between items-center ${modalType === 'income' ? 'bg-[#DDFD54]' : 'bg-[#AE88F9]'}`}>
              <h2 className={`font-extrabold text-xl md:text-2xl tracking-tight flex items-center gap-2 md:gap-3 ${modalType === 'income' ? 'text-[#1D1B20]' : 'text-white'}`}>
                {modalType === 'income' ? <div className="bg-white p-1.5 md:p-2 rounded-full"><Plus size={18} className="text-[#1D1B20] md:w-5 md:h-5" /></div> : <div className="bg-white/20 p-1.5 md:p-2 rounded-full"><Minus size={18} className="text-white md:w-5 md:h-5" /></div>}
                บันทึก{modalType === 'income' ? 'รายรับ' : 'รายจ่าย'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition shadow-sm ${modalType === 'income' ? 'bg-[#1D1B20] text-[#DDFD54] hover:bg-[#333038]' : 'bg-white text-[#AE88F9] hover:bg-[#F8F7FA]'}`}>
                <X size={18} className="md:w-5 md:h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="overflow-y-auto p-5 md:p-8 space-y-5 md:space-y-6 flex-1 custom-scrollbar">
              
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:space-y-2">
                  <label className="text-xs md:text-sm font-bold text-[#1D1B20] ml-1">วันที่ทำรายการ</label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A7585] md:w-[18px] md:h-[18px]" />
                    <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}
                      className="w-full bg-[#F8F7FA] pl-10 pr-4 py-3 md:px-11 md:py-4 rounded-[16px] md:rounded-[20px] text-sm md:text-base text-[#1D1B20] font-medium focus:outline-none focus:ring-2 focus:ring-[#AE88F9]/50 transition appearance-none" />
                  </div>
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <label className="text-xs md:text-sm font-bold text-[#1D1B20] ml-1">หมวดหมู่</label>
                  <div className="relative">
                    <Tag size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A7585] md:w-[18px] md:h-[18px]" />
                    <select 
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      className="w-full bg-[#F8F7FA] pl-10 pr-4 py-3 md:px-11 md:py-4 rounded-[16px] md:rounded-[20px] text-sm md:text-base text-[#1D1B20] font-medium focus:outline-none focus:ring-2 focus:ring-[#AE88F9]/50 appearance-none transition"
                    >
                      <option value="" disabled>เลือกหมวดหมู่...</option>
                      {categories[modalType].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Party / Shop */}
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-xs md:text-sm font-bold text-[#1D1B20] ml-1">{modalType === 'income' ? 'รับเงินจาก (ชื่อลูกค้า/บริษัท)' : 'ซื้อจาก (ชื่อร้าน/ผู้ขาย)'}</label>
                <div className="relative">
                  <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A7585] md:w-[18px] md:h-[18px]" />
                  <input type="text" value={formData.partyName} onChange={e => setFormData({...formData, partyName: e.target.value})} placeholder={modalType === 'income' ? 'เช่น บจก. เวิลด์เทรด...' : 'เช่น ฮาร์ดแวร์เจริญ...'} 
                    className="w-full bg-[#F8F7FA] pl-10 pr-4 py-3 md:px-11 md:py-4 rounded-[16px] md:rounded-[20px] text-sm md:text-base text-[#1D1B20] font-medium focus:outline-none focus:ring-2 focus:ring-[#AE88F9]/50 transition" />
                </div>
              </div>

              {/* Item Details */}
              <div className="bg-[#F8F7FA] p-4 md:p-6 rounded-[20px] md:rounded-[24px] space-y-4">
                <div className="space-y-1.5 md:space-y-2">
                  <label className="text-xs md:text-sm font-bold text-[#1D1B20] ml-1">ชื่อรายการ / รายละเอียด</label>
                  <input type="text" value={formData.itemName} onChange={e => setFormData({...formData, itemName: e.target.value})} placeholder="ระบุรายละเอียด..."
                    className="w-full bg-white px-4 py-3 md:px-5 md:py-4 rounded-[16px] md:rounded-[20px] font-medium text-[#1D1B20] text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-[#DDFD54] transition shadow-sm" />
                </div>
                
                {modalType === 'expense' && (
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div className="space-y-1.5 md:space-y-2">
                      <label className="text-xs md:text-sm font-bold text-[#1D1B20] ml-1">ราคาต่อหน่วย</label>
                      <input type="number" placeholder="0" 
                        value={formData.unitPrice} onChange={e => setFormData({...formData, unitPrice: e.target.value})}
                        className="w-full bg-white px-4 py-3 md:px-5 md:py-4 rounded-[16px] md:rounded-[20px] font-medium text-[#1D1B20] text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-[#AE88F9] transition shadow-sm" />
                    </div>
                    <div className="space-y-1.5 md:space-y-2">
                      <label className="text-xs md:text-sm font-bold text-[#1D1B20] ml-1">จำนวน</label>
                      <input type="number" placeholder="1" 
                        value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})}
                        className="w-full bg-white px-4 py-3 md:px-5 md:py-4 rounded-[16px] md:rounded-[20px] font-medium text-[#1D1B20] text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-[#AE88F9] transition shadow-sm" />
                    </div>
                  </div>
                )}

                <div className="pt-1 md:pt-2">
                  <label className="text-xs md:text-sm font-bold text-[#1D1B20] ml-1 mb-1.5 md:mb-2 block">จำนวนเงินรวม (บาท)</label>
                  <input type="number" placeholder="0.00" 
                    value={formData.totalAmount}
                    onChange={e => setFormData({...formData, totalAmount: e.target.value})}
                    className={`w-full bg-white px-5 py-4 md:px-6 md:py-5 rounded-[16px] md:rounded-[24px] font-extrabold text-2xl md:text-3xl tracking-tight focus:outline-none transition shadow-sm ${modalType === 'income' ? 'text-[#1D1B20] focus:ring-2 focus:ring-[#DDFD54]' : 'text-[#AE88F9] focus:ring-2 focus:ring-[#AE88F9]'}`} />
                </div>
              </div>

              {/* Payment Method (Pill Style) */}
              <div className="space-y-2 md:space-y-3">
                <label className="text-xs md:text-sm font-bold text-[#1D1B20] ml-1">วิธีการชำระเงิน</label>
                <div className="flex bg-[#F8F7FA] p-1.5 rounded-full">
                  <button 
                    onClick={() => setFormData({...formData, paymentMethod: 'cash'})}
                    className={`flex-1 py-2.5 md:py-3 text-xs md:text-sm font-bold rounded-full transition-all duration-300 ${formData.paymentMethod === 'cash' ? 'bg-white text-[#1D1B20] shadow-md' : 'text-[#7A7585] hover:text-[#1D1B20]'}`}
                  >
                    เงินสด
                  </button>
                  <button 
                    onClick={() => setFormData({...formData, paymentMethod: 'transfer'})}
                    className={`flex-1 py-2.5 md:py-3 text-xs md:text-sm font-bold rounded-full transition-all duration-300 ${formData.paymentMethod === 'transfer' ? 'bg-white text-[#1D1B20] shadow-md' : 'text-[#7A7585] hover:text-[#1D1B20]'}`}
                  >
                    เงินโอน
                  </button>
                </div>
              </div>

              {/* Receipt Upload */}
              <div className="space-y-2 md:space-y-3 pb-2 md:pb-0">
                <label className="text-xs md:text-sm font-bold text-[#1D1B20] ml-1">อัพโหลด{modalType === 'income' ? 'สลิปเงินโอน' : 'ใบเสร็จ'}</label>
                <div className="border-2 border-dashed border-[#EAE3F4] bg-[#F8F7FA] hover:bg-white rounded-[24px] md:rounded-[32px] p-6 md:p-8 flex flex-col items-center justify-center gap-2 md:gap-3 cursor-pointer transition-colors duration-300 group">
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-white shadow-sm rounded-full flex items-center justify-center text-[#1D1B20] group-hover:scale-110 transition-transform">
                    <Camera size={20} className="md:w-6 md:h-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs md:text-sm font-bold text-[#1D1B20]">แตะเพื่อถ่ายรูป หรือ แนบไฟล์</p>
                    <p className="text-[10px] md:text-xs text-[#7A7585] mt-1 font-medium">รองรับ JPG, PNG สูงสุด 5MB</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer / Submit */}
            <div className="p-4 md:px-8 md:py-6 bg-white border-t border-[#F8F7FA]">
              <button onClick={() => setIsModalOpen(false)} className={`w-full py-4 md:py-5 rounded-full font-extrabold text-base md:text-lg transition-transform active:scale-[0.98] ${modalType === 'income' ? 'bg-[#DDFD54] text-[#1D1B20] hover:brightness-95' : 'bg-[#AE88F9] text-white hover:brightness-95'}`}>
                ยืนยันการบันทึก{modalType === 'income' ? 'รายรับ' : 'รายจ่าย'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* History Modal Overlay (หน้าต่างประวัติรายการทั้งหมด) */}
      {isHistoryOpen && (
        <div className="fixed inset-0 bg-[#1D1B20]/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 lg:p-6 transition-opacity">
          <div className="bg-white w-full max-w-5xl rounded-[32px] md:rounded-[40px] shadow-2xl overflow-hidden flex flex-col h-[95vh] md:h-[85vh] transition-transform animate-in zoom-in-95 duration-300">
            
            {/* Header */}
            <div className="px-6 py-5 md:px-8 md:py-6 flex justify-between items-center border-b border-[#F8F7FA]">
              <div>
                <h2 className="font-extrabold text-xl md:text-2xl text-[#1D1B20] tracking-tight">ประวัติรายการทั้งหมด</h2>
                <p className="text-xs md:text-sm text-[#7A7585] mt-1 font-medium">รายการเข้า-ออกทั้งหมดของอู่</p>
              </div>
              <button onClick={() => setIsHistoryOpen(false)} className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center bg-[#F8F7FA] text-[#1D1B20] hover:bg-[#EAE3F4] transition shadow-sm shrink-0">
                <X size={18} className="md:w-5 md:h-5" />
              </button>
            </div>

            {/* Toolbar (Search & Filter) */}
            <div className="px-6 py-4 md:px-8 bg-white flex flex-col sm:flex-row gap-3 border-b border-[#F8F7FA]">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A7585]" />
                <input type="text" placeholder="ค้นหารายการ, ชื่อร้าน, ชื่อลูกค้า..." 
                  className="w-full bg-[#F8F7FA] pl-11 pr-4 py-3 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#AE88F9]/50 transition" />
              </div>
              <button className="flex items-center justify-center gap-2 px-6 py-3 bg-[#1D1B20] text-white rounded-full font-bold text-sm hover:bg-[#333038] transition">
                <Filter size={16} /> ตัวกรอง
              </button>
            </div>

            {/* Content Body (Table for Desktop, List for Mobile) */}
            <div className="overflow-y-auto flex-1 bg-[#F8F7FA] p-4 md:p-8 custom-scrollbar">
              
              {/* Desktop View: Table */}
              <div className="hidden md:block bg-white rounded-[32px] shadow-sm overflow-hidden border border-[#EAE3F4]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F8F7FA] text-[#7A7585] text-sm border-b border-[#EAE3F4]">
                      <th className="py-4 px-6 font-bold w-32">วันที่</th>
                      <th className="py-4 px-6 font-bold">รายละเอียด</th>
                      <th className="py-4 px-6 font-bold">หมวดหมู่</th>
                      <th className="py-4 px-6 font-bold text-center">วิธีชำระ</th>
                      <th className="py-4 px-6 font-bold text-right">จำนวนเงิน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx, index) => (
                      <tr key={tx.id} className={`border-b border-[#F8F7FA] hover:bg-[#F8F7FA]/50 transition ${index === transactions.length - 1 ? 'border-none' : ''}`}>
                        <td className="py-4 px-6 text-sm font-medium text-[#7A7585]">
                          {tx.date} <span className="text-xs opacity-70 ml-1">{tx.time}</span>
                        </td>
                        <td className="py-4 px-6">
                          <p className="font-bold text-[#1D1B20]">{tx.desc}</p>
                          <p className="text-xs text-[#7A7585] mt-0.5">{tx.party}</p>
                        </td>
                        <td className="py-4 px-6">
                          <span className="bg-[#F8F7FA] border border-[#EAE3F4] text-[#1D1B20] text-xs font-bold px-3 py-1 rounded-full">
                            {tx.category}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="text-xs font-bold text-[#7A7585]">
                            {tx.method === 'cash' ? 'เงินสด' : 'เงินโอน'}
                          </span>
                        </td>
                        <td className={`py-4 px-6 text-right font-extrabold text-lg tracking-tight ${tx.type === 'income' ? 'text-[#1D1B20]' : 'text-[#AE88F9]'}`}>
                          {tx.type === 'income' ? '+' : '-'} {tx.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View: Card List */}
              <div className="md:hidden space-y-3">
                {transactions.map(tx => (
                  <div key={tx.id} className="bg-white p-4 rounded-[24px] shadow-sm border border-[#EAE3F4] flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'income' ? 'bg-[#DDFD54] text-[#1D1B20]' : 'bg-[#AE88F9] text-white'}`}>
                          {tx.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                        </div>
                        <div>
                          <h4 className="font-bold text-[#1D1B20] text-sm">{tx.desc}</h4>
                          <p className="text-xs text-[#7A7585] mt-0.5">{tx.party}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-extrabold text-base tracking-tight ${tx.type === 'income' ? 'text-[#1D1B20]' : 'text-[#AE88F9]'}`}>
                          {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-[#F8F7FA]">
                      <div className="flex items-center gap-2">
                        <span className="bg-[#F8F7FA] text-[#1D1B20] text-[10px] font-bold px-2.5 py-1 rounded-full">
                          {tx.category}
                        </span>
                        <span className="text-[10px] font-bold text-[#7A7585]">
                          • {tx.method === 'cash' ? 'เงินสด' : 'เงินโอน'}
                        </span>
                      </div>
                      <span className="text-[10px] font-medium text-[#7A7585]">{tx.date} {tx.time}</span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Breakdown Details Modal (หน้าต่างรายละเอียดสัดส่วนแบบเต็ม) */}
      {isBreakdownOpen && (
        <div className="fixed inset-0 bg-[#1D1B20]/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center sm:p-4 lg:p-6 transition-opacity">
          <div className="bg-white w-full max-w-lg lg:max-w-xl rounded-t-[32px] md:rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] md:max-h-[85vh] transition-transform animate-in slide-in-from-bottom-8 duration-300">
            
            {/* Header */}
            <div className={`px-6 py-5 md:px-8 md:py-6 flex justify-between items-center ${breakdownType === 'income' ? 'bg-[#DDFD54]' : 'bg-[#AE88F9]'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${breakdownType === 'income' ? 'bg-white text-[#1D1B20]' : 'bg-white/20 text-white'}`}>
                  <List size={20} />
                </div>
                <div>
                  <h2 className={`font-extrabold text-xl md:text-2xl tracking-tight ${breakdownType === 'income' ? 'text-[#1D1B20]' : 'text-white'}`}>
                    รายละเอียดสัดส่วน{breakdownType === 'income' ? 'รายรับ' : 'รายจ่าย'}
                  </h2>
                  <p className={`text-xs md:text-sm font-medium mt-0.5 ${breakdownType === 'income' ? 'text-[#1D1B20]/60' : 'text-white/80'}`}>
                    เดือน เมษายน 2026
                  </p>
                </div>
              </div>
              <button onClick={() => setIsBreakdownOpen(false)} className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition shadow-sm ${breakdownType === 'income' ? 'bg-[#1D1B20] text-[#DDFD54] hover:bg-[#333038]' : 'bg-white text-[#AE88F9] hover:bg-[#F8F7FA]'}`}>
                <X size={18} className="md:w-5 md:h-5" />
              </button>
            </div>

            {/* Total Summary Bar */}
            <div className="bg-[#F8F7FA] px-6 py-4 md:px-8 border-b border-[#EAE3F4] flex justify-between items-center">
              <span className="font-bold text-[#7A7585] text-sm md:text-base">ยอดรวมทั้งหมด</span>
              <span className={`font-extrabold text-xl md:text-2xl tracking-tight ${breakdownType === 'income' ? 'text-[#1D1B20]' : 'text-[#AE88F9]'}`}>
                ฿{fullBreakdownData[breakdownType].total.toLocaleString()}
              </span>
            </div>

            {/* Detailed List */}
            <div className="overflow-y-auto p-6 md:p-8 space-y-6 flex-1 custom-scrollbar">
              {fullBreakdownData[breakdownType].items.map((cat, idx) => (
                <div key={idx} className="space-y-2 group">
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></span>
                      <span className="font-bold text-[#1D1B20] text-sm md:text-base">{cat.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-[#1D1B20] text-base block">฿{cat.amount.toLocaleString()}</span>
                      <span className="font-bold text-[#7A7585] text-xs">{cat.percent}%</span>
                    </div>
                  </div>
                  <div className="w-full h-2 md:h-3 bg-[#F8F7FA] rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 group-hover:brightness-110" 
                      style={{ width: `${cat.percent}%`, backgroundColor: cat.color }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* Add User Modal Overlay (หน้าต่างเพิ่มผู้ใช้งาน) */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 bg-[#1D1B20]/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center sm:p-4 lg:p-6 transition-opacity">
          <div className="bg-white w-full max-w-lg lg:max-w-xl rounded-t-[32px] md:rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] md:max-h-[85vh] transition-transform animate-in slide-in-from-bottom-8 duration-300">
            
            {/* Header */}
            <div className="px-6 py-5 md:px-8 md:py-6 flex justify-between items-center bg-[#1D1B20]">
              <div className="flex items-center gap-3">
                <div className="bg-[#333038] p-2 rounded-full text-[#DDFD54]">
                  <Users size={20} className="md:w-5 md:h-5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-xl md:text-2xl tracking-tight text-white">
                    เพิ่มผู้ใช้งานใหม่
                  </h2>
                  <p className="text-xs md:text-sm font-medium mt-0.5 text-white/60">
                    ให้สิทธิ์ทีมงานเข้าถึงระบบ
                  </p>
                </div>
              </div>
              <button onClick={() => setIsAddUserModalOpen(false)} className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition shadow-sm bg-[#333038] text-white hover:bg-[#F8F7FA] hover:text-[#1D1B20]">
                <X size={18} className="md:w-5 md:h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-5 md:p-8 space-y-5 md:space-y-6 flex-1 custom-scrollbar">
              
              {/* Profile Info */}
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-xs md:text-sm font-bold text-[#1D1B20] ml-1">ชื่อ-นามสกุล / ชื่อเล่น</label>
                <input type="text" placeholder="เช่น นายช่างใหญ่, สมศรี..." 
                  className="w-full bg-[#F8F7FA] px-5 py-4 rounded-[16px] md:rounded-[20px] text-sm md:text-base text-[#1D1B20] font-medium focus:outline-none focus:ring-2 focus:ring-[#AE88F9]/50 transition" />
              </div>

              <div className="space-y-1.5 md:space-y-2">
                <label className="text-xs md:text-sm font-bold text-[#1D1B20] ml-1">ชื่อผู้ใช้ (Username) หรือ อีเมล</label>
                <input type="text" placeholder="สำหรับใช้ล็อคอินเข้าระบบ" 
                  className="w-full bg-[#F8F7FA] px-5 py-4 rounded-[16px] md:rounded-[20px] text-sm md:text-base text-[#1D1B20] font-medium focus:outline-none focus:ring-2 focus:ring-[#AE88F9]/50 transition" />
              </div>

              {/* Role Selection */}
              <div className="space-y-3">
                <label className="text-xs md:text-sm font-bold text-[#1D1B20] ml-1">ระดับสิทธิ์การใช้งาน (Role)</label>
                
                {/* Admin Role Card */}
                <div 
                  onClick={() => setNewUserRole('admin')}
                  className={`p-4 rounded-[20px] border-2 cursor-pointer transition-all duration-300 flex items-center justify-between ${newUserRole === 'admin' ? 'border-[#1D1B20] bg-[#F8F7FA]' : 'border-[#EAE3F4] bg-white hover:border-[#1D1B20]/30'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${newUserRole === 'admin' ? 'bg-[#1D1B20] text-[#DDFD54]' : 'bg-[#F8F7FA] text-[#7A7585]'}`}>
                      <Shield size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-[#1D1B20] text-sm md:text-base">ผู้ดูแลระบบ (Admin)</p>
                      <p className="text-xs text-[#7A7585] mt-0.5">เข้าถึงทุกเมนู, ดูรายงาน, ตั้งค่าระบบได้</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${newUserRole === 'admin' ? 'border-[#1D1B20]' : 'border-[#EAE3F4]'}`}>
                    {newUserRole === 'admin' && <div className="w-2.5 h-2.5 bg-[#1D1B20] rounded-full"></div>}
                  </div>
                </div>

                {/* Staff Role Card */}
                <div 
                  onClick={() => setNewUserRole('staff')}
                  className={`p-4 rounded-[20px] border-2 cursor-pointer transition-all duration-300 flex items-center justify-between ${newUserRole === 'staff' ? 'border-[#AE88F9] bg-[#F8F7FA]' : 'border-[#EAE3F4] bg-white hover:border-[#AE88F9]/30'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${newUserRole === 'staff' ? 'bg-[#AE88F9] text-white' : 'bg-[#F8F7FA] text-[#7A7585]'}`}>
                      <FileText size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-[#1D1B20] text-sm md:text-base">พนักงาน / เสมียน (Staff)</p>
                      <p className="text-xs text-[#7A7585] mt-0.5">บันทึกรายรับ-รายจ่าย และดูภาพรวมได้เท่านั้น</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${newUserRole === 'staff' ? 'border-[#AE88F9]' : 'border-[#EAE3F4]'}`}>
                    {newUserRole === 'staff' && <div className="w-2.5 h-2.5 bg-[#AE88F9] rounded-full"></div>}
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer / Submit */}
            <div className="p-4 md:px-8 md:py-6 bg-white border-t border-[#F8F7FA]">
              <button 
                onClick={() => setIsAddUserModalOpen(false)} 
                className="w-full py-4 md:py-5 rounded-full font-extrabold text-base md:text-lg bg-[#DDFD54] text-[#1D1B20] transition-transform active:scale-[0.98] hover:brightness-95"
              >
                เพิ่มผู้ใช้งานเข้าสู่ระบบ
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add Category Modal Overlay (หน้าต่างเพิ่มหมวดหมู่) */}
      {isAddCategoryModalOpen && (
        <div className="fixed inset-0 bg-[#1D1B20]/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center sm:p-4 lg:p-6 transition-opacity">
          <div className="bg-white w-full max-w-sm md:max-w-md rounded-t-[32px] md:rounded-[40px] shadow-2xl overflow-hidden flex flex-col transition-transform animate-in slide-in-from-bottom-8 duration-300">
            
            {/* Header */}
            <div className={`px-6 py-5 md:px-8 md:py-6 flex justify-between items-center ${newCategoryType === 'income' ? 'bg-[#DDFD54]' : 'bg-[#AE88F9]'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${newCategoryType === 'income' ? 'bg-white text-[#1D1B20]' : 'bg-white/20 text-white'}`}>
                  <Tag size={20} className="md:w-5 md:h-5" />
                </div>
                <div>
                  <h2 className={`font-extrabold text-xl md:text-2xl tracking-tight ${newCategoryType === 'income' ? 'text-[#1D1B20]' : 'text-white'}`}>
                    เพิ่มหมวดหมู่{newCategoryType === 'income' ? 'รายรับ' : 'รายจ่าย'}
                  </h2>
                </div>
              </div>
              <button onClick={() => setIsAddCategoryModalOpen(false)} className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition shadow-sm ${newCategoryType === 'income' ? 'bg-[#1D1B20] text-[#DDFD54] hover:bg-[#333038]' : 'bg-white text-[#AE88F9] hover:bg-[#F8F7FA]'}`}>
                <X size={18} className="md:w-5 md:h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 space-y-4">
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-xs md:text-sm font-bold text-[#1D1B20] ml-1">ชื่อหมวดหมู่ใหม่</label>
                <input 
                  type="text" 
                  placeholder="เช่น ค่าแรง, งานซ่อมบำรุง..." 
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                  autoFocus
                  className="w-full bg-[#F8F7FA] px-5 py-4 rounded-[16px] md:rounded-[20px] text-sm md:text-base text-[#1D1B20] font-medium focus:outline-none focus:ring-2 focus:ring-[#AE88F9]/50 transition" 
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 md:px-8 md:py-6 bg-white border-t border-[#F8F7FA]">
              <button 
                onClick={handleAddCategory} 
                className={`w-full py-4 rounded-full font-extrabold text-base md:text-lg transition-transform active:scale-[0.98] ${newCategoryType === 'income' ? 'bg-[#DDFD54] text-[#1D1B20] hover:brightness-95' : 'bg-[#AE88F9] text-white hover:brightness-95'}`}
              >
                บันทึกหมวดหมู่
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Global Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        @media (min-width: 768px) {
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #EAE3F4;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #AE88F9;
        }
      `}} />
    </div>
  );
}
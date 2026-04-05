import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Plus, Minus, Wallet,
  FileText, ArrowRightLeft, Camera, X,
  Calendar, Briefcase, Tag, Receipt,
  Menu, Sparkles, ArrowUpRight, ArrowDownRight,
  Home, PieChart, Settings, Search, Filter,
  Download, TrendingUp, TrendingDown, ChevronDown, List,
  Building2, Users, Database, Trash2, Bell, Shield, LogOut,
  ChevronRight, Trash, RefreshCcw, Wifi, WifiOff, CloudUpload, Image as ImageIcon,
  Wrench, Leaf, ShoppingCart, Tractor, Factory, AlertCircle, Check, Pencil
} from 'lucide-react';

const STORAGE_KEYS = {
  TRANSACTIONS: 'wtr_ledger_transactions',
  CATEGORIES: 'wtr_ledger_categories',
  BUSINESSES: 'wtr_ledger_businesses'
};

const API_URL = 'https://script.google.com/macros/s/AKfycbwTVuCMO-O89gJqHwF789hvTzqv_lYwVt8k-biajA-sn5t8GhkIe9voc3Hgk0HyZgBi9Q/exec';

const DEFAULT_BUSINESSES = [
  { id: 'garage', name: 'อู่', icon: 'Wrench' }
];

const DEFAULT_CATEGORIES = {
  garage: {
    expense: ['ค่าวัสดุ/อุปกรณ์', 'ค่าน้ำ/ค่าไฟ', 'ค่าของกิน', 'ค่าเครื่องมือ', 'อื่นๆ'],
    income: ['งานต่อเรือ', 'งานตัดเลเซอร์', 'งานประกอบท่อ', 'ขายเศษวัสดุ', 'อื่นๆ']
  }
};

const ICON_MAP = { Wrench, Leaf, ShoppingCart, Tractor, Factory, Briefcase };

export default function App() {
  // Navigation & Multi-Business State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeBusinessId, setActiveBusinessId] = useState('garage');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('expense');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [reportPeriod, setReportPeriod] = useState('monthly');
  const [viewingReceipts, setViewingReceipts] = useState(null);

  // Record Management State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [txToDelete, setTxToDelete] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTxId, setEditingTxId] = useState(null);

  // Breakdown Modal State
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
  const [breakdownType, setBreakdownType] = useState('income');

  // Sync State
  const [syncStatus, setSyncStatus] = useState('idle');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [searchTerm, setSearchTerm] = useState('');
  const [settingsTab, setSettingsTab] = useState('businesses'); // 'businesses' | 'parties'
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // File Upload State
  const [selectedImages, setSelectedImages] = useState([]);
  const fileInputRef = useRef(null);
  const [parties, setParties] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PARTIES || 'wtr_ledger_parties');
    return saved ? JSON.parse(saved) : [];
  });

  // UI State for Parties
  const [isAddPartyModalOpen, setIsAddPartyModalOpen] = useState(false);
  const [isPartyHistoryOpen, setIsPartyHistoryOpen] = useState(false);
  const [selectedParty, setSelectedParty] = useState(null);
  const [isNewPartyPromptOpen, setIsNewPartyPromptOpen] = useState(false);
  const [tempNewPartyName, setTempNewPartyName] = useState('');
  const [tempReceiptUrls, setTempReceiptUrls] = useState('');
  const [newPartyInput, setNewPartyInput] = useState({ name: '', type: 'customer' });

  // Detail View State
  const [selectedDetailTx, setSelectedDetailTx] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Data State with Cache
  const [businesses, setBusinesses] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BUSINESSES);
    return saved ? JSON.parse(saved) : DEFAULT_BUSINESSES;
  });

  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return saved ? JSON.parse(saved) : [];
  });

  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  // Persist Local Cache
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.BUSINESSES, JSON.stringify(businesses)); }, [businesses]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.PARTIES || 'wtr_ledger_parties', JSON.stringify(parties)); }, [parties]);

  // Online Detection
  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // PWA Install Prompt Listener
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    // Check if already in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (!isStandalone) {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      // For iOS where beforeinstallprompt isn't supported, show banner anyway (or after a delay)
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      if (isIOS) setShowInstallBanner(true);
    }

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Logic for iOS (Manual instruction)
      alert('สำหรับ iPhone: ให้กดปุ่ม "แชร์" แล้วเลือก "เพิ่มไปยังหน้าจอโฮม" (Add to Home Screen) นะคะ 😊');
      setShowInstallBanner(false);
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    }
  };

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
          business: t.business || 'garage',
          receiptUrl: t.receiptUrl || '', // Fix: No longer prioritize refjob over URL
          date: t.date && t.date.toString().startsWith("1899") ? new Date().toISOString().split('T')[0] : (t.date ? t.date.toString().split('T')[0] : new Date().toISOString().split('T')[0])
        }));
        setTransactions(sanitized);
      }

      const bisRes = await fetch(`${API_URL}?action=getBusinesses`, { redirect: 'follow' });
      const bisData = await bisRes.json();
      if (Array.isArray(bisData) && bisData.length > 0) setBusinesses(bisData);

      const catRes = await fetch(`${API_URL}?action=getCategories`, { redirect: 'follow' });
      const catData = await catRes.json();
      if (Array.isArray(catData)) {
        const newCats = {};
        catData.forEach(c => {
          const bId = c.businessId || 'garage';
          if (!newCats[bId]) newCats[bId] = { income: [], expense: [] };
          if (c.type && c.name) newCats[bId][c.type].push(c.name);
        });
        if (Object.keys(newCats).length > 0) setCategories(prev => ({ ...prev, ...newCats }));
      }

      const partyRes = await fetch(`${API_URL}?action=getParties`, { redirect: 'follow' });
      const partyData = await partyRes.json();
      if (Array.isArray(partyData)) setParties(partyData);

      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) { setSyncStatus('error'); }
  }, [isOnline]);

  useEffect(() => { syncWithGoogleSheets(); }, [syncWithGoogleSheets]);

  // Calculations (Filtered by Active Business & Period)
  const filteredTransactions = useMemo(() => {
    let result = transactions;
    if (activeBusinessId !== 'all') result = result.filter(t => t.business === activeBusinessId);
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase().trim();
      result = result.filter(t =>
        (t.desc || '').toLowerCase().includes(s) ||
        (t.party || '').toLowerCase().includes(s) ||
        (t.category || '').toLowerCase().includes(s) ||
        (t.refjob || '').toLowerCase().includes(s)
      );
    }
    return result;
  }, [transactions, activeBusinessId, searchTerm]);

  const filteredByBusiness = filteredTransactions;

  const now = new Date();
  const currentPeriodTransactions = useMemo(() => {
    return filteredByBusiness.filter(t => {
      if (!t.date) return true;
      const tDate = new Date(t.date);
      if (reportPeriod === 'daily') return tDate.toDateString() === now.toDateString();
      if (reportPeriod === 'weekly') return (now.getTime() - tDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
      if (reportPeriod === 'monthly') return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
      if (reportPeriod === 'yearly') return tDate.getFullYear() === now.getFullYear();
      return true;
    });
  }, [filteredByBusiness, reportPeriod]);

  const totals = useMemo(() => {
    const income = currentPeriodTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    const expense = currentPeriodTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    return { income, expense, balance: income - expense };
  }, [currentPeriodTransactions]);

  const breakdownData = useMemo(() => {
    const calc = (type) => {
      const filtered = currentPeriodTransactions.filter(t => t.type === type);
      const total = filtered.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
      const categoryMap = {};
      filtered.forEach(t => categoryMap[t.category || 'อื่นๆ'] = (categoryMap[t.category || 'อื่นๆ'] || 0) + (parseFloat(t.amount) || 0));
      const items = Object.entries(categoryMap).map(([name, amount]) => ({
        name, amount, percent: total > 0 ? Math.round((amount / total) * 100) : 0,
        color: type === 'income' ? '#DDFD54' : '#AE88F9'
      })).sort((a, b) => b.amount - a.amount);
      return { total, items };
    };
    return { income: calc('income'), expense: calc('expense') };
  }, [currentPeriodTransactions]);

  // Weekly Analysis (For the Bar Chart)
  const weeklyChartData = useMemo(() => {
    const weeks = Array(4).fill(0).map((_, i) => ({ label: `W${i + 1}`, in: 0, out: 0 }));
    currentPeriodTransactions.forEach(t => {
      const d = new Date(t.date);
      const dayIdx = d.getDate();
      const weekIdx = Math.min(Math.floor((dayIdx - 1) / 7), 3);
      if (t.type === 'income') weeks[weekIdx].in += t.amount;
      else weeks[weekIdx].out += t.amount;
    });

    // Normalize to percentages for height
    const max = Math.max(...weeks.flatMap(w => [w.in, w.out]), 1000);
    return weeks.map(w => ({
      ...w,
      inPerc: (w.in / max) * 100,
      outPerc: (w.out / max) * 100
    }));
  }, [currentPeriodTransactions]);

  // Yearly Analysis (Monthly Bars)
  const monthlyAnalysis = useMemo(() => {
    const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    const data = months.map(m => ({ label: m, in: 0, out: 0 }));
    const currentYear = new Date().getFullYear();

    filteredByBusiness.forEach(t => {
      const d = new Date(t.date);
      if (d.getFullYear() === currentYear) {
        data[d.getMonth()].in += (t.type === 'income' ? t.amount : 0);
        data[d.getMonth()].out += (t.type === 'expense' ? t.amount : 0);
      }
    });

    const max = Math.max(...data.flatMap(d => [d.in, d.out]), 10000);
    return data.map(d => ({
      ...d,
      inPerc: (d.in / max) * 100,
      outPerc: (d.out / max) * 100
    }));
  }, [filteredByBusiness]);

  // Party Analysis (Customer/Vendor Summary)
  const partyAnalysis = useMemo(() => {
    const map = {};
    filteredByBusiness.forEach(t => {
      const name = t.party || 'ทั่วไป';
      if (!map[name]) map[name] = { name, in: 0, out: 0, count: 0 };
      if (t.type === 'income') map[name].in += t.amount;
      else map[name].out += (parseFloat(t.amount) || 0);
      map[name].count += 1;
    });
    return Object.values(map).sort((a, b) => (b.in + b.out) - (a.in + a.out)).slice(0, 8);
  }, [filteredByBusiness]);

  const sortedPartiesByFrequency = useMemo(() => {
    const frequencyMap = {};
    transactions.forEach(t => { frequencyMap[t.party] = (frequencyMap[t.party] || 0) + 1; });
    return [...parties].sort((a, b) => (frequencyMap[b.name] || 0) - (frequencyMap[a.name] || 0));
  }, [parties, transactions]);

  const handleAddParty = async (partyObj) => {
    // เช็คชื่อซ้ำ (case-insensitive)
    const isDuplicate = parties.some(
      p => p.name.trim().toLowerCase() === partyObj.name.trim().toLowerCase()
    );
    if (isDuplicate) {
      alert(`"ชื่อนี้มีอยู่แล้วค่ะ: ${partyObj.name}`);
      return false; // บอกว่าไม่ได้เพิ่ม
    }
    const newP = { id: Date.now(), name: partyObj.name, type: partyObj.type || 'customer', note: partyObj.note || '' };
    setParties(prev => [...prev, newP]);
    setIsAddPartyModalOpen(false);
    setSyncStatus('syncing');
    try {
      await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'addParty', payload: newP }), redirect: 'follow' });
      setSyncStatus('success');
    } catch (e) { setSyncStatus('error'); }
    return true;
  };

  const handleDeleteParty = async (id) => {
    setParties(parties.filter(p => p.id !== id));
    if (isOnline) {
      setSyncStatus('syncing');
      try {
        await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'deleteParty', payload: { id } }), redirect: 'follow' });
        setSyncStatus('success');
      } catch (e) { setSyncStatus('error'); }
    }
  };

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    partyName: '', itemName: '', unitPrice: '', quantity: '1',
    category: '', paymentMethod: 'cash', business: '',
    refjob: ''
  });

  const handleOpenModal = (type) => {
    setModalType(type);
    setIsEditMode(false);
    setEditingTxId(null);
    setSelectedImages([]);
    const defaultBusiness = activeBusinessId === 'all' ? '' : activeBusinessId;
    const initialCategory = (categories[defaultBusiness] && categories[defaultBusiness][type][0]) || 'ทั่วไป';
    setFormData({
      date: new Date().toISOString().split('T')[0],
      partyName: '',
      items: [{ id: Date.now(), itemName: '', unitPrice: '', quantity: '1', category: initialCategory }],
      paymentMethod: 'cash',
      business: defaultBusiness,
      refjob: ''
    });
    setIsModalOpen(true);
  };

  // บีบอัดรูปก่อน upload — ลดจาก 5-10MB เหลือ ~200KB
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const MAX = 1200;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
          else { width = Math.round((width * MAX) / height); height = MAX; }
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.72);
        URL.revokeObjectURL(url);
        resolve(compressed);
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    });
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(async (file) => {
      const preview = URL.createObjectURL(file);
      const compressed = await compressImage(file);
      if (compressed) {
        setSelectedImages(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          file: { name: file.name.replace(/\.[^.]+$/, '.jpg'), type: 'image/jpeg' },
          preview,
          base64: compressed
        }]);
      }
    });
  };

  const handleFormSubmit = async (e) => {
    if (e) e.preventDefault();
    if (activeBusinessId === 'all' && !formData.business) {
      alert('กรุณาเลือกธุรกิจก่อนบันทึกรายการค่ะ');
      return;
    }

    if (formData.items.some(it => !it.itemName.trim() || parseFloat(it.unitPrice) <= 0)) {
      alert('กรุณากรอกข้อมูลรายการและราคาให้ครบถ้วนนะคะ');
      return;
    }

    const batchId = Date.now();
    const commonMetadata = {
      type: modalType,
      date: formData.date,
      party: formData.partyName || 'ทั่วไป',
      method: formData.paymentMethod,
      time: isEditMode 
        ? transactions.find(t => t.id === editingTxId)?.time || new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
        : new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      business: formData.business,
      refjob: formData.refjob,
      receiptUrl: isEditMode ? transactions.find(t => t.id === editingTxId)?.receiptUrl || "" : "",
      batchId: isEditMode ? transactions.find(t => t.id === editingTxId)?.batchId || batchId : batchId
    };

    const newTransactions = formData.items.map((it, idx) => ({
      ...commonMetadata,
      id: isEditMode ? editingTxId : batchId + idx,
      desc: it.itemName,
      amount: parseFloat(it.unitPrice) * parseFloat(it.quantity),
      category: it.category
    }));

    // 1. Update local state immediately
    if (isEditMode) {
      setTransactions(prev => prev.map(t => t.id === editingTxId ? newTransactions[0] : t));
    } else {
      setTransactions(prev => [...newTransactions, ...prev]);
    }
    
    setIsModalOpen(false);
    const imagesToUpload = [...selectedImages];
    const editingId = editingTxId;
    const isEditing = isEditMode;
    setSelectedImages([]);
    setSyncStatus('syncing');

    // 2. Upload to Google Sheets
    const saveToSheets = async () => {
      try {
        if (isEditing) {
          await fetch(API_URL, { 
            method: 'POST', 
            body: JSON.stringify({ action: 'updateTransaction', payload: newTransactions[0] }), 
            redirect: 'follow' 
          });
        } else {
          await fetch(API_URL, { 
            method: 'POST', 
            body: JSON.stringify({ action: 'addTransactionsBatch', payload: newTransactions }), 
            redirect: 'follow' 
          });
        }
        
        // 3. Handle Cloudinary Images if any
        if (imagesToUpload.length > 0) {
          const CLOUDINARY_CLOUD = 'djrwxouxx';
          const CLOUDINARY_PRESET = 'wtr_receipts';
          const uploadedUrls = [];

          for (const img of imagesToUpload) {
            const fd = new FormData();
            fd.append('file', img.base64);
            fd.append('upload_preset', CLOUDINARY_PRESET);
            fd.append('folder', 'wtr_receipts');
            
            const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, { method: 'POST', body: fd });
            const data = await res.json();
            if (data.secure_url) uploadedUrls.push(data.secure_url);
          }

          if (uploadedUrls.length > 0) {
            const finalUrl = uploadedUrls.join(', ');
            const targetIds = isEditing ? [editingId] : newTransactions.map(t => t.id);
            
            // Update local state with URLs
            setTransactions(prev => prev.map(t => 
              targetIds.includes(t.id) ? { ...t, receiptUrl: finalUrl } : t
            ));
            
            // Update Sheets with URLs
            await fetch(API_URL, {
              method: 'POST',
              body: JSON.stringify({ 
                action: 'updateTransactionsBatchReceiptUrl', 
                payload: { ids: targetIds, url: finalUrl } 
              }),
              redirect: 'follow'
            });
          }
        }
        setSyncStatus('success');
        setTimeout(() => setSyncStatus('idle'), 2000);
      } catch (err) {
        console.error("Submission failed:", err);
        setSyncStatus('error');
      }
    };

    // 4. Check for New Party before final save
    const partyExists = parties.some(p => p.name.trim().toLowerCase() === formData.partyName.trim().toLowerCase());
    if (!partyExists && formData.partyName.trim() !== '' && formData.partyName.trim() !== 'ทั่วไป') {
      setTempNewPartyName(formData.partyName.trim());
      setIsNewPartyPromptOpen(true);
      window._pendingSubmit = saveToSheets;
    } else {
      saveToSheets();
    }
    setIsEditMode(false);
    setEditingTxId(null);
  };

  const handleConfirmNewPartySave = async (shouldSave) => {
    setIsNewPartyPromptOpen(false);
    if (shouldSave) {
      const alreadyExists = parties.some(
        p => p.name.trim().toLowerCase() === tempNewPartyName.trim().toLowerCase()
      );
      if (!alreadyExists) {
        await handleAddParty({ name: tempNewPartyName, type: modalType === 'income' ? 'customer' : 'supplier' });
      }
    }
    if (window._pendingSubmit) {
      await window._pendingSubmit();
      window._pendingSubmit = null;
    }
  };

  const [isAddBusinessModalOpen, setIsAddBusinessModalOpen] = useState(false);
  const [newBusiness, setNewBusiness] = useState({ name: '', icon: 'Briefcase' });

  const handleAddBusiness = async () => {
    if (!newBusiness.name.trim()) return;
    const bId = newBusiness.name.trim().toLowerCase().replace(/\s+/g, '_');
    const bObj = { id: bId, name: newBusiness.name.trim(), icon: newBusiness.icon };

    setBusinesses([...businesses, bObj]);
    setCategories(prev => ({ ...prev, [bId]: { income: ['ทั่วไป'], expense: ['ทั่วไป'] } }));
    setIsAddBusinessModalOpen(false);
    setNewBusiness({ name: '', icon: 'Briefcase' });

    setSyncStatus('syncing');
    try {
      await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'addBusiness', payload: bObj }), redirect: 'follow' });
      setSyncStatus('success');
    } catch (e) { setSyncStatus('error'); }
  };

  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
  const [editingBusinessId, setEditingBusinessId] = useState('');
  const [newCatInEdit, setNewCatInEdit] = useState({ type: 'income', name: '' });

  const handleAddCategoryInEdit = async () => {
    if (!newCatInEdit.name.trim()) return;
    const catName = newCatInEdit.name.trim();
    setCategories(prev => {
      const bCats = prev[editingBusinessId] || { income: [], expense: [] };
      return { ...prev, [editingBusinessId]: { ...bCats, [newCatInEdit.type]: [...bCats[newCatInEdit.type], catName] } };
    });
    setNewCatInEdit({ ...newCatInEdit, name: '' });
    if (isOnline) {
      setSyncStatus('syncing');
      try {
        await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'deleteCategory', payload: { businessId: editingBusinessId, type, name } }), redirect: 'follow' });
        setSyncStatus('success');
      } catch (e) { setSyncStatus('error'); }
    }
  };

  const handleEditClick = (tx) => {
    setModalType(tx.type);
    setIsEditMode(true);
    setEditingTxId(tx.id);
    setSelectedImages([]);
    setFormData({
      date: tx.date || new Date().toISOString().split('T')[0],
      partyName: tx.party || '',
      items: [{ id: tx.id, itemName: tx.desc || '', unitPrice: tx.amount || '', quantity: '1', category: tx.category || '' }],
      paymentMethod: tx.method || 'cash',
      business: tx.business || 'garage',
      refjob: tx.refjob || ''
    });
    setIsModalOpen(true);
  };

  const handleDeleteTransaction = async () => {
    if (!txToDelete) return;
    const id = txToDelete.id;
    setTransactions(transactions.filter(t => t.id !== id));
    setIsDeleteModalOpen(false);
    setSyncStatus('syncing');

    if (isOnline) {
      try {
        await fetch(API_URL, {
          method: 'POST',
          body: JSON.stringify({ action: 'deleteTransaction', payload: { id } }),
          redirect: 'follow'
        });
        setSyncStatus('success');
        setTimeout(() => setSyncStatus('idle'), 3000);
      } catch (error) { setSyncStatus('error'); }
    }
    setTxToDelete(null);
  };

  const handleExportCSV = () => {
    if (currentPeriodTransactions.length === 0) return alert('ไม่มีข้อมูลสำหรับส่งออก');
    const headers = ['Date', 'Type', 'Description', 'Category', 'Party', 'Amount', 'Method', 'Business'];
    const rows = currentPeriodTransactions.map(t => [
      t.date, t.type === 'income' ? 'รายรับ' : 'รายจ่าย', t.desc, t.category, t.party, t.amount, t.method === 'cash' ? 'เงินสด' : 'เงินโอน', t.business
    ]);
    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `WTR_Ledger_Export_${reportPeriod}_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const formatCurrency = (val) => `฿${(parseFloat(val) || 0).toLocaleString()}`;
  const getIcon = (name) => { const Icon = ICON_MAP[name] || Briefcase; return <Icon size={18} />; };

  return (
    <div className="min-h-screen bg-[#F8F7FA] text-[#1D1B20] font-sans flex flex-col selection:bg-[#DDFD54] selection:text-[#1D1B20]" style={{ touchAction: 'manipulation' }}>
      <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleImageSelect} className="hidden" />

      {/* Navbar */}
      <nav className="px-3 md:px-8 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 md:pt-[calc(1.25rem+env(safe-area-inset-top))] md:pb-5 w-full sticky top-0 z-50 bg-[#F8F7FA]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto bg-white rounded-full px-4 md:px-6 py-2.5 md:py-3 flex justify-between items-center shadow-lg border border-[#EAE3F4]/50 z-50">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}><Menu size={20} /></button>
            <div className="flex items-center gap-2"><Sparkles className="text-[#AE88F9] hidden xs:block" size={20} /><h1 className="font-black text-lg md:text-xl tracking-tighter">WTR<span className="text-[#AE88F9]">.</span></h1></div>
          </div>
          <div className="hidden lg:flex items-center gap-2 absolute left-1/2 -translate-x-1/2 bg-[#F8F7FA] p-1 rounded-full border border-[#EAE3F4]/50">
            {[{ id: 'dashboard', label: 'ภาพรวม', icon: Home }, { id: 'reports', label: 'รายงาน', icon: PieChart }, { id: 'settings', label: 'ตั้งค่า', icon: Settings }].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 font-black px-5 py-2.5 rounded-full transition-all ${activeTab === tab.id ? 'bg-white text-[#1D1B20] shadow-sm' : 'text-[#7A7585] hover:text-[#1D1B20]'}`}><tab.icon size={18} /> {tab.label}</button>
            ))}
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <div className={`p-1.5 md:p-2 rounded-full flex items-center gap-2 ${syncStatus === 'syncing' ? 'bg-amber-50 text-amber-500 animate-pulse' : 'bg-green-50 text-emerald-500'}`}>{isOnline ? (syncStatus === 'syncing' ? <RefreshCcw size={16} className="animate-spin" /> : <Wifi size={16} />) : <WifiOff size={16} />}</div>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-[#DDFD54] rounded-full flex items-center justify-center font-black text-[10px] shadow-sm">WTR</div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] bg-[#1D1B20]/40 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="absolute top-[calc(80px+env(safe-area-inset-top))] left-4 right-4 bg-white rounded-[32px] p-4 shadow-2xl border border-[#EAE3F4] flex flex-col gap-2 animate-in slide-in-from-top-8 duration-300" onClick={e => e.stopPropagation()}>
            {[
              { id: 'dashboard', label: 'หน้าแรก / ภาพรวม', icon: Home },
              { id: 'reports', label: 'รายงานรายรับ-จ่าย', icon: PieChart },
              { id: 'settings', label: 'ตั้งค่าระบบ', icon: Settings }
            ].map(tab => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setIsMobileMenuOpen(false); }} className={`flex items-center gap-4 font-black p-4 rounded-[24px] transition-all ${activeTab === tab.id ? 'bg-[#DDFD54] text-[#1D1B20] shadow-sm' : 'text-[#7A7585] hover:bg-[#F8F7FA]'}`}>
                <tab.icon size={20} />
                <span className="text-sm">{tab.label}</span>
              </button>
            ))}
            <div className="h-px bg-[#F8F7FA] my-2"></div>
            <p className="px-4 text-[10px] font-black text-[#7A7585] opacity-40 uppercase tracking-widest">WTR Agriculture LEDGER v3.0</p>
          </div>
        </div>
      )}

      {/* PWA Install Banner */}
      {showInstallBanner && (
        <div className="max-w-7xl mx-auto w-full px-4 md:px-8 mt-4 animate-in slide-in-from-top duration-700">
          <div className="bg-white border-2 border-[#EAE3F4] p-3 md:p-4 rounded-[32px] shadow-lg flex items-center justify-between gap-4 group">
            <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl overflow-hidden shrink-0 shadow-md">
                <img src="/icon-192.png" alt="App Icon" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <h4 className="font-black text-[#1D1B20] text-sm md:text-lg leading-tight truncate uppercase tracking-tighter">Add WTR to Home Screen</h4>
                <p className="text-[10px] md:text-xs font-black text-[#7A7585] opacity-60 truncate uppercase tracking-widest">บันทึกรายรับ รายจ่าย เครือ WTR</p>
              </div>
            </div>
            <button 
              onClick={handleInstallClick}
              className="bg-[#DDFD54] text-[#1D1B20] px-6 md:px-10 py-3 md:py-4 rounded-2xl md:rounded-[24px] font-black text-xs md:text-sm shadow-xl active:scale-95 transition-all whitespace-nowrap">
              ADD
            </button>
            <button onClick={() => setShowInstallBanner(false)} className="md:hidden p-2 text-[#7A7585] opacity-20"><X size={16} /></button>
          </div>
        </div>
      )}

      {/* Business Switcher Tab */}
      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 mt-4 overflow-x-auto no-scrollbar flex gap-2 pb-2">
        <button onClick={() => setActiveBusinessId('all')} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs whitespace-nowrap transition-all ${activeBusinessId === 'all' ? 'bg-[#1D1B20] text-[#DDFD54] shadow-lg' : 'bg-white border border-[#EAE3F4] text-[#7A7585]'}`}>เครือ WTR</button>
        {businesses.map(b => (
          <button key={b.id} onClick={() => setActiveBusinessId(b.id)} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs whitespace-nowrap transition-all ${activeBusinessId === b.id ? 'bg-[#1D1B20] text-[#DDFD54] shadow-lg' : 'bg-white border border-[#EAE3F4] text-[#7A7585]'}`}>{getIcon(b.icon)} {b.name}</button>
        ))}
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 animate-in fade-in duration-500">
            <div className="lg:col-span-8 space-y-6 md:space-y-8">
              <div className="pt-2 md:pt-4">
                <h2 className="text-3xl md:text-6xl font-black tracking-tighter text-[#1D1B20] leading-none">ระบบบัญชี<br /><span className="text-[#AE88F9]">{activeBusinessId === 'all' ? 'ครบวงจร WTR' : (businesses.find(b => b.id === activeBusinessId)?.name || 'อู่')}</span></h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div className="md:col-span-2 bg-[#AE88F9] p-6 md:p-10 rounded-[32px] md:rounded-[56px] text-white shadow-2xl relative overflow-hidden group">
                  <p className="text-white/60 font-black text-[9px] md:text-xs uppercase tracking-widest mb-1 md:mb-2">ยอดวงเงินคงเหลือ</p>
                  <h3 className="text-4xl md:text-7xl font-black tracking-tighter truncate">{formatCurrency(totals.balance)}</h3>
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
              <div className="p-6 md:p-10 border-b border-[#F8F7FA] space-y-4">
                <div className="flex justify-between items-center"><h3 className="font-black text-lg md:text-2xl tracking-tighter uppercase">ล่าสุด</h3><button onClick={() => setIsHistoryOpen(true)} className="text-[#AE88F9] font-black text-xs md:text-sm">ดูทั้งหมด</button></div>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A7585]/40" size={16} />
                  <input type="text" placeholder="ค้นหาคน, รายการ..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-[#F8F7FA] pl-12 pr-4 py-3 rounded-2xl text-xs font-black outline-none focus:border-[#AE88F9] border-2 border-transparent transition-all" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
                {filteredTransactions.slice(0, 10).map(tx => (
                  <div key={tx.id} onClick={() => { setSelectedDetailTx(tx); setIsDetailModalOpen(true); }} className={`flex items-center justify-between p-4 md:p-5 bg-[#F8F7FA] rounded-[24px] md:rounded-[32px] hover:bg-[#F2EFF5] transition-all group relative cursor-pointer active:scale-[0.98]`}>
                    <div className="flex items-center gap-3 md:gap-4 min-w-0">
                      <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 ${tx.type === 'income' ? 'bg-[#DDFD54]' : 'bg-[#AE88F9] text-white'}`}>
                        {tx.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                      </div>
                      <div className="truncate">
                        <p className="font-black text-xs md:text-[15px] truncate text-[#1D1B20] leading-none mb-1">
                          {tx.desc} {tx.refjob && <span className="bg-[#1D1B20] text-[#DDFD54] text-[8px] px-1.5 py-0.5 rounded-md ml-1">{tx.refjob}</span>}
                        </p>
                        <p className="text-[9px] md:text-[10px] font-black text-[#7A7585] uppercase tracking-tighter">{tx.party} • {tx.business.toUpperCase()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <p className={`font-black text-xs md:text-base tracking-tighter ${tx.type === 'income' ? 'text-[#1D1B20]' : 'text-[#AE88F9]'}`}>{formatCurrency(tx.amount)}</p>
                       {tx.receiptUrl && <ImageIcon size={14} className="text-[#AE88F9]/40" />}
                       <ChevronRight size={14} className="text-[#AE88F9]/20 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
                {filteredTransactions.length === 0 && <div className="h-full flex items-center justify-center text-[#7A7585] font-black opacity-30 uppercase">ยังไม่มีข้อมูล</div>}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 pt-4">
              <div>
                <h2 className="text-3xl md:text-5xl font-black text-[#1D1B20] tracking-tighter">Reports</h2>
                <p className="text-[#7A7585] text-xs md:text-sm font-bold mt-2">สรุปภาพรวม {activeBusinessId === 'all' ? 'ทุกธุรกิจ' : (businesses.find(b => b.id === activeBusinessId)?.name)}</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                <div className="bg-white p-1.5 rounded-full shadow-sm border border-[#EAE3F4] flex overflow-x-auto no-scrollbar w-full sm:w-auto">
                  {[
                    { id: 'daily', label: 'รายวัน' }, { id: 'weekly', label: 'รายสัปดาห์' }, { id: 'monthly', label: 'รายเดือน' }, { id: 'yearly', label: 'รายปี' }
                  ].map(p => (
                    <button key={p.id} onClick={() => setReportPeriod(p.id)} className={`px-4 py-2 font-black text-[10px] md:text-xs rounded-full transition-all whitespace-nowrap ${reportPeriod === p.id ? 'bg-[#1D1B20] text-[#DDFD54]' : 'text-[#7A7585]'}`}>{p.label}</button>
                  ))}
                </div>

                <button className="w-full sm:w-auto flex items-center justify-between gap-3 bg-white border-2 border-[#EAE3F4] px-5 py-2.5 rounded-full font-black text-[#1D1B20] text-xs">
                  <Calendar size={16} className="text-[#AE88F9]" />
                  <span>{reportPeriod === 'monthly' ? now.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' }) : 'ช่วงเวลานี้'}</span>
                  <ChevronDown size={14} />
                </button>

                <button onClick={handleExportCSV} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#DDFD54] px-6 py-2.5 rounded-full font-black text-[#1D1B20] text-xs shadow-md active:scale-95 transition-transform"><Download size={16} /> Export</button>
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#1D1B20] p-8 md:p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#DDFD54]/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="flex items-center gap-2 mb-8"><div className="bg-[#333038] p-2 rounded-full text-[#DDFD54]"><Wallet size={20} /></div><span className="font-black text-xs text-white/60">กำไรสุทธิ (Net Profit)</span></div>
                <h3 className="text-4xl md:text-5xl font-black tracking-tighter mb-2">{formatCurrency(totals.balance)}</h3>
                <div className="flex items-center gap-1 text-[10px] font-black text-[#DDFD54]"><TrendingUp size={14} /> +12.5% vs Last Period</div>
              </div>

              <div className="bg-[#DDFD54] p-8 md:p-10 rounded-[40px] shadow-sm flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-8"><div className="bg-white/40 p-2 rounded-full"><ArrowUpRight size={20} /></div><span className="font-black text-xs text-black/40">รายรับรวม (Income)</span></div>
                <div><h3 className="text-3xl md:text-4xl font-black tracking-tighter">{formatCurrency(totals.income)}</h3><p className="text-[10px] font-black text-black/40 mt-1">เป้าหมาย: ฿250,000</p></div>
              </div>

              <div className="bg-white border-2 border-[#EAE3F4] p-8 md:p-10 rounded-[40px] shadow-sm flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-8"><div className="bg-[#F8F7FA] p-2 rounded-full text-[#AE88F9]"><ArrowDownRight size={20} /></div><span className="font-black text-xs text-[#7A7585]">รายจ่ายรวม (Expense)</span></div>
                <div><h3 className="text-3xl md:text-4xl font-black tracking-tighter">{formatCurrency(totals.expense)}</h3><p className="text-[10px] font-black text-[#AE88F9] mt-1">การควบคุมค่าใช้จ่ายยอดเยี่ยม</p></div>
              </div>
            </div>

            {/* Yearly Monthly Comparison Chart */}
            <div className="bg-[#1D1B20] p-8 md:p-14 rounded-[48px] md:rounded-[64px] text-white shadow-2xl relative overflow-hidden group">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className="text-2xl md:text-3xl font-black tracking-tighter uppercase">แนวโน้มรายปี (Yearly Trends)</h3>
                  <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mt-1">Monthly Comparison {new Date().getFullYear()}</p>
                </div>
                <div className="flex gap-4 text-[10px] font-black uppercase">
                  <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#DDFD54]"></span>รายรับ</div>
                  <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#AE88F9]"></span>รายจ่าย</div>
                </div>
              </div>
              <div className="h-[250px] md:h-[350px] flex items-end justify-between gap-2 md:gap-4 border-b border-white/10 pb-4">
                {monthlyAnalysis.map((m, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full gap-3 group">
                    <div className="flex w-full items-end justify-center gap-1 h-full">
                      <div className="w-full max-w-[15px] bg-[#DDFD54] rounded-t-sm transition-all duration-1000 group-hover:brightness-125" style={{ height: `${m.inPerc}%` }}></div>
                      <div className="w-full max-w-[15px] bg-[#AE88F9] rounded-t-sm transition-all duration-1000 group-hover:brightness-125" style={{ height: `${m.outPerc}%` }}></div>
                    </div>
                    <span className="text-[8px] md:text-[10px] font-black opacity-30 group-hover:opacity-100 transition-opacity">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Parties Aggregated Report */}
            <div className="bg-white border-2 border-[#EAE3F4] p-8 md:p-14 rounded-[48px] md:rounded-[64px] shadow-sm">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl md:text-3xl font-black tracking-tighter uppercase">สรุปยอดตามรายชื่อคู่ค้า</h3>
                <div className="bg-[#F8F7FA] p-3 rounded-2xl"><Users size={24} className="text-[#AE88F9]" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {partyAnalysis.map((pa, idx) => (
                  <div key={idx} className="bg-[#F8F7FA] p-6 md:p-8 rounded-[40px] flex justify-between items-center group hover:bg-[#1D1B20] hover:text-white transition-all cursor-default">
                    <div className="flex items-center gap-6">
                      <span className="text-4xl font-black opacity-10 group-hover:opacity-30">#{(idx + 1).toString().padStart(2, '0')}</span>
                      <div>
                        <p className="font-black text-lg md:text-2xl leading-none mb-1 uppercase tracking-tighter">{pa.name}</p>
                        <p className="text-[9px] font-black opacity-40 uppercase tracking-widest">{pa.count} รายการล่าสุด</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {pa.in > 0 && <p className="text-emerald-500 font-black text-sm md:text-xl">+{pa.in.toLocaleString()}</p>}
                      {pa.out > 0 && <p className="text-[#AE88F9] font-black text-sm md:text-xl">-{pa.out.toLocaleString()}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart View (Existing distribution cards) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-2 bg-white border-2 border-[#EAE3F4] p-8 md:p-10 rounded-[40px] shadow-sm h-[400px] flex flex-col">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="font-black text-xl tracking-tighter">กระแสเงินสดรายสัปดาห์</h3>
                  <div className="flex gap-4 text-[10px] font-black uppercase text-[#7A7585]">
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#DDFD54]"></span>รายรับ</div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#AE88F9]"></span>รายจ่าย</div>
                  </div>
                </div>
                <div className="flex-1 flex items-end justify-between gap-4 md:gap-10 pb-2 border-b-2 border-[#F8F7FA]">
                  {weeklyChartData.map((week, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full gap-3 group">
                      <div className="flex w-full items-end justify-center gap-1 sm:gap-2 h-full">
                        <div className="w-full max-w-[50px] bg-[#DDFD54] rounded-t-xl transition-all duration-700" style={{ height: `${week.inPerc}%` }}></div>
                        <div className="w-full max-w-[50px] bg-[#AE88F9] rounded-t-xl transition-all duration-700" style={{ height: `${week.outPerc}%` }}></div>
                      </div>
                      <span className="text-[10px] font-black text-[#7A7585]">{week.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border-2 border-[#EAE3F4] p-8 md:p-10 rounded-[40px] shadow-sm flex flex-col h-[450px]">
                <h3 className="font-black text-xl tracking-tighter mb-8">สัดส่วนรายรับ</h3>
                <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                  {breakdownData.income.items.map((it, idx) => (
                    <div key={idx} className="space-y-3">
                      <div className="flex justify-between font-black text-xs md:text-sm uppercase text-[#1D1B20]"><span>{it.name}</span><span>{formatCurrency(it.amount)}</span></div>
                      <div className="h-3.5 bg-[#F8F7FA] rounded-full overflow-hidden border border-[#EAE3F4]/30"><div className="h-full bg-[#DDFD54] transition-all duration-1000" style={{ width: `${it.percent}%` }}></div></div>
                    </div>
                  ))}
                  {breakdownData.income.items.length === 0 && <p className="text-center py-20 text-[#7A7585] font-black opacity-30">ไม่มีข้อมูลรายรับ</p>}
                </div>
                <button onClick={() => { setBreakdownType('income'); setIsBreakdownOpen(true); }} className="mt-8 w-full py-4 bg-[#F8F7FA] rounded-2xl font-black text-xs text-[#1D1B20] hover:bg-[#F2EFF5]">ดูรายละเอียดทั้งหมด</button>
              </div>

              <div className="bg-white border-2 border-[#EAE3F4] p-8 md:p-10 rounded-[40px] shadow-sm flex flex-col h-[450px]">
                <h3 className="font-black text-xl tracking-tighter mb-8">สัดส่วนรายจ่าย</h3>
                <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                  {breakdownData.expense.items.map((it, idx) => (
                    <div key={idx} className="space-y-3">
                      <div className="flex justify-between font-black text-xs md:text-sm uppercase text-[#1D1B20]"><span>{it.name}</span><span>{formatCurrency(it.amount)}</span></div>
                      <div className="h-3.5 bg-[#F8F7FA] rounded-full overflow-hidden border border-[#EAE3F4]/30"><div className="h-full bg-[#AE88F9] transition-all duration-1000" style={{ width: `${it.percent}%` }}></div></div>
                    </div>
                  ))}
                  {breakdownData.expense.items.length === 0 && <p className="text-center py-20 text-[#7A7585] font-black opacity-30">ไม่มีข้อมูลรายจ่าย</p>}
                </div>
                <button onClick={() => { setBreakdownType('expense'); setIsBreakdownOpen(true); }} className="mt-8 w-full py-4 bg-[#F8F7FA] rounded-2xl font-black text-xs text-[#1D1B20] hover:bg-[#F2EFF5]">ดูรายละเอียดทั้งหมด</button>
              </div>
            </div>

            {/* Recent Transactions Part in Reports */}
            <div className="bg-white border-2 border-[#EAE3F4] rounded-[40px] shadow-sm overflow-hidden flex flex-col">
              <div className="p-8 border-b border-[#F8F7FA] space-y-4 bg-white z-10 sticky top-0">
                <div className="flex justify-between items-center"><div><h3 className="font-black text-xl tracking-tighter">รายการบัญชีในช่วงเวลา</h3><p className="text-[10px] font-black text-[#7A7585] mt-1">{reportPeriod.toUpperCase()} SUMMARY</p></div><button onClick={() => setIsHistoryOpen(true)} className="px-5 py-2.5 bg-[#F8F7FA] rounded-full font-black text-xs">Statement</button></div>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A7585]/40" size={18} />
                  <input type="text" placeholder="พิมพ์ชื่อคู่ค้า หรือรายการที่ต้องการหา..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-[#F8F7FA] pl-14 pr-6 py-4 rounded-[24px] outline-none font-black text-sm focus:border-[#AE88F9] border-2 border-transparent transition-all" />
                </div>
              </div>
              <div className="p-6 md:p-8 space-y-3 overflow-x-auto">
                <div className="min-w-[600px] md:min-w-0 space-y-3">
                  {currentPeriodTransactions.filter(tx => {
                    if (!searchTerm.trim()) return true;
                    const s = searchTerm.toLowerCase().trim();
                    return (tx.desc||'').toLowerCase().includes(s) || (tx.party||'').toLowerCase().includes(s) || (tx.category||'').toLowerCase().includes(s);
                  }).slice(0, 50).map(tx => (
                    <div key={tx.id} onClick={() => { setSelectedDetailTx(tx); setIsDetailModalOpen(true); }} className="flex items-center justify-between p-4 md:p-5 bg-[#F8F7FA] rounded-[24px] hover:bg-[#F2EFF5] transition-all group cursor-pointer active:scale-[0.98]">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shrink-0 ${tx.type === 'income' ? 'bg-[#DDFD54]' : 'bg-[#AE88F9] text-white'}`}>{tx.receiptUrl ? <ImageIcon size={20} /> : (tx.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />)}</div>
                        <div className="truncate"><h4 className="font-black text-[#1D1B20] text-sm md:text-base mb-1 truncate">{tx.desc}</h4><p className="text-[9px] md:text-xs font-black text-[#7A7585] uppercase truncate">{tx.party} • {tx.date} • {tx.business.toUpperCase()}</p></div>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <span className="hidden sm:inline-block bg-white border border-[#EAE3F4] text-[9px] font-black px-3 py-1 rounded-full">{tx.category}</span>
                        <div className="min-w-[100px]">
                          <p className={`font-black text-sm md:text-lg tracking-tighter ${tx.type === 'income' ? 'text-[#1D1B20]' : 'text-[#AE88F9]'}`}>{tx.type === 'income' ? '+' : '-'} {tx.amount.toLocaleString()}</p>
                          <p className="text-[9px] font-black text-[#7A7585] bg-white px-2 py-0.5 rounded-full inline-block mt-0.5">{tx.method === 'cash' ? 'เงินสด' : 'เงินโอน'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {currentPeriodTransactions.length === 0 && <p className="text-center py-20 text-[#7A7585] font-black opacity-30">ไม่มีรายการในช่วงเวลานี้</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500">

          {/* ——— Settings Tab Header + Sub-Tabs ——— */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-4xl font-black tracking-tighter">ตั้งค่าระบบ</h2>
              <p className="text-[10px] font-black opacity-30 uppercase tracking-widest mt-1">SYSTEM SETTINGS</p>
            </div>
            {/* Tab switcher */}
            <div className="bg-white border-2 border-[#EAE3F4] p-1.5 rounded-full flex gap-1 shadow-sm w-full sm:w-auto">
              <button
                onClick={() => setSettingsTab('businesses')}
                className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-full font-black text-xs transition-all flex items-center justify-center gap-2 ${
                  settingsTab === 'businesses'
                    ? 'bg-[#1D1B20] text-[#DDFD54] shadow-md'
                    : 'text-[#7A7585] hover:text-[#1D1B20]'
                }`}>
                <Briefcase size={14} /> จัดการธุรกิจ
              </button>
              <button
                onClick={() => setSettingsTab('parties')}
                className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-full font-black text-xs transition-all flex items-center justify-center gap-2 ${
                  settingsTab === 'parties'
                    ? 'bg-[#AE88F9] text-white shadow-md'
                    : 'text-[#7A7585] hover:text-[#1D1B20]'
                }`}>
                <Users size={14} /> จัดการคู่ค้า
              </button>
            </div>
          </div>

          {/* ——— Panel: Businesses ——— */}
          {settingsTab === 'businesses' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white p-6 md:p-10 rounded-[32px] md:rounded-[48px] shadow-sm border-2 border-[#EAE3F4]">
                <h3 className="text-xl md:text-2xl font-black tracking-tighter">จัดการธุรกิจ <span className="opacity-40 italic text-sm">(Businesses)</span></h3>
                <button onClick={() => setIsAddBusinessModalOpen(true)} className="w-full sm:w-auto bg-[#1D1B20] text-[#DDFD54] px-6 py-3.5 rounded-2xl font-black text-xs md:text-sm transition-transform active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap shrink-0 border-2 border-[#1D1B20] shadow-lg"><Plus size={18} /> เพิ่มธุรกิจใหม่</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {businesses.map(b => (
                  <div key={b.id} className="bg-white p-8 rounded-[40px] shadow-md border-2 border-[#EAE3F4] relative group transition-all hover:border-[#1D1B20]">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 bg-[#DDFD54] rounded-2xl flex items-center justify-center shadow-lg">{getIcon(b.icon)}</div>
                      <h4 className="font-black text-2xl tracking-tighter">{b.name}</h4>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-xs font-black opacity-50 uppercase tracking-widest"><span>หมวดหมู่รายการ</span> <button onClick={() => { setEditingBusinessId(b.id); setIsEditCategoryModalOpen(true); }} className="text-[#AE88F9] font-black">+ แก้ไข</button></div>
                      <div className="flex flex-wrap gap-2">
                        {categories[b.id]?.income.concat(categories[b.id]?.expense).slice(0, 4).map(c => <span key={c} className="px-3 py-1.5 bg-[#F8F7FA] rounded-lg text-[9px] font-black">{c}</span>)}
                        <span className="px-3 py-1.5 bg-[#F8F7FA] rounded-lg text-[9px] font-black opacity-40">...</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ——— Panel: Parties ——— */}
          {settingsTab === 'parties' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-[#AE88F9] p-6 md:p-10 rounded-[32px] md:rounded-[48px] shadow-sm text-white">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-4 rounded-3xl"><Users size={28} /></div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-black tracking-tighter leading-none">จัดการรายชื่อคู่ค้าประจำ</h3>
                    <p className="text-[10px] opacity-60 font-black uppercase tracking-widest">Master Data Management</p>
                  </div>
                </div>
                <button onClick={() => { setSelectedParty(null); setIsAddPartyModalOpen(true); }} className="w-full sm:w-auto bg-white text-[#AE88F9] px-6 py-3.5 rounded-2xl font-black text-xs md:text-sm shadow-xl active:scale-95 transition-all">เพิ่มรายชื่อใหม่</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {parties.map(p => {
                  const pHistory = transactions.filter(t => t.party === p.name);
                  const pIn = pHistory.filter(t => t.type === 'income').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
                  const pOut = pHistory.filter(t => t.type === 'expense').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
                  return (
                    <div key={p.id} onClick={() => { setSelectedParty(p); setIsPartyHistoryOpen(true); }} className="bg-white p-6 rounded-[32px] border-2 border-[#EAE3F4] hover:border-[#AE88F9] transition-all cursor-pointer group shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${p.type === 'customer' ? 'bg-emerald-50 text-emerald-500' : 'bg-[#AE88F9]/10 text-[#AE88F9]'}`}>{p.type === 'customer' ? 'ลูกค้า' : 'ร้านค้า'}</div>
                        <button onClick={(e) => { e.stopPropagation(); if (confirm('ลบลูกค้านี้?')) handleDeleteParty(p.id); }} className="opacity-0 group-hover:opacity-100 p-2 text-rose-300 hover:text-rose-500 transition-all"><Trash2 size={16} /></button>
                      </div>
                      <h4 className="font-black text-xl mb-1 truncate leading-tight uppercase tracking-tight">{p.name}</h4>
                      <p className="text-[10px] font-black opacity-30 uppercase tracking-widest mb-4">Activity: {pHistory.length} รายการ</p>
                      <div className="flex justify-between border-t border-[#F8F7FA] pt-4">
                        <div><p className="text-[8px] font-black opacity-40 uppercase">Income</p><p className="text-emerald-500 font-black text-sm">+{pIn.toLocaleString()}</p></div>
                        <div className="text-right"><p className="text-[8px] font-black opacity-40 uppercase">Expense</p><p className="text-[#AE88F9] font-black text-sm">-{pOut.toLocaleString()}</p></div>
                      </div>
                    </div>
                  );
                })}
                {parties.length === 0 && <div className="col-span-full py-12 text-center opacity-30 font-black uppercase text-xs">ยังไม่มีข้อมูลรายชื่อคู่ค้าประจำ</div>}
              </div>
            </div>
          )}
          </div>
        )}
      </main>

      {/* New Party Save Prompt (Magic Confirmation) */}
      {isNewPartyPromptOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-[32px] w-full max-w-sm shadow-2xl text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-[#AE88F9]/10 rounded-full flex items-center justify-center mb-6 mx-auto">
              <Sparkles size={32} className="text-[#AE88F9]" />
            </div>
            <h3 className="text-xl font-black mb-2 leading-none uppercase tracking-tighter">Save regular contact?</h3>
            <p className="text-gray-500 font-medium text-sm mb-8">คุณพิมพ์ชื่อ <span className="text-[#1D1B20] font-black">"{tempNewPartyName}"</span> ใหม่<br />ต้องการบันทึกเป็นคู่ค้าประจำหรือไม่คะ?</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleConfirmNewPartySave(false)} className="py-4 bg-[#F8F7FA] rounded-2xl font-black text-gray-400">ข้ามไปก่อน</button>
              <button onClick={() => handleConfirmNewPartySave(true)} className="py-4 bg-[#AE88F9] text-white rounded-2xl font-black shadow-lg shadow-[#AE88F9]/20">บันทึกเลย!</button>
            </div>
          </div>
        </div>
      )}

      {/* Party History Full Timeline Modal */}
      {isPartyHistoryOpen && selectedParty && (
        <div className="fixed inset-0 z-[350] bg-white animate-in slide-in-from-right duration-500 flex flex-col">
          <div className="p-6 md:p-14 border-b border-[#F8F7FA] flex justify-between items-center bg-[#F8F7FA]/50 backdrop-blur-md sticky top-0 z-50">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-[#AE88F9] text-white rounded-3xl flex items-center justify-center shadow-lg"><Users size={32} /></div>
              <div>
                <h2 className="text-xl md:text-5xl font-black tracking-tighter uppercase leading-none">{selectedParty.name}</h2>
                <p className="text-[10px] md:text-xs font-black text-[#AE88F9] uppercase tracking-widest mt-1">Master Data Profile</p>
              </div>
            </div>
            <button onClick={() => setIsPartyHistoryOpen(false)} className="bg-[#1D1B20] p-4 rounded-full text-white shadow-xl hover:rotate-90 transition-transform"><X size={24} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 md:p-14 custom-scrollbar bg-[#F8F7FA]/30">
            <div className="max-w-5xl mx-auto space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-10 rounded-[48px] border-2 border-[#EAE3F4] text-center shadow-sm">
                  <p className="text-[10px] font-black opacity-30 uppercase tracking-widest mb-2">Total Income (Receipts)</p>
                  <h3 className="text-4xl md:text-6xl font-black tracking-tighter text-emerald-500">+{transactions.filter(t => t.party === selectedParty.name && t.type === 'income').reduce((s, t) => (s + (parseFloat(t.amount) || 0)), 0).toLocaleString()}</h3>
                </div>
                <div className="bg-white p-10 rounded-[48px] border-2 border-[#EAE3F4] text-center shadow-sm">
                  <p className="text-[10px] font-black opacity-30 uppercase tracking-widest mb-2">Total Expenses (Paid)</p>
                  <h3 className="text-4xl md:text-6xl font-black tracking-tighter text-[#AE88F9]">-{transactions.filter(t => t.party === selectedParty.name && t.type === 'expense').reduce((s, t) => (s + (parseFloat(t.amount) || 0)), 0).toLocaleString()}</h3>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-xl font-black uppercase tracking-tighter pl-2">Transaction History</h4>
                <div className="space-y-3">
                  {transactions.filter(t => t.party === selectedParty.name).sort((a, b) => new Date(b.date) - new Date(a.date)).map(tx => (
                    <div key={tx.id} className="bg-white p-6 md:p-10 rounded-[40px] border-2 border-[#F2EFF5] hover:border-[#AE88F9]/30 transition-all flex justify-between items-center group">
                      <div className="flex items-center gap-6">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${tx.type === 'income' ? 'bg-[#DDFD54]' : 'bg-[#AE88F9] text-white'}`}>{tx.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}</div>
                        <div>
                          <p className="font-black text-lg md:text-2xl leading-none mb-1 uppercase tracking-tight">{tx.desc}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black bg-[#F8F7FA] px-2 py-1 rounded-md uppercase tracking-wider">{tx.business}</span>
                            <span className="text-[10px] font-black opacity-30 tracking-widest">{tx.date}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl md:text-3xl font-black tracking-tighter ${tx.type === 'income' ? 'text-emerald-500' : 'text-[#AE88F9]'}`}>{tx.type === 'income' ? '+' : '-'} {tx.amount.toLocaleString()}</p>
                        <p className="text-[10px] font-black opacity-30">{tx.method.toUpperCase()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAddPartyModalOpen && (() => {
        const isDupName = newPartyInput.name.trim() !== '' &&
          parties.some(p => p.name.trim().toLowerCase() === newPartyInput.name.trim().toLowerCase());
        return (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-[#1D1B20]/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white p-10 md:p-14 rounded-[48px] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
              <h3 className="text-3xl font-black mb-8 leading-none uppercase tracking-tighter">Add regular contact</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase opacity-40 ml-1">ชื่อลูกค้า หรือ ร้านค้า/คู่ค้า</label>
                  <input
                    type="text" autoFocus
                    placeholder="พิมพ์ชื่อที่นี่..."
                    value={newPartyInput.name}
                    onChange={e => setNewPartyInput(prev => ({ ...prev, name: e.target.value }))}
                    className={`w-full bg-[#F8F7FA] p-6 rounded-3xl outline-none font-black text-lg border-2 transition ${
                      isDupName ? 'border-red-400 bg-red-50' : 'border-transparent focus:border-[#AE88F9]'
                    }`}
                  />
                  {isDupName && (
                    <p className="text-red-500 text-xs font-black ml-2 animate-pulse">
                      ⚠️ ชื่อนี้มีอยู่ในระบบแล้วค่ะ
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase opacity-40 ml-1">เลือกประเภทข้อมูล</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      disabled={isDupName || !newPartyInput.name.trim()}
                      onClick={() => { if (newPartyInput.name.trim()) handleAddParty({ name: newPartyInput.name.trim(), type: 'customer' }).then(ok => ok && setNewPartyInput({ name: '', type: 'customer' })); }}
                      className={`py-5 rounded-3xl font-black text-sm transition ${
                        isDupName || !newPartyInput.name.trim()
                          ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                          : 'bg-emerald-50 text-emerald-600 hover:scale-[1.02] shadow-sm'
                      }`}>
                      ลูกค้า
                    </button>
                    <button
                      disabled={isDupName || !newPartyInput.name.trim()}
                      onClick={() => { if (newPartyInput.name.trim()) handleAddParty({ name: newPartyInput.name.trim(), type: 'supplier' }).then(ok => ok && setNewPartyInput({ name: '', type: 'customer' })); }}
                      className={`py-5 rounded-3xl font-black text-sm transition ${
                        isDupName || !newPartyInput.name.trim()
                          ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                          : 'bg-[#AE88F9]/10 text-[#AE88F9] hover:scale-[1.02] shadow-sm'
                      }`}>
                      ร้านค้า
                    </button>
                  </div>
                </div>
                <button onClick={() => { setIsAddPartyModalOpen(false); setNewPartyInput({ name: '', type: 'customer' }); }} className="w-full py-4 text-gray-400 font-black text-xs uppercase tracking-widest">Cancel</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Breakdown Detailed Modal */}
      {isBreakdownOpen && (
        <div className="fixed inset-0 z-[200] bg-white animate-in slide-in-from-right duration-500 flex flex-col">
          <div className="p-6 md:p-10 pt-[calc(1.5rem+env(safe-area-inset-top))] border-b border-[#F8F7FA] flex justify-between items-center bg-white/50 backdrop-blur-md">
            <h2 className="text-2xl md:text-5xl font-black tracking-tighter uppercase">สัดส่วน{breakdownType === 'income' ? 'รายรับ' : 'รายจ่าย'}แบบเต็ม</h2>
            <button onClick={() => setIsBreakdownOpen(false)} className="bg-[#1D1B20] p-3 md:p-4 rounded-full text-[#DDFD54] shadow-xl hover:scale-110 transitoon-transform"><X size={24} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 md:p-10">
            <div className="max-w-4xl mx-auto space-y-10">
              <div className="bg-[#F8F7FA] p-10 rounded-[48px] text-center">
                <p className="text-xs font-black opacity-40 uppercase tracking-widest mb-2">ยอดรวมหมวดหมู่ทั้งหมด</p>
                <h3 className="text-4xl md:text-7xl font-black tracking-tighter">{formatCurrency(breakdownData[breakdownType].total)}</h3>
              </div>
              <div className="space-y-8">
                {breakdownData[breakdownType].items.map((it, idx) => (
                  <div key={idx} className="bg-white p-8 rounded-[40px] border-2 border-[#F2EFF5] shadow-sm transform transition hover:scale-[1.01]">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black" style={{ backgroundColor: it.color, color: it.color === '#DDFD54' ? '#1D1B20' : 'white' }}>{idx + 1}</div>
                        <h4 className="font-black text-2xl tracking-tighter">{it.name}</h4>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black tracking-tighter">{formatCurrency(it.amount)}</p>
                        <p className="text-[10px] font-black opacity-30">{it.percent}% OF TOTAL</p>
                      </div>
                    </div>
                    <div className="h-4 bg-[#F8F7FA] rounded-full overflow-hidden"><div className="h-full transition-all duration-1000" style={{ width: `${it.percent}%`, backgroundColor: it.color }}></div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[750] flex items-end md:items-center justify-center p-2 md:p-4 bg-[#1D1B20]/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-t-[32px] md:rounded-[64px] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-500 max-h-[90vh]">
            <div className={`p-6 md:p-14 pt-[calc(1.5rem+env(safe-area-inset-top))] flex justify-between items-center ${modalType === 'income' ? 'bg-[#DDFD54]' : 'bg-[#AE88F9] text-white'}`}>
              <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter leading-none">บันทึกรายการใหม่<br /><span className="text-sm md:text-2xl opacity-60">ระบุ{modalType === 'income' ? 'รายรับ' : 'รายจ่าย'}</span></h2>
              <button onClick={() => setIsModalOpen(false)} className="bg-white/20 p-2 md:p-4 rounded-full active:rotate-90 transition-transform"><X size={20} /></button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-6 md:p-12 space-y-4 md:space-y-6 overflow-y-auto custom-scrollbar">
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-[9px] md:text-[10px] font-black uppercase opacity-40 ml-1">
                  เลือกธุรกิจที่เป็นเจ้าของรายการ
                  {activeBusinessId === 'all' && !formData.business && (
                    <span className="ml-2 text-red-500 animate-pulse">← จำเป็น!</span>
                  )}
                </label>
                <div className={`grid grid-cols-2 md:grid-cols-3 gap-2 p-2 rounded-2xl transition-all ${activeBusinessId === 'all' && !formData.business ? 'ring-2 ring-red-300 ring-offset-1' : ''}`}>
                  {businesses.map(b => (
                    <button key={b.id} type="button" onClick={() => setFormData({ ...formData, business: b.id, category: (categories[b.id]?.[modalType]?.[0]) || '' })} className={`p-4 rounded-2xl border-2 font-black text-xs transition-all flex flex-col items-center gap-1 ${formData.business === b.id ? 'bg-[#1D1B20] text-[#DDFD54] border-[#1D1B20] shadow-md' : 'bg-white border-[#EAE3F4] text-[#7A7585]'}`}>
                      {getIcon(b.icon)} <span>{b.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2 px-1">
                  <label className="text-[10px] font-black uppercase opacity-40">รายการสินค้า/บริการ</label>
                  <button type="button" onClick={() => setFormData({ ...formData, items: [...formData.items, { id: Date.now(), itemName: '', unitPrice: '', quantity: '1', category: (categories[formData.business]?.[modalType]?.[0]) || 'ทั่วไป' }] })} className="text-[#AE88F9] hover:text-[#AE88F9]/80 flex items-center gap-1.5 transition-all group">
                    <div className="bg-[#AE88F9]/10 p-1 rounded-lg group-hover:scale-110"><Plus size={14} className="font-black" /></div>
                    <span className="text-[10px] font-black uppercase tracking-widest">เพิ่มรายการย่อย</span>
                  </button>
                </div>
                
                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div key={item.id} className="bg-[#F8F7FA] p-4 md:p-6 rounded-[28px] border-2 border-transparent hover:border-[#EAE3F4] transition-all animate-in slide-in-from-left duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="relative">
                          <input 
                            type="text" 
                            placeholder="ชื่อรายการ..." 
                            value={item.itemName} 
                            onChange={e => {
                              const newItems = [...formData.items];
                              newItems[index].itemName = e.target.value;
                              setFormData({ ...formData, items: newItems });
                            }} 
                            className="w-full bg-white p-4 rounded-2xl outline-none font-black text-sm focus:ring-2 focus:ring-[#AE88F9]/20" 
                          />
                        </div>
                        <select 
                          value={item.category} 
                          onChange={e => {
                            const newItems = [...formData.items];
                            newItems[index].category = e.target.value;
                            setFormData({ ...formData, items: newItems });
                          }} 
                          className="w-full bg-white p-4 rounded-2xl outline-none font-black text-sm appearance-none border-none">
                          {(categories[formData.business]?.[modalType] || ['ทั่วไป']).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex-1 flex gap-2">
                          <div className="flex-1">
                            <label className="text-[8px] font-black uppercase opacity-30 ml-2 mb-1 block">ราคา</label>
                            <input 
                              type="number" 
                              placeholder="ราคา" 
                              value={item.unitPrice} 
                              onChange={e => {
                                const newItems = [...formData.items];
                                newItems[index].unitPrice = e.target.value;
                                setFormData({ ...formData, items: newItems });
                              }} 
                              className="w-full bg-white p-4 rounded-2xl outline-none font-black text-sm" 
                            />
                          </div>
                          <div className="w-20">
                            <label className="text-[8px] font-black uppercase opacity-30 ml-2 mb-1 block">จำนวน</label>
                            <input 
                              type="number" 
                              placeholder="จำนวน" 
                              value={item.quantity} 
                              onChange={e => {
                                const newItems = [...formData.items];
                                newItems[index].quantity = e.target.value;
                                setFormData({ ...formData, items: newItems });
                              }} 
                              className="w-full bg-white p-4 rounded-2xl outline-none font-black text-sm text-center" 
                            />
                          </div>
                        </div>
                        
                        {formData.items.length > 1 && (
                          <div className="pt-5">
                            <button type="button" onClick={() => setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) })} className="p-3 text-red-400 hover:bg-red-50 rounded-xl transition-all">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:space-y-2"><label className="text-[9px] md:text-[10px] font-black uppercase opacity-40 ml-1">วันที่ทำรายการ</label><input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full bg-[#F8F7FA] p-4 md:p-5 rounded-2xl md:rounded-3xl outline-none font-black text-sm" /></div>
                <div className="space-y-1.5 md:space-y-2">
                  <label className="text-[9px] md:text-[10px] font-black uppercase opacity-40 ml-1">เลขที่อ้างอิงเอกสาร (refjob)</label>
                  <input type="text" placeholder="ระบุเลขที่บิล/อ้างอิง..." value={formData.refjob} onChange={e => setFormData({ ...formData, refjob: e.target.value })} className="w-full bg-[#F8F7FA] p-4 md:p-5 rounded-2xl md:rounded-3xl outline-none font-black text-sm focus:border-[#AE88F9] border-2 border-dashed border-[#EAE3F4]" />
                </div>
              </div>

              <div className="space-y-1.5 md:space-y-2">
                <label className="text-[9px] md:text-[10px] font-black uppercase opacity-40 ml-1">รับจากลูกค้า / จ่ายให้ร้านค้า</label>
                <div className="relative">
                  <input
                    type="text"
                    list="parties-list"
                    placeholder={modalType === 'income' ? 'ระบุชื่อลูกค้า...' : 'ระบุชื่อร้านค้า...'}
                    value={formData.partyName}
                    onChange={e => setFormData({ ...formData, partyName: e.target.value })}
                    className="w-full bg-[#F8F7FA] p-5 md:p-6 rounded-2xl md:rounded-[24px] outline-none font-black text-sm focus:border-black border-2 border-transparent transition"
                  />
                  <datalist id="parties-list">
                    {sortedPartiesByFrequency
                      .filter(p => p.type === (modalType === 'income' ? 'customer' : 'supplier'))
                      .map(p => <option key={p.id} value={p.name} />)
                    }
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setFormData({ ...formData, paymentMethod: 'cash' })} className={`py-4 rounded-2xl font-black text-xs border-2 transition-all flex items-center justify-center gap-2 ${formData.paymentMethod === 'cash' ? 'bg-[#1D1B20] text-[#DDFD54] border-[#1D1B20]' : 'bg-white text-[#7A7585] border-[#EAE3F4]'}`}><Wallet size={16} /> เงินสด</button>
                <button type="button" onClick={() => setFormData({ ...formData, paymentMethod: 'transfer' })} className={`py-4 rounded-2xl font-black text-xs border-2 transition-all flex items-center justify-center gap-2 ${formData.paymentMethod === 'transfer' ? 'bg-[#1D1B20] text-[#DDFD54] border-[#1D1B20]' : 'bg-white text-[#7A7585] border-[#EAE3F4]'}`}><ArrowRightLeft size={16} /> เงินโอน</button>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase opacity-40 ml-1">แนบรูปใบเสร็จ</label>
                <div className="flex flex-wrap gap-2">
                  {selectedImages.map(img => (<div key={img.id} className="relative w-16 h-16 rounded-xl overflow-hidden shadow-md group"><img src={img.preview} className="w-full h-full object-cover" /><button type="button" onClick={() => setSelectedImages(selectedImages.filter(i => i.id !== img.id))} className="absolute top-1 right-1 bg-white/80 p-1 rounded-full text-rose-500"><X size={12} /></button></div>))}
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="w-16 h-16 rounded-xl border-2 border-dashed border-[#EAE3F4] flex flex-col items-center justify-center text-[#7A7585] hover:bg-[#F8F7FA] transition active:scale-95"><Camera size={20} /><span className="text-[8px] font-black mt-1">เพิ่มรูป</span></button>
                </div>
              </div>

              <div className="p-6 bg-[#1D1B20] text-center rounded-[24px]">
                <p className="text-[9px] font-black text-white/50 mb-1 uppercase tracking-widest">ยอดรวมตามใบเสร็จ (Grand Total)</p>
                <h3 className="text-2xl font-black text-[#DDFD54]">
                  {formatCurrency(formData.items.reduce((sum, it) => sum + (parseFloat(it.unitPrice) * parseFloat(it.quantity) || 0), 0))}
                </h3>
              </div>
              <button type="submit" disabled={syncStatus === 'syncing'} className={`w-full py-5 rounded-full text-lg font-black transition-all shadow-2xl flex items-center justify-center gap-3 ${modalType === 'income' ? 'bg-[#DDFD54] text-[#1D1B20]' : 'bg-[#AE88F9] text-white'}`}>{syncStatus === 'syncing' ? <RefreshCcw className="animate-spin" /> : <CloudUpload />} {syncStatus === 'syncing' ? 'กำลังบันทึก...' : 'ยืนยันการบันทึกรายการ'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Add Business Modal */}
      {isAddBusinessModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-[#1D1B20]/40 backdrop-blur-md">
          <div className="bg-white p-8 md:p-10 rounded-[32px] md:rounded-[48px] w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl md:text-2xl font-black mb-6 uppercase tracking-tighter">เพิ่มธุรกิจใหม่</h3>
            <div className="space-y-6">
              <input type="text" autoFocus value={newBusiness.name} onChange={e => setNewBusiness({ ...newBusiness, name: e.target.value })} placeholder="ชื่อธุรกิจ (เช่น สวน, ร้านค้า)..." className="w-full bg-[#F8F7FA] p-5 rounded-2xl outline-none font-black text-base" />
              <div className="grid grid-cols-3 gap-3">
                {['Wrench', 'Leaf', 'ShoppingCart', 'Tractor', 'Factory', 'Briefcase'].map(icon => (
                  <button key={icon} onClick={() => setNewBusiness({ ...newBusiness, icon: icon })} className={`p-4 rounded-xl border-2 flex items-center justify-center transition-all ${newBusiness.icon === icon ? 'bg-[#1D1B20] text-[#DDFD54] border-[#1D1B20]' : 'bg-white border-[#EAE3F4] text-[#7A7585]'}`}>{getIcon(icon)}</button>
                ))}
              </div>
              <button onClick={handleAddBusiness} className="w-full bg-[#1D1B20] text-white py-4 rounded-2xl font-black tracking-widest shadow-lg">ยืนยันการเพิ่มธุรกิจ</button>
              <button onClick={() => setIsAddBusinessModalOpen(false)} className="w-full mt-2 text-[#7A7585] font-black text-sm">ยกเลิก</button>
            </div>
          </div>
        </div>
      )}

      {/* History Window */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-[150] bg-white animate-in slide-in-from-bottom duration-500 flex flex-col">
          <div className="p-6 md:p-10 pt-[calc(1.5rem+env(safe-area-inset-top))] border-b border-[#F8F7FA] space-y-4 bg-white/50 backdrop-blur-md sticky top-0 z-20">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl md:text-4xl font-black tracking-tighter uppercase">สมุดบัญชี ({activeBusinessId === 'all' ? 'รวม' : activeBusinessId})</h2>
              <button onClick={() => setIsHistoryOpen(false)} className="bg-[#F8F7FA] p-3 md:p-4 rounded-full text-[#1D1B20] shadow-sm hover:rotate-90 transition-transform"><X size={24} /></button>
            </div>
            <div className="relative max-w-4xl mx-auto w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A7585]/40" size={20} />
              <input type="text" placeholder="ค้นหาประวัติ..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-[#F8F7FA] pl-14 pr-6 py-5 rounded-[24px] outline-none font-black text-base focus:border-[#AE88F9] border-2 border-transparent transition-all" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-3">
            <div className="max-w-4xl mx-auto space-y-3">
                {filteredTransactions.map(tx => (
                  <div key={tx.id} onClick={() => { setSelectedDetailTx(tx); setIsDetailModalOpen(true); }} className="flex items-center justify-between p-5 md:p-6 bg-white border-2 border-[#F2EFF5] rounded-[32px] shadow-sm cursor-pointer active:scale-[0.98] hover:border-[#1D1B20] transition-all">
                    <div className="flex items-center gap-4 md:gap-6 min-w-0">
                      <div className={`w-10 h-10 md:w-14 md:h-14 rounded-2xl flex items-center justify-center font-black shrink-0 ${tx.type === 'income' ? 'bg-[#DDFD54]' : 'bg-[#AE88F9] text-white'}`}>{tx.receiptUrl ? <ImageIcon size={20} /> : (tx.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />)}</div>
                      <div className="truncate"><h4 className="font-black text-sm md:text-xl leading-none mb-1 truncate">{tx.desc}</h4><p className="text-[10px] uppercase font-extrabold text-[#7A7585] tracking-widest">{tx.date} • {tx.business} • {tx.party}</p></div>
                    </div>
                    <div className="text-right ml-4"><p className={`text-sm md:text-2xl font-black tracking-tighter ${tx.type === 'income' ? 'text-[#1D1B20]' : 'text-[#AE88F9]'}`}>{tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}</p></div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
      {/* Category Edit Modal */}
      {isEditCategoryModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-end md:items-center justify-center p-2 md:p-4 bg-[#1D1B20]/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white p-5 md:p-12 rounded-t-[32px] md:rounded-[56px] w-full max-w-2xl shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[92vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl md:text-3xl font-black tracking-tighter uppercase">จัดการหมวดหมู่</h3>
                <p className="text-[10px] font-black text-[#7A7585] mt-0.5">ธุรกิจ: {businesses.find(b => b.id === editingBusinessId)?.name}</p>
              </div>
              <button onClick={() => setIsEditCategoryModalOpen(false)} className="bg-[#F8F7FA] p-3 md:p-4 rounded-full text-[#1D1B20] hover:rotate-90 transition-transform"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-6 md:space-y-10">
              {/* Add New Category Form */}
              <div className="bg-[#F8F7FA] p-5 md:p-8 rounded-[24px] md:rounded-[40px] space-y-3">
                <p className="text-[9px] font-black uppercase opacity-40 tracking-widest">เพิ่มหมวดหมู่ใหม่</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select value={newCatInEdit.type} onChange={e => setNewCatInEdit({ ...newCatInEdit, type: e.target.value })} className="bg-white border-2 border-[#EAE3F4] px-3 py-2.5 rounded-xl md:rounded-2xl font-black text-base outline-none focus:border-[#AE88F9]">
                    <option value="income">รายรับ (+)</option>
                    <option value="expense">รายจ่าย (-)</option>
                  </select>
                  <div className="flex flex-1 gap-2">
                    <input type="text" value={newCatInEdit.name} onChange={e => setNewCatInEdit({ ...newCatInEdit, name: e.target.value })} placeholder="ชื่อหมวดหมู่..." className="flex-1 bg-white border-2 border-[#EAE3F4] px-4 py-2.5 rounded-xl md:rounded-2xl font-black text-base outline-none focus:border-[#1D1B20]" />
                    <button onClick={handleAddCategoryInEdit} className="bg-[#1D1B20] text-[#DDFD54] px-5 py-2.5 rounded-xl md:rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-transform"><Plus size={18} /></button>
                  </div>
                </div>
              </div>

              {/* List Categories */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {['income', 'expense'].map(type => (
                  <div key={type} className="space-y-3">
                    <h4 className={`font-black text-base md:text-lg flex items-center gap-2 ${type === 'income' ? 'text-emerald-500' : 'text-[#AE88F9]'}`}>
                      {type === 'income' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />} {type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                    </h4>
                    <div className="space-y-2">
                      {(categories[editingBusinessId]?.[type] || []).map(cat => (
                        <div key={cat} className="flex justify-between items-center p-3 md:p-4 bg-white border-2 border-[#F2EFF5] rounded-xl md:rounded-2xl group hover:border-[#1D1B20] transition-colors">
                          <span className="font-black text-xs md:text-sm">{cat}</span>
                          <button onClick={() => handleDeleteCategoryInEdit(type, cat)} className="text-rose-400 opacity-60 md:opacity-0 group-hover:opacity-100 p-2 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={14} /></button>
                        </div>
                      ))}
                      {(categories[editingBusinessId]?.[type] || []).length === 0 && <p className="text-[10px] font-black opacity-30 text-center py-4">ไม่มีข้อมูล</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => setIsEditCategoryModalOpen(false)} className="mt-6 w-full py-4 md:py-5 bg-[#1D1B20] text-white rounded-2xl md:rounded-[24px] font-black text-base md:text-lg shadow-xl">บันทึกและปิด</button>
          </div>
        </div>
      )}

      {/* Deluxe Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-[32px] w-full max-w-sm shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center mb-4">
              <AlertCircle size={28} className="text-rose-500" />
            </div>
            <h3 className="text-xl font-black text-[#1D1B20] mb-2 uppercase tracking-tighter">Delete</h3>
            <p className="text-gray-500 font-medium text-sm mb-8">Are you sure you would like to do this?</p>

            <div className="flex flex-col w-full gap-2">
              <button onClick={() => setIsDeleteModalOpen(false)} className="w-full py-3.5 bg-white border border-gray-200 rounded-2xl font-black text-gray-500 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleDeleteTransaction} className="w-full py-3.5 bg-rose-600 text-white rounded-2xl font-black shadow-lg shadow-rose-200 hover:bg-rose-700 active:scale-95 transition-all">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* ImageViewer Modal */}
      {viewingReceipts && (
        <div className="fixed inset-0 z-[600] bg-[#1D1B20] flex flex-col animate-in fade-in duration-300">
          <div className="p-6 md:p-10 flex justify-between items-center text-white bg-[#1D1B20]/80 backdrop-blur-md sticky top-0 z-10">
            <h2 className="text-2xl font-black tracking-tighter uppercase">ดูใบเสร็จ</h2>
            <button onClick={() => setViewingReceipts(null)} className="p-3 md:p-4 rounded-full bg-white/10 hover:bg-white/20 transition-transform active:scale-95"><X size={24} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar">
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
              {viewingReceipts.map((url, idx) => (
                <div key={idx} className="relative group rounded-[32px] overflow-hidden bg-white/5 border border-white/10 shadow-2xl">
                  <img src={url} alt={`Receipt ${idx + 1}`} className="w-full h-auto object-cover min-h-[300px]" />
                  <div className="absolute top-4 right-4"><a href={url} target="_blank" rel="noreferrer" className="bg-white/90 p-3 rounded-full text-[#1D1B20] shadow-lg flex items-center gap-2 font-black text-xs"><Download size={16} /> บันทึก</a></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Transaction Detail Modal */}
      {isDetailModalOpen && selectedDetailTx && (
        <div className="fixed inset-0 z-[500] bg-white animate-in slide-in-from-right duration-500 flex flex-col overflow-hidden">
          <div className={`p-6 md:p-10 flex justify-between items-center sticky top-0 z-10 ${selectedDetailTx.type === 'income' ? 'bg-[#DDFD54]' : 'bg-[#AE88F9] text-white'}`}>
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl">{selectedDetailTx.type === 'income' ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}</div>
              <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter leading-none">รายละเอียด<br /><span className="text-sm md:text-2xl opacity-60">{selectedDetailTx.type === 'income' ? 'รายรับ' : 'รายจ่าย'}</span></h2>
            </div>
            <button onClick={() => setIsDetailModalOpen(false)} className="bg-white/20 p-3 md:p-4 rounded-full hover:rotate-90 transition-transform"><X size={24} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-14 bg-[#F8F7FA] space-y-8 custom-scrollbar">
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Amount Highlight */}
              <div className="bg-white p-10 rounded-[40px] shadow-sm text-center border-2 border-[#EAE3F4]/50">
                <p className={`text-5xl md:text-8xl font-black tracking-tighter ${selectedDetailTx.type === 'income' ? 'text-[#1D1B20]' : 'text-[#AE88F9]'}`}>{selectedDetailTx.type === 'income' ? '+' : '-'} {formatCurrency(selectedDetailTx.amount)}</p>
                <div className="mt-4 flex justify-center gap-2">
                  <span className="px-4 py-1.5 bg-[#F8F7FA] rounded-full text-[10px] font-black uppercase tracking-widest opacity-40">{selectedDetailTx.method === 'cash' ? 'เงินสด' : 'เงินโอน'}</span>
                  <span className="px-4 py-1.5 bg-[#F8F7FA] rounded-full text-[10px] font-black uppercase tracking-widest opacity-40">{selectedDetailTx.category}</span>
                </div>
              </div>

              {/* Detail Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'รายการ', value: selectedDetailTx.desc },
                  { label: 'คู่ค้า', value: selectedDetailTx.party },
                  { label: 'วันที่', value: selectedDetailTx.date },
                  { 
                    label: 'เวลา', 
                    value: selectedDetailTx.time?.includes('T') || selectedDetailTx.time?.length > 10
                      ? new Date(selectedDetailTx.time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) 
                      : selectedDetailTx.time 
                  },
                  { label: 'ธุรกิจ', value: selectedDetailTx.business.toUpperCase() },
                  { label: 'เลขที่อ้างอิง (Ref)', value: selectedDetailTx.refjob || '-' }
                ].map((item, i) => (
                  <div key={i} className="bg-white p-6 rounded-[24px] border border-[#EAE3F4] flex justify-between items-center group hover:border-[#1D1B20] transition-colors">
                    <span className="text-[10px] font-black opacity-30 uppercase tracking-widest">{item.label}</span>
                    <span className="font-black text-sm md:text-base text-right">{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Receipt Section */}
              {selectedDetailTx.receiptUrl && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase opacity-40 tracking-widest px-2">ภาพใบเสร็จแนบมา</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedDetailTx.receiptUrl.split(', ').map((url, idx) => (
                      <div key={idx} className="relative aspect-[4/3] rounded-[32px] overflow-hidden shadow-lg group bg-white border-4 border-white">
                        <img src={url} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button onClick={() => setViewingReceipts([url])} className="p-4 bg-white rounded-full text-[#1D1B20] shadow-xl hover:scale-110 transition-transform"><Search size={24} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-6">
                <button onClick={(e) => { e.stopPropagation(); handleEditClick(selectedDetailTx); setTimeout(() => setIsDetailModalOpen(false), 50); }} className="py-3.5 bg-white border-2 border-[#1D1B20] text-[#1D1B20] rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-[#F8F7FA] transition-all shadow-sm active:scale-95"><Pencil size={18} /> แก้ไขข้อมูล</button>
                <button onClick={(e) => { e.stopPropagation(); setTxToDelete(selectedDetailTx); setIsDeleteModalOpen(true); }} className="py-3.5 bg-rose-50 text-rose-600 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-rose-100 transition-all shadow-sm active:scale-95"><Trash2 size={18} /> ลบรายการนี้</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

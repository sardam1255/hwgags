import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Wallet, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Users, 
  UserPlus, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Edit3, 
  Key, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  FileText, 
  Receipt,
  Smartphone,
  DollarSign,
  Activity,
  Lock,
  PlusCircle,
  History,
  Settings as SettingsIcon,
  Clock,
  Coins,
  Check,
  Info
} from 'lucide-react';
import { AppUser, Contract, PaymentRecord, ShopSettings, UserRole } from '../types/index.ts';
import { formatCurrency } from '../utils/calculations.ts';

interface Props {
  settings: ShopSettings;
  contracts: Contract[];
  payments: PaymentRecord[];
  users: AppUser[];
  onSaveCapital: (amount: number, action?: 'deposit' | 'set', note?: string) => Promise<boolean>;
  onSaveSettings?: (settings: ShopSettings) => Promise<void>;
  onSaveUser: (user: Partial<AppUser>) => Promise<boolean>;
  onDeleteUser: (userId: string) => Promise<boolean>;
}

export const ManagerPanelView: React.FC<Props> = ({
  settings,
  contracts,
  payments,
  users,
  onSaveCapital,
  onSaveSettings,
  onSaveUser,
  onDeleteUser,
}) => {
  // Tabs: 'capital' | 'history' | 'users' | 'audit' | 'settings'
  const [activeTab, setActiveTab] = useState<'capital' | 'history' | 'users' | 'audit' | 'settings'>('capital');

  // Deposit Modal (Add money to capital - any digits)
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [depositInput, setDepositInput] = useState<string>('');
  const [depositNote, setDepositNote] = useState<string>('تەقویەی سەرمایەی کار لە لایەن بەڕێوەبەر');
  const [savingDeposit, setSavingDeposit] = useState(false);

  // Capital Base Edit Modal
  const [capitalModalOpen, setCapitalModalOpen] = useState(false);
  const [capitalInput, setCapitalInput] = useState<string>(String(settings.initialCapital || 10000000));
  const [capitalNote, setCapitalNote] = useState<string>('ڕێکخستنەوەی سەرمایەی بنەڕەتی');
  const [savingCapital, setSavingCapital] = useState(false);

  // Edit Profile / Real Name Modal
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [sellerNameInput, setSellerNameInput] = useState<string>(settings.sellerName || '');
  const [shopNameInput, setShopNameInput] = useState<string>(settings.shopName || '');
  const [phoneInput, setPhoneInput] = useState<string>(settings.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Manager System Settings (Profit rate 2.5% & USD Rate)
  const [profitRateInput, setProfitRateInput] = useState<number>(settings.defaultProfitRate || 2.5);
  const [usdRateInput, setUsdRateInput] = useState<number>(settings.usdExchangeRate || 150000);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // User Create/Edit Modal
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('deputy');
  const [isActive, setIsActive] = useState(true);
  const [userFormError, setUserFormError] = useState('');
  const [savingUser, setSavingUser] = useState(false);

  // Password visibility map for user cards
  const [showPasswords, setShowPasswords] = useState<{ [id: string]: boolean }>({});

  // -------------------------------------------------------------
  // Precise Financial & Accounting Calculations:
  // User principle: When money goes out for a phone, returned payments
  // first recover the spent phone capital (reimbursing cash liquidity).
  // ONLY the profit margin is added as net gain to total equity!
  // -------------------------------------------------------------
  const initialCapital = settings.initialCapital || 10000000;

  // 1. Total capital spent on purchasing phones:
  const totalPhonesCostAll = contracts.reduce((sum, c) => sum + (c.pricing.purchaseCost || c.pricing.cashPrice || 0), 0);
  const activeContracts = contracts.filter((c) => c.status === 'active');
  const activePhonesCost = activeContracts.reduce((sum, c) => sum + (c.pricing.purchaseCost || c.pricing.cashPrice || 0), 0);

  // 2. Breakdown per contract: Principal Recovered vs True Net Realized Profit
  let totalPrincipalRecovered = 0;
  let totalRealizedProfit = 0;

  const phoneBreakdowns = contracts.map((ct) => {
    const phoneCost = ct.pricing.purchaseCost || ct.pricing.cashPrice || 0;
    const paidInstallments = ct.schedule
      .filter((i) => i.status === 'paid')
      .reduce((s, i) => s + (i.paidAmount || i.amount), 0);
    const totalCustomerPaid = (ct.pricing.downPayment || 0) + paidInstallments;

    // Principal recovered: portions of customer payments reimbursing the phone cost
    const principalRecovered = Math.min(totalCustomerPaid, phoneCost);
    // True Net Realized Profit: ONLY the amount collected above the phone cost!
    const profitRealized = Math.max(0, totalCustomerPaid - phoneCost);
    // Unrecovered phone cost still owed in the market:
    const unrecoveredPhoneCost = Math.max(0, phoneCost - principalRecovered);

    totalPrincipalRecovered += principalRecovered;
    totalRealizedProfit += profitRealized;

    return {
      contract: ct,
      phoneCost,
      totalCustomerPaid,
      principalRecovered,
      profitRealized,
      unrecoveredPhoneCost,
    };
  });

  // 3. Collected cash: down payments + installments
  const totalDownPayments = contracts.reduce((sum, c) => sum + (c.pricing.downPayment || 0), 0);
  const totalInstallmentsCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalCashCollected = totalDownPayments + totalInstallmentsCollected;

  // 4. Planned total profit on all contracts:
  const totalExpectedProfit = contracts.reduce((sum, c) => sum + (c.pricing.totalProfit || 0), 0);

  // 5. Outstanding phone capital still with customers:
  const totalUnrecoveredPhoneCost = Math.max(0, totalPhonesCostAll - totalPrincipalRecovered);

  // 6. Available Cash Liquidity in Hand (سەرمایەی نەختینە بۆ کڕینی مۆبایلی نوێ):
  // Available = Initial Capital - Total Phone Outflow + Total Cash Inflow
  const availableCapital = Math.max(0, initialCapital - totalPhonesCostAll + totalCashCollected);

  // 7. Total Business Equity (کۆی بەهای هەژماری سەرمایە لەگەڵ تەنیا قازانجی ساف):
  // Initial Capital + ONLY the realized profit portion!
  const totalProjectEquity = initialCapital + totalRealizedProfit;

  // Estimated purchasing capacity
  const averagePhoneCost = 800000;
  const estimatedPhonesCapacity = Math.floor(availableCapital / averagePhoneCost);
  const capitalHistory = settings.capitalHistory || [];

  // Handlers for Capital
  const handleOpenDepositModal = () => {
    setDepositInput('');
    setDepositNote('تەقویەی سەرمایەی کار لە لایەن بەڕێوەبەر');
    setDepositModalOpen(true);
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanStr = depositInput.replace(/,/g, '').trim();
    const val = parseFloat(cleanStr);
    if (isNaN(val) || val <= 0) {
      alert('تکایە بڕێکی دروست بنووسە');
      return;
    }
    setSavingDeposit(true);
    const ok = await onSaveCapital(val, 'deposit', depositNote.trim());
    setSavingDeposit(false);
    if (ok) {
      setDepositModalOpen(false);
    }
  };

  const handleOpenCapitalModal = () => {
    setCapitalInput(String(settings.initialCapital || 10000000));
    setCapitalNote('ڕێکخستنەوەی سەرمایەی بنەڕەتی');
    setCapitalModalOpen(true);
  };

  const handleSaveCapitalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanStr = capitalInput.replace(/,/g, '').trim();
    const val = parseFloat(cleanStr);
    if (isNaN(val) || val < 0) {
      alert('تکایە بڕێکی دروست بنووسە');
      return;
    }
    setSavingCapital(true);
    const ok = await onSaveCapital(val, 'set', capitalNote.trim());
    setSavingCapital(false);
    if (ok) {
      setCapitalModalOpen(false);
    }
  };

  const handleOpenEditProfileModal = () => {
    setSellerNameInput(settings.sellerName || '');
    setShopNameInput(settings.shopName || '');
    setPhoneInput(settings.phone || '');
    setProfileModalOpen(true);
  };

  const handleSaveProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSaveSettings) return;
    setSavingProfile(true);
    try {
      await onSaveSettings({
        ...settings,
        sellerName: sellerNameInput.trim() || settings.sellerName,
        shopName: shopNameInput.trim() || settings.shopName,
        phone: phoneInput.trim() || settings.phone,
      });
      setProfileModalOpen(false);
    } catch {
      alert('هەڵە لە نوێکردنەوەی ناوی بەڕێوەبەر');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSaveSettings) return;
    setSavingSettings(true);
    try {
      await onSaveSettings({
        ...settings,
        sellerName: sellerNameInput.trim() || settings.sellerName,
        shopName: shopNameInput.trim() || settings.shopName,
        phone: phoneInput.trim() || settings.phone,
        defaultProfitRate: profitRateInput,
        usdExchangeRate: usdRateInput,
      });
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch {
      alert('هەڵە لە پاشەکەوتکردنی ڕێکخستنەکان');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleOpenNewUserModal = () => {
    setEditingUserId(null);
    setFullName('');
    setPhone('');
    setUsername('');
    setPassword('');
    setRole('deputy');
    setIsActive(true);
    setUserFormError('');
    setUserModalOpen(true);
  };

  const handleOpenEditUserModal = (user: AppUser) => {
    setEditingUserId(user.id);
    setFullName(user.fullName);
    setPhone(user.phone);
    setUsername(user.username);
    setPassword(user.password || '');
    setRole(user.role);
    setIsActive(user.isActive !== false);
    setUserFormError('');
    setUserModalOpen(true);
  };

  const handleSaveUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim() || !password.trim()) {
      setUserFormError('تکایە هەموو خانە پێویستەکان پڕبکەرەوە (ناو، یوزەر، پاسۆرد)');
      return;
    }
    setSavingUser(true);
    setUserFormError('');
    const success = await onSaveUser({
      id: editingUserId || undefined,
      fullName: fullName.trim(),
      phone: phone.trim(),
      username: username.trim(),
      password: password.trim(),
      role,
      isActive,
    });
    setSavingUser(false);
    if (success) {
      setUserModalOpen(false);
    } else {
      setUserFormError('هەڵە لە تۆمارکردن یان ئەم یوزەرە پێشتر بەکارهاتووە');
    }
  };

  const roleLabels: Record<UserRole, { label: string; badgeClass: string; desc: string }> = {
    manager: {
      label: 'بەڕێوەبەری گشتی',
      badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
      desc: 'دەسەڵاتی تەواو بەسەر سەرمایە، بەکارهێنەران، گرێبەست و ڕێکخستنەکان',
    },
    deputy: {
      label: 'جێگری بەڕێوەبەر',
      badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
      desc: 'دەتوانێت لەبری بەڕێوەبەر گرێبەستی نوێ تۆمار بکات و کڕیار زیاد بکات',
    },
    collector: {
      label: 'بەرپرسی وەرگرتنەوەی قیست',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      desc: 'تایبەت بە وەرگرتنی پارەی قیستە مانگانەکان و دەرکردنی وەسڵی فەرمی',
    },
    accountant: {
      label: 'ژمێریار',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      desc: 'بینینی حسابات، داهات، قازانج و ڕاپۆرتە داراییەکان بەبێ سڕینەوە',
    },
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-l from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-slate-700/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold">پڕۆفایلی بەڕێوەبەر و بەڕێوەبردنی سەرمایە</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {settings.sellerName || 'بەڕێوەبەری سەرەکی'}
                </span>
                <button
                  type="button"
                  onClick={handleOpenEditProfileModal}
                  className="px-2.5 py-1 text-xs text-blue-300 hover:text-white bg-blue-500/20 hover:bg-blue-500/40 border border-blue-400/30 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="گۆڕینی ناوی خۆم و دووکان"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>گۆڕینی ناوی خۆم</span>
                </button>
              </div>
              <p className="text-slate-300 text-xs mt-1">
                چاودێریکردنی سەرمایەی کار، پارەی ڕۆیشتوو بۆ کڕینی مۆبایلەکان، بڕی پارەی بەردەست بۆ گرێبەستی نوێ و بەڕێوەبردنی جێگر و کارمەندان
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenDepositModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>زیادکردنی پارە بۆ سەرمایە (Deposit)</span>
            </button>
            <button
              onClick={handleOpenCapitalModal}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-xl text-xs font-medium transition-all shadow-sm active:scale-95"
            >
              <Wallet className="w-4 h-4" />
              <span>ڕێکخستنی بنەڕەتی سەرمایە</span>
            </button>
            <button
              onClick={handleOpenNewUserModal}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium transition-all shadow-sm active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>جێگرەوە / کارمەند +</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs within Manager Panel */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-slate-700/70 overflow-x-auto">
          <button
            onClick={() => setActiveTab('capital')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'capital'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>سەرمایە، قازانج و نەختینە</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>تۆماری مێژووی زیادکردنی سەرمایە ({capitalHistory.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>جێگرەوەکان و دەستەی کار ({users.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'audit'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>تۆماری کارەکانی جێگر و کارمەندان</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            <span>ڕێکخستنەکانی بەڕێوەبەر و قازانج</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CAPITAL MANAGEMENT & ACCOUNTING INTEGRITY */}
      {activeTab === 'capital' && (
        <div className="space-y-6">
          {/* Main Financial KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1. Initial Capital */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500">سەرمایەی سەرەکی وەبەرهێنراو</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                {formatCurrency(initialCapital)}
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                <span>سەرمایەی دانراوی کارکردن</span>
                <button
                  onClick={handleOpenDepositModal}
                  className="text-emerald-700 hover:underline font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                >
                  پارە زیادبکە +
                </button>
              </div>
            </div>

            {/* 2. Capital Outflow / Phones Purchased */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500">تێچووی کڕینی مۆبایلەکان</span>
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-rose-600 tracking-tight font-mono">
                {formatCurrency(totalPhonesCostAll)}
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                <span>ڕەئسولماڵی گەڕاوە لە قیست:</span>
                <span className="text-emerald-700 font-bold font-mono">
                  {formatCurrency(totalPrincipalRecovered)}
                </span>
              </div>
            </div>

            {/* 3. Realized Profit ONLY */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500">تەنیا قازانجی سافی کۆکراوە</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-600 tracking-tight font-mono">
                {formatCurrency(totalRealizedProfit)}
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                <span>تەنها قازانج زیادکراوە</span>
                <span className="text-emerald-800 font-semibold font-mono">
                  پلاندانراو: {formatCurrency(totalExpectedProfit)}
                </span>
              </div>
            </div>

            {/* 4. Available Capital for New Contracts */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-blue-100">سەرمایەی ماوە بۆ گرێبەستی نوێ</span>
                <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center backdrop-blur-sm">
                  <Coins className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-white tracking-tight font-mono">
                {formatCurrency(availableCapital)}
              </div>
              <div className="mt-2 text-[11px] text-blue-100 flex items-center justify-between">
                <span>توانای کڕین بەم پارەیە:</span>
                <span className="font-bold text-white bg-white/20 px-2 py-0.5 rounded-md">
                  ~ {estimatedPhonesCapacity} مۆبایل
                </span>
              </div>
            </div>
          </div>

          {/* High-Impact Kurdish Accounting Rule Explanation Box */}
          <div className="bg-gradient-to-l from-amber-50/80 via-white to-amber-50/80 border border-amber-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                <Info className="w-5 h-5" />
              </div>
              <div className="space-y-1.5 text-xs text-amber-950">
                <h3 className="font-bold text-sm text-amber-900">
                  ڕێسای ژمێریاری سەرمایە و جیاکردنەوەی قازانج لە گەڕانەوەی پارە
                </h3>
                <p className="leading-relaxed">
                  کاتێک پارە لە سەرمایە دەڕوات بۆ کڕینی مۆبایل، لەگەڵ هاتنەوەی پێشەکی و قیستی مانگانە، سەرەتا تێچووی کڕینی مۆبایلەکە دەگەڕێتەوە ناو سەرمایە بۆ پڕکردنەوەی ئەوەی چووەتە دەرەوە (بەبێ ئەوەی سەرمایەی سەرەکی دووبارە بە هەڵە زیاد بکرێت).
                  دواتر هەر بڕە پارەیەک کە لەسەرووی تێچووی مۆبایلەکە وەردەگیرێت، <strong className="text-emerald-800 font-bold">تەنیا قازانجی ساف زیاد دەکرێت</strong> بۆ سەر قازانجی پڕۆژەکە.
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-4 text-[11px] font-medium text-amber-900 border-t border-amber-200/60 mt-2">
                  <span>کۆی بەهای هەژماری پڕۆژە (سەرمایە + تەنها قازانجی ساف): <strong className="font-mono text-emerald-800 font-bold">{formatCurrency(totalProjectEquity)}</strong></span>
                  <span>•</span>
                  <span>پارەی کڕینی مۆبایل کە هێشتا لای کڕیارەکانە و نەگەڕاوەتەوە: <strong className="font-mono text-rose-700 font-bold">{formatCurrency(totalUnrecoveredPhoneCost)}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Deep Capital Balance Analysis */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <span>شیکاری دارایی و هاوسەنگی سەرمایە (Liquidity & Capital Breakdown)</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Liquidity Formula card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
                <div className="font-bold text-slate-800 text-sm">هاوکێشەی نەختینەی بەردەست لە سندووق:</div>
                <div className="flex justify-between py-1.5 border-b border-slate-200 text-slate-600">
                  <span>سەرمایەی دانراو:</span>
                  <span className="font-bold text-slate-900 font-mono">{formatCurrency(initialCapital)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200 text-rose-600">
                  <span>- پارەی چووە دەرەوە بۆ کڕینی مۆبایل:</span>
                  <span className="font-bold font-mono">-{formatCurrency(totalPhonesCostAll)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200 text-emerald-600">
                  <span>+ پێشەکییە وەرگیراوەکان:</span>
                  <span className="font-bold font-mono">+{formatCurrency(totalDownPayments)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200 text-emerald-600">
                  <span>+ قیستە کۆکراوەکان:</span>
                  <span className="font-bold font-mono">+{formatCurrency(totalInstallmentsCollected)}</span>
                </div>
                <div className="flex justify-between pt-2 font-bold text-sm text-blue-700 bg-blue-50/70 p-2 rounded-lg">
                  <span>= پارەی بەردەست بۆ کڕینی نوێ:</span>
                  <span className="font-mono">{formatCurrency(availableCapital)}</span>
                </div>
              </div>

              {/* Profitability status */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
                <div className="font-bold text-slate-800 text-sm">دۆخی تەندروستی پڕۆژە:</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>قازانجی مانگانەی هەر مۆبایل:</span>
                    <span className="font-bold text-slate-900">{settings.defaultProfitRate || 2.5}% مانگانە</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>تێچووی گەڕاوەی مۆبایلەکان:</span>
                    <span className="font-bold text-emerald-700 font-mono">
                      {formatCurrency(totalPrincipalRecovered)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>تەنیا قازانجی زیادکراو:</span>
                    <span className="font-bold text-emerald-700 font-mono">
                      {formatCurrency(totalRealizedProfit)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>کۆی قەرزی ماوە لای خەڵک:</span>
                    <span className="font-bold text-amber-700 font-mono">
                      {formatCurrency(
                        contracts.reduce((sum, c) => {
                          const unpaid = c.schedule
                            .filter((i) => i.status !== 'paid')
                            .reduce((s, i) => s + i.amount, 0);
                          return sum + unpaid;
                        }, 0)
                      )}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[11px] leading-relaxed">
                  ✓ سیستم ڕێگری دەکات لە دووبارە زیادکردنەوەی سەرمایە لە کاتی گەڕانەوەی قیست و تەنیا قازانجی ساف زیاد دەکات.
                </div>
              </div>

              {/* Quick Action Guide */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3 flex flex-col justify-between">
                <div>
                  <div className="font-bold text-slate-800 text-sm mb-2">کردارە خێراکان:</div>
                  <p className="text-slate-600 leading-relaxed text-[11px] mb-3">
                    دەتوانیت هەر کات ویستت بە دڵی خۆت پارە بخەیتە سەر سەرمایەکەت بەبێ هیچ سنووردارکردنێکی ژمارە، وە کاتی زیادکردنەکە لە مێژوو دەمێنێتەوە.
                  </p>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={handleOpenDepositModal}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>زیادکردنی پارە بۆ سەرمایە (Deposit)</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>بینینی مێژووی زیادکردنی سەرمایە</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CAPITAL DEPOSIT HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                <span>تۆماری مێژووی زیادکردنی سەرمایە (Capital Deposit History)</span>
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">
                هەموو ئەو کاتانەی کە پارەت خستووەتە سەر سەرمایەی کار بە ڕێکەوت، کات، بڕ و تێبینی تۆمار کراون.
              </p>
            </div>
            <button
              onClick={handleOpenDepositModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>زیادکردنی پارەی نوێ بۆ سەرمایە</span>
            </button>
          </div>

          {capitalHistory.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">هیچ مێژوویەکی زیادکردنی پارە تۆمار نەکراوە</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                کاتێک پارە دەخەیتە سەر سەرمایەی پڕۆژەکە لە ڕێگەی دوگمەی «زیادکردنی پارە بۆ سەرمایە»، بەروار و کاتەکەی لێرە تۆمار دەبێت.
              </p>
              <button
                onClick={handleOpenDepositModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500"
              >
                <PlusCircle className="w-4 h-4" />
                <span>زیادکردنی یەکەم بڕی سەرمایە</span>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="p-3.5">#</th>
                      <th className="p-3.5">ڕێکەوت و کاتی زیادکردن</th>
                      <th className="p-3.5">جۆری کردار</th>
                      <th className="p-3.5">بڕی زیادکراو</th>
                      <th className="p-3.5">کۆی سەرمایە دوای کردارەکە</th>
                      <th className="p-3.5">تێبینی / سەرچاوەی پارە</th>
                      <th className="p-3.5">تۆمارکار</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {capitalHistory.map((item, idx) => {
                      const formattedDate = new Date(item.date).toLocaleString('ar-IQ', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <tr key={item.id || idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5 font-mono text-slate-400">{idx + 1}</td>
                          <td className="p-3.5 font-medium text-slate-800 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-blue-500" />
                            <span>{formattedDate}</span>
                          </td>
                          <td className="p-3.5">
                            {item.type === 'deposit' ? (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                زیادکردن بۆ سەرمایە
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                ڕێکخستنی بنەڕەتی
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 font-mono font-bold text-sm text-emerald-600">
                            +{formatCurrency(item.amount)}
                          </td>
                          <td className="p-3.5 font-mono font-bold text-slate-900">
                            {formatCurrency(item.balanceAfter)}
                          </td>
                          <td className="p-3.5 text-slate-600">
                            {item.note || 'تەقویەی سەرمایەی کار'}
                          </td>
                          <td className="p-3.5 text-slate-500 font-medium">
                            {item.addedBy || settings.sellerName || 'بەڕێوەبەری سەرەکی'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: MANAGER SYSTEM SETTINGS (PROFIT RATE & USD EXCHANGE) */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-blue-600" />
              <span>ڕێکخستنەکانی سیستەم تایبەت بە بەڕێوەبەر</span>
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              لێرەدا دەتوانیت ناوی بەڕێوەبەر، ناوی پڕۆژە/دووکان و ڕێژەی قازانجی مانگانەی قیست جێگیر بکەیت.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm max-w-2xl">
            {settingsSuccess && (
              <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>ڕێکخستنەکان بە سەرکەوتوویی پاشەکەوت کران!</span>
              </div>
            )}

            <form onSubmit={handleSaveSettingsSubmit} className="space-y-5">
              
              {/* Profile & Identity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>ناوی بەڕێوەبەر (ناوی تەواوی خۆت): *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={sellerNameInput}
                    onChange={(e) => setSellerNameInput(e.target.value)}
                    placeholder="بۆ نموونە: سەردەم صادق"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    ئەم ناوە لەسەر هەموو گرێبەستەکان، وەسڵەکان و سیستەمەکە وەک خاوەنی سەرەکی دەردەکەوێت.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                    <span>ناوی دووکان یان پڕۆژە: *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={shopNameInput}
                    onChange={(e) => setShopNameInput(e.target.value)}
                    placeholder="بۆ نموونە: کۆگای مۆبایل و قیست"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    ناونیشانی فەرمی دووکان بۆ سەرەوەی لاپەڕە و گرێبەستەکان.
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    ژمارەی مۆبایلی فەرمی پەیوەندی:
                  </label>
                  <input
                    type="text"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="0750 000 0000"
                    className="w-full sm:w-80 px-4 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-sm text-slate-900 text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span>ڕێژەی قازانجی مانگانەی قیست (%) - جێگیرکراو بۆ تەواوی سیستەم:</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max="100"
                    required
                    value={profitRateInput}
                    onChange={(e) => setProfitRateInput(Number(e.target.value))}
                    className="w-36 px-4 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-base text-blue-900 text-left"
                    dir="ltr"
                  />
                  <span className="text-xs text-slate-600 font-bold">% بۆ هەر مانگێک</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                  ئەم ڕێژەیە (بۆ نموونە 2.5%) بە شێوەیەکی جێگیر دادەنرێت لە حیساباتی گرێبەستی نوێدا و هیچ جێگرێک یان کارمەندێک ناتوانێت دەستکاری بکات جگە لە تۆ لێرەدا.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {savingSettings ? 'پاشەکەوت دەکرێت...' : 'پاشەکەوتکردنی ڕێکخستنەکان'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: STAFF & USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-base font-bold text-slate-900">هەژماری جێگرەوە و کارمەندان (User Roles)</h2>
              <p className="text-slate-500 text-xs mt-0.5">
                دروستکردنی یوزەر و پاسۆردی تایبەت بۆ کارمەندان بەپێی دەسەڵاتی دیاریکراو
              </p>
            </div>
            <button
              onClick={handleOpenNewUserModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>زیادکردنی کارمەندی نوێ</span>
            </button>
          </div>

          {/* Master Manager Card */}
          <div className="bg-gradient-to-l from-slate-900 to-slate-800 rounded-2xl p-5 text-white border border-slate-700 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-white">{settings.sellerName || 'بەڕێوەبەری سەرەکی'}</span>
                    <button
                      type="button"
                      onClick={handleOpenEditProfileModal}
                      className="px-2 py-0.5 text-[11px] text-blue-300 hover:text-white bg-blue-500/20 hover:bg-blue-500/40 border border-blue-400/30 rounded flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>گۆڕینی ناو</span>
                    </button>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/30 text-purple-300 border border-purple-500/40">
                      بەڕێوەبەری سەرەکی (Master Admin)
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 mt-1 flex items-center gap-3">
                    <span>یوزەر: <code className="text-amber-300 font-mono">sss.barzaniii</code></span>
                    <span>دەسەڵات: تەواوی سیستەم</span>
                  </div>
                </div>
              </div>
              <div className="text-xs text-slate-400 hidden sm:block">
                هەژماری هەمیشەیی بەڕێوەبەر
              </div>
            </div>
          </div>

          {/* Employees List */}
          {users.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">هیچ جێگرەوە یان کارمەندێک دروست نەکراوە</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                دەتوانیت جێگری بەڕێوەبەر، وەرگری قیست یان ژمێریار دروست بکەیت تا بە یوزەر و پاسۆردی خۆیان کارەکان ڕاییکەن.
              </p>
              <button
                onClick={handleOpenNewUserModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>دروستکردنی یەکەم جێگرەوە</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map((user) => {
                const roleMeta = roleLabels[user.role] || roleLabels.deputy;
                const isPassVisible = !!showPasswords[user.id];

                return (
                  <div
                    key={user.id}
                    className={`bg-white rounded-2xl p-5 border transition-all shadow-sm hover:shadow-md ${
                      user.isActive === false ? 'border-slate-200 opacity-60 bg-slate-50' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{user.fullName}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{user.phone || 'بێ ژمارەی مۆبایل'}</div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${roleMeta.badgeClass}`}>
                        {roleMeta.label}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-2 mb-4 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                      {roleMeta.desc}
                    </p>

                    {/* Credentials Box */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 text-xs space-y-1.5 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[11px]">ناوی بەکارهێنەر:</span>
                        <code className="font-bold text-slate-800 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                          {user.username}
                        </code>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[11px]">وشەی نهێنی:</span>
                        <div className="flex items-center gap-1.5">
                          <code className="font-bold text-slate-800 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                            {isPassVisible ? user.password : '••••••••'}
                          </code>
                          <button
                            type="button"
                            onClick={() =>
                              setShowPasswords((prev) => ({ ...prev, [user.id]: !prev[user.id] }))
                            }
                            className="text-slate-400 hover:text-slate-600 p-1"
                          >
                            {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-1.5">
                        {user.isActive !== false ? (
                          <span className="flex items-center gap-1 text-emerald-600 font-medium text-[11px]">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>چالاکە</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-rose-600 font-medium text-[11px]">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>ناچالاکە</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditUserModal(user)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="دەستکاری"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm(`دڵنیایت لە سڕینەوەی هەژماری (${user.fullName})؟`)) {
                              await onDeleteUser(user.id);
                            }
                          }}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="سڕینەوە"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AUDIT TRAIL / ACTIVITY TRACKER */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-1">
              تۆماری کار و بەرپرسیارێتییەکان (Staff Audit Trail)
            </h2>
            <p className="text-xs text-slate-500">
              ئەم بەشە بە وردی نیشانت دەدات کێ لە جێگرەکان یان کارمەندان چ گرێبەستێکی تۆمار کردووە و کێ قیستەکانی وەرگرتووەتەوە
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 1. Contracts Registered by Staff */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">گرێبەستە تۆمارکراوەکان بەپێی جێگر</h3>
                </div>
                <span className="text-xs text-slate-500 font-semibold">{contracts.length} گرێبەست</span>
              </div>

              {contracts.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">هیچ گرێبەستێک تۆمار نەکراوە</div>
              ) : (
                <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                  {contracts.map((ct) => {
                    const creatorName = ct.createdBy?.userName || settings.sellerName || 'بەڕێوەبەری گشتی';
                    const creatorRole = ct.createdBy?.role || 'manager';

                    return (
                      <div
                        key={ct.id}
                        className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/70 text-xs transition-colors"
                      >
                        <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                          <span>{ct.customerName}</span>
                          <span className="text-blue-600 font-mono">{formatCurrency(ct.pricing.totalInstallmentPrice)}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500 text-[11px]">
                          <span>{ct.device.model} ({ct.device.storage})</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">تۆمارکراوە لەلایەن:</span>
                            <span className="font-semibold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                              {creatorName} ({roleLabels[creatorRole]?.label || creatorRole})
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Payments Collected by Staff */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">قیستە وەرگیراوەکان بەپێی کارمەند</h3>
                </div>
                <span className="text-xs text-slate-500 font-semibold">{payments.length} وەسڵ</span>
              </div>

              {payments.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">هیچ پارەیەک وەرنەگیراوە</div>
              ) : (
                <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                  {payments.map((p) => {
                    const collectorName = p.collectedBy?.userName || settings.sellerName || 'بەڕێوەبەری گشتی';

                    return (
                      <div
                        key={p.id}
                        className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/70 text-xs transition-colors"
                      >
                        <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                          <div className="flex items-center gap-2">
                            <span>{p.customerName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">#{p.receiptNumber}</span>
                          </div>
                          <span className="text-emerald-600 font-mono font-bold">+{formatCurrency(p.amount)}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500 text-[11px]">
                          <span>بەروار: {p.date}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">وەرگیراوە لەلایەن:</span>
                            <span className="font-semibold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                              {collectorName}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* MODAL 1: DEPOSIT MONEY TO CAPITAL (FREE DIGITS & INSTANT LOG) */}
      {depositModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200 text-slate-900">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">زیادکردنی پارە بۆ سەرمایە (Deposit)</h3>
                  <p className="text-[11px] text-slate-500">هەر بڕە پارەیەک کە دەتەوێت دەتوانیت زیادی بکەیت بەبێ سنوور</p>
                </div>
              </div>
              <button
                onClick={() => setDepositModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDepositSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  بڕی پارەی زیادکراو بۆ سەرمایە (دیناری عێراقی): *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="1"
                    value={depositInput}
                    onChange={(e) => setDepositInput(e.target.value)}
                    required
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-left font-mono font-bold text-lg text-emerald-800"
                    placeholder="بۆ نموونە: 5000000"
                  />
                  <span className="absolute left-3 top-3.5 text-xs text-slate-400 font-bold">دینار</span>
                </div>
                {depositInput && !isNaN(Number(depositInput)) && Number(depositInput) > 0 && (
                  <div className="mt-1.5 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs flex justify-between items-center text-emerald-900">
                    <span>بڕی خوێندنەوە:</span>
                    <strong className="font-mono">{formatCurrency(Number(depositInput))}</strong>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  تێبینی یان هۆکاری زیادکردن:
                </label>
                <input
                  type="text"
                  value={depositNote}
                  onChange={(e) => setDepositNote(e.target.value)}
                  placeholder="بۆ نموونە: تەقویەی سەرمایە، کڕینی وەجبەی نوێ، پارەی کاش"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Balance comparison */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>سەرمایەی پێشوو:</span>
                  <span className="font-mono font-bold text-slate-800">{formatCurrency(initialCapital)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold border-t border-slate-200 pt-1.5">
                  <span>سەرمایە دوای زیادکردن:</span>
                  <span className="font-mono text-sm">
                    {formatCurrency(initialCapital + (Number(depositInput) || 0))}
                  </span>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                {[1000000, 5000000, 10000000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setDepositInput(String(preset))}
                    className="px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-50 text-slate-700"
                  >
                    +{formatCurrency(preset)}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDepositModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  disabled={savingDeposit}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  {savingDeposit ? 'زیاد دەکرێت...' : 'پاشەکەوتکردن و خستنەسەری پارە'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT BASE CAPITAL */}
      {capitalModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200 text-slate-900">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">ڕێکخستنەوەی بنەڕەتی سەرمایە</h3>
                  <p className="text-[11px] text-slate-500">کۆی بڕی سەرمایەی کارکردن لە پڕۆژەکە بنووسە</p>
                </div>
              </div>
              <button
                onClick={() => setCapitalModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCapitalSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  کۆی سەرمایە بە دیناری عێراقی (IQD):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={capitalInput}
                    onChange={(e) => setCapitalInput(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-left font-mono font-bold text-lg"
                    placeholder="10000000"
                  />
                  <span className="absolute left-3 top-3.5 text-xs text-slate-400 font-bold">دینار</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  دەتوانیت هەر ژمارەیەک بنووسیت بە دڵی خۆت بەبێ سنووردارکردن.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  هۆکار یان تێبینی:
                </label>
                <input
                  type="text"
                  value={capitalNote}
                  onChange={(e) => setCapitalNote(e.target.value)}
                  placeholder="ڕێکخستنەوەی سەرمایە"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              {/* Quick selectors */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                {[5000000, 10000000, 20000000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCapitalInput(String(preset))}
                    className="px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-50 text-slate-700"
                  >
                    {formatCurrency(preset)}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCapitalModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  disabled={savingCapital}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingCapital ? 'خەزن دەکرێت...' : 'پاشەکەوتکردن'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE / EDIT STAFF MEMBER */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-slate-200 text-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {editingUserId ? 'دەستکاریکردنی هەژماری کارمەند' : 'دروستکردنی جێگرەوە / کارمەندی نوێ'}
                  </h3>
                  <p className="text-[11px] text-slate-500">یوزەر، پاسۆرد و دەسەڵاتی کارمەند دیاری بکە</p>
                </div>
              </div>
              <button
                onClick={() => setUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            {userFormError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{userFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveUserSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ناوی تەواوی کارمەند: *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="نموونە: هێمن کاروان"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ژمارەی مۆبایل:
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0750 000 0000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Username & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    ناوی بەکارهێنەر (Username): *
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="hemn.qist"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500 text-left"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    وشەی نهێنی (Password): *
                  </label>
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Hemn@1234"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500 text-left"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  دەسەڵات و پۆستی کارمەند (Role):
                </label>
                <div className="space-y-2">
                  
                  {/* Deputy */}
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      role === 'deputy'
                        ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="deputy"
                      checked={role === 'deputy'}
                      onChange={() => setRole('deputy')}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">جێگری بەڕێوەبەر (Deputy Manager)</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        دەتوانێت لەبری تۆ بچێتە ژوورەوە و گرێبەستی نوێی مۆبایل تۆمار بکات، ناوی خۆی لەسەر گرێبەستەکە دەمێنێتەوە.
                      </div>
                    </div>
                  </label>

                  {/* Collector */}
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      role === 'collector'
                        ? 'border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="collector"
                      checked={role === 'collector'}
                      onChange={() => setRole('collector')}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">بەرپرسی وەرگرتنەوەی قیست (Cashier / Collector)</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        تایبەت بە وەرگرتنی قیستی مانگانە، تۆمارکردنی وەسڵ و پرنتکردنی پسوولەی پارەدان.
                      </div>
                    </div>
                  </label>

                  {/* Accountant */}
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      role === 'accountant'
                        ? 'border-amber-600 bg-amber-50/60 ring-1 ring-amber-600'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="accountant"
                      checked={role === 'accountant'}
                      onChange={() => setRole('accountant')}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">ژمێریاری پڕۆژە (Accountant)</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        پێداچوونەوە و چاودێری هەموو حیسابات، داهات و قازانج بەبێ مافی سڕینەوەی داتا بنەڕەتییەکان.
                      </div>
                    </div>
                  </label>

                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="font-semibold text-slate-700">دۆخی هەژمار:</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  <span className="mr-3 text-xs font-semibold text-slate-700">
                    {isActive ? 'چالاکە' : 'ناچالاک'}
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  disabled={savingUser}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingUser ? 'تۆمار دەکرێت...' : 'تۆمارکردن'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PROFILE / NAME MODAL */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">گۆڕینی ناوی بەڕێوەبەر و دووکان</h3>
                  <p className="text-slate-500 text-xs">ناوی ڕاستەقینەی خۆت لێرە بنووسە بۆ هەموو بەشەکانی سیستم</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfileSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  ناوی بەڕێوەبەر (ناوی تەواوی خۆت): *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={sellerNameInput}
                  onChange={(e) => setSellerNameInput(e.target.value)}
                  placeholder="ناوی خۆت بنووسە"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  ئەم ناوە دەبێتە خاوەنی سەرەکی لە سەرەوەی لاپەڕە، پڕۆفایل و هەموو گرێبەستەکان.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  ناوی دووکان یان پڕۆژە: *
                </label>
                <input
                  type="text"
                  required
                  value={shopNameInput}
                  onChange={(e) => setShopNameInput(e.target.value)}
                  placeholder="ناوی دووکانەکەت بنووسە"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  ژمارەی مۆبایل:
                </label>
                <input
                  type="text"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="0750 000 0000"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-sm text-slate-900 text-left"
                  dir="ltr"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {savingProfile ? 'پاشەکەوت دەکرێت...' : 'پاشەکەوتکردنی ناو'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

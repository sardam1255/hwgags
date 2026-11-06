import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  User, 
  Smartphone, 
  Calendar, 
  FileCheck, 
  Check, 
  Printer, 
  DollarSign,
  AlertCircle,
  Lock,
  ArrowRightLeft
} from 'lucide-react';
import { Customer, Contract, ShopSettings, UserRole } from '../types/index.ts';
import { 
  calculateInstallment, 
  generateInstallmentSchedule, 
  getDefaultFirstInstallmentDate, 
  formatCurrency 
} from '../utils/calculations.ts';

interface Props {
  customers: Customer[];
  settings: ShopSettings;
  currentUser?: { id?: string; username: string; name: string; role?: UserRole } | null;
  availableCapital?: number;
  onSaveContract: (contract: Contract, newCustomer?: Customer) => Promise<Contract>;
  onOpenContractPrint: (contract: Contract, mode: 'legal' | 'bank') => void;
}

export const ContractCalculatorView: React.FC<Props> = ({
  customers,
  settings,
  currentUser,
  availableCapital,
  onSaveContract,
  onOpenContractPrint,
}) => {
  // Customer selection or new
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerIdNumber, setCustomerIdNumber] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerWorkplace, setCustomerWorkplace] = useState('');
  const [customerSalaryBank, setCustomerSalaryBank] = useState('');
  const [customerBankAccount, setCustomerBankAccount] = useState('');

  // Guarantor
  const [guarantorName, setGuarantorName] = useState('');
  const [guarantorId, setGuarantorId] = useState('');
  const [guarantorPhone, setGuarantorPhone] = useState('');
  const [guarantorWorkplace, setGuarantorWorkplace] = useState('');

  // Device Info
  const [deviceModel, setDeviceModel] = useState('');
  const [deviceColor, setDeviceColor] = useState('');
  const [deviceStorage, setDeviceStorage] = useState('128GB');
  const [imei1, setImei1] = useState('');
  const [imei2, setImei2] = useState('');
  const [os, setOs] = useState<'ios' | 'android'>('ios');

  // Pricing & Terms (Single clean phone price input)
  const [phonePrice, setPhonePrice] = useState<number>(0);
  const [enableOwnerFee, setEnableOwnerFee] = useState<boolean>(settings.enableOwnerFee);
  const [ownerFeeAmount, setOwnerFeeAmount] = useState<number>(settings.ownerFeeAmount || 50000);
  const [downPayment, setDownPayment] = useState<number>(0);
  const [months, setMonths] = useState<number>(6);
  // Profit rate is locked to Manager profile settings!
  const profitRate = settings.defaultProfitRate || 2.5;

  // Dates & Schedule
  const [firstInstallmentDate, setFirstInstallmentDate] = useState<string>(getDefaultFirstInstallmentDate());
  const [dueDayType, setDueDayType] = useState<'salary_day' | 'fixed_day'>('salary_day');
  const [dueDayNumber, setDueDayNumber] = useState<number>(25);
  const [securityCheckAmount, setSecurityCheckAmount] = useState<number>(0);

  // Saving state
  const [saving, setSaving] = useState(false);
  const [successContract, setSuccessContract] = useState<Contract | null>(null);

  // When picking an existing customer, auto fill fields
  const handleCustomerSelect = (id: string) => {
    setSelectedCustomerId(id);
    const found = customers.find((c) => c.id === id);
    if (found) {
      setCustomerName(found.fullName);
      setCustomerIdNumber(found.idNumber);
      setCustomerPhone(found.phone);
      setCustomerWorkplace(found.workplace);
      setCustomerSalaryBank(found.salaryBank);
      setCustomerBankAccount(found.bankAccountNumber);
      setGuarantorName(found.guarantorName || '');
      setGuarantorId(found.guarantorId || '');
      setGuarantorPhone(found.guarantorPhone || '');
      setGuarantorWorkplace(found.guarantorWorkplace || '');
    } else {
      setCustomerName('');
      setCustomerIdNumber('');
      setCustomerPhone('');
      setCustomerWorkplace('');
      setCustomerSalaryBank('');
      setCustomerBankAccount('');
      setGuarantorName('');
      setGuarantorId('');
      setGuarantorPhone('');
      setGuarantorWorkplace('');
    }
  };

  // Live calculation results
  const calculation = useMemo(() => {
    return calculateInstallment({
      cashPrice: phonePrice,
      purchaseCost: phonePrice,
      downPayment,
      months,
      monthlyProfitRate: profitRate,
      ownerFee: ownerFeeAmount,
      enableOwnerFee,
    });
  }, [phonePrice, downPayment, months, profitRate, ownerFeeAmount, enableOwnerFee]);

  // Live schedule with exact remainder balancing so sum equals remainingBalance
  const schedule = useMemo(() => {
    return generateInstallmentSchedule(
      months,
      calculation.monthlyInstallmentAmount,
      firstInstallmentDate,
      dueDayType === 'fixed_day' ? dueDayNumber : undefined,
      calculation.remainingBalance
    );
  }, [months, calculation.monthlyInstallmentAmount, calculation.remainingBalance, firstInstallmentDate, dueDayType, dueDayNumber]);

  const lastInstallmentDate = schedule[schedule.length - 1]?.dueDate || '';

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('تکایە ناوی کڕیار بنووسە');
      return;
    }
    if (!deviceModel.trim()) {
      alert('تکایە جۆری مۆبایل بنووسە');
      return;
    }
    if (phonePrice <= 0) {
      alert('تکایە نرخی مۆبایل بنووسە');
      return;
    }

    setSaving(true);

    try {
      let custId = selectedCustomerId;
      let newCustObj: Customer | undefined;

      if (!custId) {
        custId = 'CUST-' + Date.now();
        newCustObj = {
          id: custId,
          fullName: customerName,
          idNumber: customerIdNumber,
          phone: customerPhone,
          workplace: customerWorkplace,
          salaryBank: customerSalaryBank,
          bankAccountNumber: customerBankAccount,
          guarantorName,
          guarantorId,
          guarantorPhone,
          guarantorWorkplace,
          createdAt: new Date().toISOString(),
        };
      }

      const newContract: Contract = {
        id: 'CT-' + Date.now(),
        contractNumber: 'QIST-' + Math.floor(1000 + Math.random() * 9000),
        customerId: custId,
        customerName,
        customerPhone,
        device: {
          model: deviceModel,
          color: deviceColor,
          storage: deviceStorage,
          imei1,
          imei2,
          os,
        },
        pricing: calculation,
        schedule,
        dueDayType,
        dueDayNumber: dueDayType === 'fixed_day' ? dueDayNumber : undefined,
        firstInstallmentDate,
        lastInstallmentDate,
        securityCheckAmount: securityCheckAmount || calculation.remainingBalance,
        status: 'active',
        legalTerms: settings.customLegalTerms,
        createdAt: new Date().toISOString(),
        createdBy: currentUser ? {
          userId: currentUser.id || currentUser.username,
          userName: currentUser.name,
          role: currentUser.role || 'manager',
        } : undefined,
      };

      const saved = await onSaveContract(newContract, newCustObj);
      setSuccessContract(saved);
    } catch {
      alert('هەڵە لە پاشەکەوتکردنی گرێبەستەکە');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              <span>تۆمارکردنی گرێبەستی نوێ و ژمێریاری قیست</span>
            </h1>
            {currentUser && (
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                تۆمارکار: {currentUser.name} ({currentUser.role === 'deputy' ? 'جێگری بەڕێوەبەر' : 'بەڕێوەبەر'})
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
            <span>حیسابکردنی ئۆتۆماتیکی قیست، ڕێژەی قازانج، پارەی ماوە و ڕێکخستنی بەرواری مووچە</span>
            {availableCapital !== undefined && (
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                سەرمایەی بەردەستی پڕۆژە: {formatCurrency(availableCapital)}
              </span>
            )}
          </div>
        </div>

        {successContract && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenContractPrint(successContract, 'legal')}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>پرینتی گرێبەست (A4)</span>
            </button>
            <button
              onClick={() => onOpenContractPrint(successContract, 'bank')}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>پرینتی فۆرمی بانکی (A4)</span>
            </button>
          </div>
        )}
      </div>

      {successContract && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-emerald-900 text-xs">
            <Check className="w-5 h-5 text-emerald-600 bg-emerald-100 rounded-full p-0.5" />
            <div>
              <span className="font-bold">گرێبەستەکە بە سەرکەوتوویی تۆمارکرا! </span>
              <span>ژمارەی گرێبەست: <strong>{successContract.contractNumber}</strong></span>
            </div>
          </div>
          <button
            onClick={() => setSuccessContract(null)}
            className="text-xs text-emerald-700 hover:underline"
          >
            تۆمارکردنی گرێبەستێکی تر
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Input Sections */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: Customer Details */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <User className="w-4 h-4 text-blue-600" />
                <span>یەکەم: زانیارییەکانی کڕیار و کفیل</span>
              </div>

              {customers.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">کڕیاری پێشوو:</span>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800"
                  >
                    <option value="">-- کڕیاری نوێ بنووسە --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName} ({c.phone})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  ناوی تەواوی کڕیار *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="ناوی چواری بنووسە"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  ژمارەی مۆبایلی کڕیار *
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="0750 000 0000"
                  dir="ltr"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:ring-1 focus:ring-blue-500 text-right font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  ژ. ناسنامەی نیشتمانی / پاسپۆرت
                </label>
                <input
                  type="text"
                  value={customerIdNumber}
                  onChange={(e) => setCustomerIdNumber(e.target.value)}
                  placeholder="ژمارەی ناسنامە بنووسە"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  شوێنی کاری کڕیار (فەرمانگە / شوێن)
                </label>
                <input
                  type="text"
                  value={customerWorkplace}
                  onChange={(e) => setCustomerWorkplace(e.target.value)}
                  placeholder="وەزارەت، فەرمانگە، کۆمپانیا یان کاسب"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  ناوی بانکی مووچە (ئەگەر مووچەخۆرە)
                </label>
                <input
                  type="text"
                  value={customerSalaryBank}
                  onChange={(e) => setCustomerSalaryBank(e.target.value)}
                  placeholder="RT Bank، TBI، جیهان، هەرێم..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  ژمارەی حیسابی بانکی (Account No)
                </label>
                <input
                  type="text"
                  value={customerBankAccount}
                  onChange={(e) => setCustomerBankAccount(e.target.value)}
                  placeholder="ژمارەی هەژماری بانکی بنووسە"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:ring-1 focus:ring-blue-500 font-mono"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Guarantor Details */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 mb-2">
                زانیارییەکانی لایەنی سێیەم (کفیل)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 mb-1">ناوی تەواوی کفیل</label>
                  <input
                    type="text"
                    value={guarantorName}
                    onChange={(e) => setGuarantorName(e.target.value)}
                    placeholder="ناوی کەفیل بنووسە"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">ژ. مۆبایلی کفیل</label>
                  <input
                    type="tel"
                    value={guarantorPhone}
                    onChange={(e) => setGuarantorPhone(e.target.value)}
                    placeholder="0750 000 0000"
                    dir="ltr"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white text-right font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">ژمارەی کارت / ناسنامەی کفیل</label>
                  <input
                    type="text"
                    value={guarantorId}
                    onChange={(e) => setGuarantorId(e.target.value)}
                    placeholder="ژمارەی ناسنامە"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">شوێنی کاری کفیل</label>
                  <input
                    type="text"
                    value={guarantorWorkplace}
                    onChange={(e) => setGuarantorWorkplace(e.target.value)}
                    placeholder="فەرمانگە / شوێنی کار"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Mobile Information */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4 text-slate-900 font-bold text-sm">
              <Smartphone className="w-4 h-4 text-blue-600" />
              <span>دووەم: زانیارییەکانی مۆبایلەکە</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  جۆری مۆبایل (مۆدێل) *
                </label>
                <input
                  type="text"
                  required
                  value={deviceModel}
                  onChange={(e) => setDeviceModel(e.target.value)}
                  placeholder="iPhone 16 Pro Max, S25 Ultra..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  ڕەنگی مۆبایل
                </label>
                <input
                  type="text"
                  value={deviceColor}
                  onChange={(e) => setDeviceColor(e.target.value)}
                  placeholder="ڕەش، تیتانیۆم، سپی، ئاڵتوونی..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  بیرگە (Storage)
                </label>
                <select
                  value={deviceStorage}
                  onChange={(e) => setDeviceStorage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white font-mono"
                >
                  <option value="64GB">64 GB</option>
                  <option value="128GB">128 GB</option>
                  <option value="256GB">256 GB</option>
                  <option value="512GB">512 GB</option>
                  <option value="1TB">1 TB</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  سیستەمی کارپێکەر (OS)
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOs('ios')}
                    className={`flex-1 py-2 text-center rounded-lg border text-xs font-medium transition-colors ${
                      os === 'ios'
                        ? 'bg-blue-50 border-blue-600 text-blue-700 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    ئایفۆن (iOS)
                  </button>
                  <button
                    type="button"
                    onClick={() => setOs('android')}
                    className={`flex-1 py-2 text-center rounded-lg border text-xs font-medium transition-colors ${
                      os === 'android'
                        ? 'bg-blue-50 border-blue-600 text-blue-700 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    ئەندرۆید (Android)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  ژمارەی IMEI 1
                </label>
                <input
                  type="text"
                  value={imei1}
                  onChange={(e) => setImei1(e.target.value)}
                  placeholder="350000000000000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white font-mono tracking-wider"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  ژمارەی IMEI 2 (ئارەزوومەندانە)
                </label>
                <input
                  type="text"
                  value={imei2}
                  onChange={(e) => setImei2(e.target.value)}
                  placeholder="350000000000000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white font-mono tracking-wider"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Pricing, Profit & 50,000 Fee */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>سێیەم: حیساباتی نرخ، قازانج و قیست</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                مامەڵە و حیسابات: <span className="font-bold text-slate-700">بە دیناری عێراقی (IQD)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  نرخی مۆبایل (دینار) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={phonePrice || ''}
                  onChange={(e) => setPhonePrice(Number(e.target.value))}
                  placeholder="بۆ نموونە: 1000000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white font-mono text-base font-bold text-blue-900"
                  dir="ltr"
                />
                <div className="mt-1 text-[11px]">
                  <span className="text-[10px] text-slate-400">تەنها نرخی مۆبایل بە دینار بنووسە</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  بڕی پێشەکی (دینار)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={downPayment || ''}
                  onChange={(e) => setDownPayment(Number(e.target.value))}
                  placeholder="بۆ نموونە: 200000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white font-mono text-base font-bold text-emerald-800"
                  dir="ltr"
                />
                <div className="mt-1 text-[11px]">
                  <span className="text-[10px] text-slate-400">ئەگەر پێشەکی نییە بە 0 جێی بهێڵە</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  ماوەی قیست (چەند مانگ) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={months}
                  onChange={(e) => setMonths(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white font-mono text-base font-bold"
                  dir="ltr"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">بۆ نموونە: 6، 10، 12 مانگ</span>
              </div>

              {/* Locked 2.5% Profit Rate Input */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 font-medium">
                    ڕێژەی قازانج بۆ هەر مانگێک (%)
                  </label>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-300">
                    <Lock className="w-3 h-3" />
                    جێگیرکراوە
                  </span>
                </div>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={`${profitRate}% بۆ هەر مانگێک`}
                  className="w-full bg-slate-100/90 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono text-base font-bold cursor-not-allowed select-none"
                  dir="ltr"
                />
                <span className="text-[10px] text-slate-500 mt-1.5 block leading-tight">
                  🔒 تەنیا لە پڕۆفایلی بەڕێوەبەر دەتوانیت دەستکاری ئەم ڕێژەیە بکەیت.
                </span>
              </div>


              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  بڕی چێکی مسۆگەری / بارمتە (دینار)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={securityCheckAmount || ''}
                  onChange={(e) => setSecurityCheckAmount(Number(e.target.value))}
                  placeholder="خۆکار: هەمان پارەی ماوە"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white font-mono"
                  dir="ltr"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">بە شێوەی خۆکار یەکسانە بە پارەی ماوە</span>
              </div>
            </div>

            {/* 50,000 IQD Owner Fee Toggle (As specifically requested by user) */}
            <div className="mt-4 p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enableOwnerFee"
                  checked={enableOwnerFee}
                  onChange={(e) => setEnableOwnerFee(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="enableOwnerFee" className="text-amber-950 font-medium cursor-pointer">
                  زیادکردنی {ownerFeeAmount.toLocaleString()} دینار خەرجی مامەڵە لەسەر نرخی مۆبایل بە ئۆتۆماتیکی بۆ خاوەن قیست
                </label>
              </div>

              {enableOwnerFee && (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="any"
                    value={ownerFeeAmount}
                    onChange={(e) => setOwnerFeeAmount(Number(e.target.value))}
                    className="w-24 bg-white border border-amber-300 rounded px-2 py-1 text-xs font-mono text-left"
                    dir="ltr"
                  />
                  <span className="text-amber-900 text-[11px]">دینار</span>
                </div>
              )}
            </div>

            {/* Dates & Salary day timing */}
            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  بەرواری دەستپێکردن (یەکەم قیست) *
                </label>
                <input
                  type="date"
                  required
                  value={firstInstallmentDate}
                  onChange={(e) => setFirstInstallmentDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white font-mono"
                />
                <span className="text-[10px] text-slate-500">بە شێوەی خۆکار مانگی داهاتوو دیاری دەکرێت</span>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  کاتی وەرگرتنی قیست لە مانگدا
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="dueDayType"
                      checked={dueDayType === 'salary_day'}
                      onChange={() => setDueDayType('salary_day')}
                      className="text-blue-600"
                    />
                    <span className="text-slate-800 font-medium">لەگەڵ هاتنی مووچەی مانگدا</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="dueDayType"
                      checked={dueDayType === 'fixed_day'}
                      onChange={() => setDueDayType('fixed_day')}
                      className="text-blue-600"
                    />
                    <span className="text-slate-800">ڕۆژی دیاریکراو لە هەر مانگێکدا:</span>
                    {dueDayType === 'fixed_day' && (
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={dueDayNumber}
                        onChange={(e) => setDueDayNumber(Number(e.target.value))}
                        className="w-16 bg-white border border-slate-300 rounded px-2 py-0.5 text-xs font-mono"
                        dir="ltr"
                      />
                    )}
                  </label>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Live Instant Results & Schedule Table */}
        <div className="space-y-5">
          
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>ئەنجامی حیساباتی قیست</span>
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">بە دیناری عێراقی</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="py-1 border-b border-slate-800/80">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">بڕی قیستی مانگانە:</span>
                  <strong className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                    {formatCurrency(calculation.monthlyInstallmentAmount)}
                  </strong>
                </div>
              </div>

              <div className="py-1 border-b border-slate-800/80">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">کۆی نرخی فرۆشتن بە قیست:</span>
                  <strong className="font-mono text-white tabular-nums">
                    {formatCurrency(calculation.totalInstallmentPrice)}
                  </strong>
                </div>
              </div>

              <div className="py-1 border-b border-slate-800/80">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">بڕی ماوە (تەنها قیست بەبێ پێشەکی):</span>
                  <strong className="font-mono text-amber-300 tabular-nums">
                    {formatCurrency(calculation.remainingBalance)}
                  </strong>
                </div>
              </div>

              <div className="py-1 border-b border-slate-800/80">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">قازانجی سافی پێشبینیکراو:</span>
                  <strong className="font-mono text-emerald-300 tabular-nums font-bold">
                    {formatCurrency(calculation.expectedNetProfit)}
                  </strong>
                </div>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">کۆتا بەرواری قیست:</span>
                <span className="font-mono text-slate-300">{lastInstallmentDate}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition-all shadow-md shadow-blue-600/30 text-xs flex items-center justify-center gap-2 disabled:opacity-50 mt-4 cursor-pointer"
            >
              <FileCheck className="w-4 h-4" />
              {saving ? 'پاشەکەوتکردن...' : 'پاشەکەوتکردن و تۆمارکردنی گرێبەست'}
            </button>
          </div>

          {/* Schedule Breakdown Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>خشتەی وردەکاری دانەوەی قیستەکان ({months} مانگ)</span>
              </span>
              <span className="text-[10px] text-slate-400">بە دیناری عێراقی</span>
            </h3>

            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-[11px]">
                    <th className="pb-1.5 font-medium">قیست</th>
                    <th className="pb-1.5 font-medium">بەروار</th>
                    <th className="pb-1.5 font-medium text-left">بڕی قیست (دینار)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {schedule.map((item) => (
                    <tr key={item.installmentNumber} className="hover:bg-slate-50">
                      <td className="py-1.5 font-bold text-slate-800">#{item.installmentNumber}</td>
                      <td className="py-1.5 font-mono text-slate-600">{item.dueDate}</td>
                      <td className="py-1.5 font-mono text-slate-950 font-bold text-left">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </form>
    </div>
  );
};

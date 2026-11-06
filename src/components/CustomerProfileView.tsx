import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  UserCheck, 
  Phone, 
  Briefcase, 
  Building2, 
  FileText, 
  Plus, 
  Camera, 
  Save, 
  Trash2, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { Customer, Contract, PaymentRecord } from '../types/index.ts';
import { formatCurrency } from '../utils/calculations.ts';

interface Props {
  customers: Customer[];
  contracts: Contract[];
  payments: PaymentRecord[];
  onSaveCustomer: (customer: Customer) => Promise<void>;
  onDeleteCustomer: (id: string) => Promise<void>;
  onNewContractForCustomer: (customer: Customer) => void;
  onViewContract: (contract: Contract) => void;
}

export const CustomerProfileView: React.FC<Props> = ({
  customers,
  contracts,
  payments,
  onSaveCustomer,
  onDeleteCustomer,
  onNewContractForCustomer,
  onViewContract,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState('');

  // Selected customer
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || null;

  // Contracts for selected customer
  const customerContracts = selectedCustomer
    ? contracts.filter((c) => c.customerId === selectedCustomer.id)
    : [];

  // Payments for selected customer
  const customerPayments = selectedCustomer
    ? payments.filter((p) => p.customerId === selectedCustomer.id)
    : [];

  // Filtered customer list
  const filteredCustomers = customers.filter(
    (c) =>
      c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      (c.idNumber && c.idNumber.includes(searchQuery))
  );

  const handleSelectCustomer = (c: Customer) => {
    setSelectedCustomerId(c.id);
    setNotesText(c.notes || '');
    setIsEditingNotes(false);
  };

  const handleSaveNotes = async () => {
    if (!selectedCustomer) return;
    const updated = { ...selectedCustomer, notes: notesText };
    await onSaveCustomer(updated);
    setIsEditingNotes(false);
  };

  const handlePhotoUpload = (field: 'idCardPhotoFront' | 'idCardPhotoBack' | 'personalPhoto', e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedCustomer || !e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        const updated = { ...selectedCustomer, [field]: reader.result };
        await onSaveCustomer(updated);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>پڕۆفایلی کڕیاران و کفیلەکان</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            بینینی هەموو زانیارییەکانی کڕیار، وێنەی ناسنامە، تێبینی تایبەت، مێژووی قیست و گرێبەستەکان
          </p>
        </div>

        <div className="text-xs text-slate-600 font-medium">
          کۆی کڕیارە تۆمارکراوەکان: <strong className="font-mono text-sm text-blue-900">{customers.length}</strong> کەس
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Customer Directory / Search */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="گەڕان بەپێی ناوی کڕیار یان ژمارەی مۆبایل..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 pl-9 text-xs text-slate-900 focus:bg-white"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          <div className="max-h-[600px] overflow-y-auto space-y-1.5 divide-y divide-slate-100">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                {customers.length === 0 ? 'هیچ کڕیارێک تۆمار نەکراوە' : 'هیچ کڕیارێک بەم ناوە نەدۆزرایەوە'}
              </div>
            ) : (
              filteredCustomers.map((c) => {
                const isSelected = selectedCustomerId === c.id;
                const custContracts = contracts.filter((ct) => ct.customerId === c.id);
                const hasActive = custContracts.some((ct) => ct.status === 'active');

                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCustomer(c)}
                    className={`w-full text-right p-3 rounded-xl transition-all cursor-pointer block ${
                      isSelected
                        ? 'bg-blue-50 border border-blue-200 text-blue-950 shadow-xs'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <strong className="text-xs font-bold text-slate-900">{c.fullName}</strong>
                      {hasActive ? (
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-medium">
                          قیستی چالاک
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">
                          {custContracts.length} گرێبەست
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>{c.phone}</span>
                      <span>{c.workplace || 'مووچەخۆر'}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right 2 Columns: Full Customer Profile Details */}
        <div className="lg:col-span-2">
          {selectedCustomer ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
              
              {/* Profile Top Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center font-bold text-lg">
                    {selectedCustomer.fullName.charAt(0) || 'ک'}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      {selectedCustomer.fullName}
                    </h2>
                    <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>تۆمارکراوە لە: <strong className="font-mono">{selectedCustomer.createdAt ? selectedCustomer.createdAt.split('T')[0] : '—'}</strong></span>
                      <span>·</span>
                      <span>ژ. ناسنامە: <strong className="font-mono">{selectedCustomer.idNumber || '—'}</strong></span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNewContractForCustomer(selectedCustomer)}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>گرێبەستی نوێ بۆ ئەم کڕیارە</span>
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm(`دڵنیایت لە سڕینەوەی پڕۆفایلی ${selectedCustomer.fullName}؟`)) {
                        await onDeleteCustomer(selectedCustomer.id);
                        setSelectedCustomerId(null);
                      }
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="سڕینەوەی کڕیار"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Personal & Workplace Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-2">
                  <h3 className="font-bold text-slate-900 flex items-center gap-1.5 pb-1 border-b border-slate-200">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <span>زانیارییە سەرەکییەکان</span>
                  </h3>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ژمارەی مۆبایل:</span>
                    <strong className="font-mono text-slate-900">{selectedCustomer.phone}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">شوێنی کار / فەرمانگە:</span>
                    <strong className="text-slate-900">{selectedCustomer.workplace || 'دیاری نەکراوە'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">بانکی مووچە:</span>
                    <strong className="text-slate-900">{selectedCustomer.salaryBank || 'دیاری نەکراوە'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ژ. حیسابی بانکی:</span>
                    <strong className="font-mono text-slate-900">{selectedCustomer.bankAccountNumber || 'دیاری نەکراوە'}</strong>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-2">
                  <h3 className="font-bold text-slate-900 flex items-center gap-1.5 pb-1 border-b border-slate-200">
                    <ShieldAlert className="w-4 h-4 text-indigo-600" />
                    <span>زانیارییەکانی لایەنی سێیەم (کفیل)</span>
                  </h3>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ناوی کفیل:</span>
                    <strong className="text-slate-900">{selectedCustomer.guarantorName || 'نییە'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">مۆبایلی کفیل:</span>
                    <strong className="font-mono text-slate-900">{selectedCustomer.guarantorPhone || '—'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ژ. ناسنامە / کارتی کفیل:</span>
                    <strong className="font-mono text-slate-900">{selectedCustomer.guarantorId || '—'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">شوێنی کاری کفیل:</span>
                    <strong className="text-slate-900">{selectedCustomer.guarantorWorkplace || '—'}</strong>
                  </div>
                </div>

              </div>

              {/* Private Notes Section (تێبینی تایبەت بۆ هەر کڕیارێک) */}
              <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-amber-950">
                    تێبینی تایبەت بۆ ئەم کڕیارە (تەنها بۆ خۆت دیارە)
                  </h3>
                  {!isEditingNotes ? (
                    <button
                      onClick={() => setIsEditingNotes(true)}
                      className="text-xs text-amber-800 hover:text-amber-950 font-medium"
                    >
                      دەستکاریکردن
                    </button>
                  ) : (
                    <button
                      onClick={handleSaveNotes}
                      className="text-xs bg-amber-700 hover:bg-amber-800 text-white px-2.5 py-1 rounded-lg flex items-center gap-1"
                    >
                      <Save className="w-3 h-3" />
                      <span>پاشەکەوتکردن</span>
                    </button>
                  )}
                </div>

                {isEditingNotes ? (
                  <textarea
                    rows={3}
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                    placeholder="تێبینی بنووسە دەربارەی پابەندبوون بە کاتی دانەوە، مەرجی تایبەت، متمانە..."
                    className="w-full bg-white border border-amber-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none"
                  />
                ) : (
                  <p className="text-xs text-amber-900 whitespace-pre-wrap leading-relaxed">
                    {selectedCustomer.notes || 'هیچ تێبینییەکی تایبەت بۆ ئەم کڕیارە نەنووسراوە.'}
                  </p>
                )}
              </div>

              {/* Attachments: ID card photos & Personal photo */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-600" />
                  <span>بەڵگەنامە و فۆتۆکۆپی ناسنامە (هاوپێچی فەرمی گرێبەست)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                  
                  {/* Photo 1: ID Card Front */}
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-3 hover:border-blue-400 transition-colors">
                    <span className="block text-[11px] font-bold text-slate-700 mb-2">
                      ڕووی پێشەوەی کارتی نیشتمانی
                    </span>
                    {selectedCustomer.idCardPhotoFront ? (
                      <div className="relative group">
                        <img
                          src={selectedCustomer.idCardPhotoFront}
                          alt="ID Front"
                          className="w-full h-28 object-cover rounded-lg border border-slate-200"
                        />
                        <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] rounded-lg cursor-pointer transition-opacity">
                          <span>گۆڕینی وێنە</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handlePhotoUpload('idCardPhotoFront', e)}
                          />
                        </label>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-28 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors text-slate-400">
                        <Camera className="w-6 h-6 mb-1 text-slate-400" />
                        <span className="text-[10px]">داگرتنی وێنە</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handlePhotoUpload('idCardPhotoFront', e)}
                        />
                      </label>
                    )}
                  </div>

                  {/* Photo 2: ID Card Back */}
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-3 hover:border-blue-400 transition-colors">
                    <span className="block text-[11px] font-bold text-slate-700 mb-2">
                      ڕووی پشتەوەی کارتی نیشتمانی
                    </span>
                    {selectedCustomer.idCardPhotoBack ? (
                      <div className="relative group">
                        <img
                          src={selectedCustomer.idCardPhotoBack}
                          alt="ID Back"
                          className="w-full h-28 object-cover rounded-lg border border-slate-200"
                        />
                        <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] rounded-lg cursor-pointer transition-opacity">
                          <span>گۆڕینی وێنە</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handlePhotoUpload('idCardPhotoBack', e)}
                          />
                        </label>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-28 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors text-slate-400">
                        <Camera className="w-6 h-6 mb-1 text-slate-400" />
                        <span className="text-[10px]">داگرتنی وێنە</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handlePhotoUpload('idCardPhotoBack', e)}
                        />
                      </label>
                    )}
                  </div>

                  {/* Photo 3: Personal Photo */}
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-3 hover:border-blue-400 transition-colors">
                    <span className="block text-[11px] font-bold text-slate-700 mb-2">
                      وێنەی کەسیی کڕیار
                    </span>
                    {selectedCustomer.personalPhoto ? (
                      <div className="relative group">
                        <img
                          src={selectedCustomer.personalPhoto}
                          alt="Personal"
                          className="w-full h-28 object-cover rounded-lg border border-slate-200"
                        />
                        <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] rounded-lg cursor-pointer transition-opacity">
                          <span>گۆڕینی وێنە</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handlePhotoUpload('personalPhoto', e)}
                          />
                        </label>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-28 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors text-slate-400">
                        <Camera className="w-6 h-6 mb-1 text-slate-400" />
                        <span className="text-[10px]">داگرتنی وێنە</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handlePhotoUpload('personalPhoto', e)}
                        />
                      </label>
                    )}
                  </div>

                </div>
              </div>

              {/* Customer Contracts */}
              <div className="border-t border-slate-100 pt-4">
                <h3 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>گرێبەستەکانی ئەم کڕیارە ({customerContracts.length})</span>
                </h3>

                {customerContracts.length === 0 ? (
                  <p className="text-xs text-slate-400">هیچ گرێبەستێک بۆ ئەم کڕیارە نییە</p>
                ) : (
                  <div className="space-y-2">
                    {customerContracts.map((ct) => (
                      <div
                        key={ct.id}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{ct.device.model}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {ct.contractNumber} · قیستی مانگانە: {formatCurrency(ct.pricing.monthlyInstallmentAmount)}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onViewContract(ct)}
                            className="text-xs bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-medium px-3 py-1.5 rounded-lg flex items-center gap-1"
                          >
                            <span>بینین</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
              <Users className="w-12 h-12 mx-auto text-slate-300 mb-2 stroke-1" />
              <h3 className="text-sm font-bold text-slate-700">کڕیارێک دیاری بکە</h3>
              <p className="text-xs text-slate-400 mt-1">
                لە لیستی دەستەچپەوە کلیک لەسەر هەر کڕیارێک بکە تا هەموو زانیاری و بەڵگەکانی ببینیت
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

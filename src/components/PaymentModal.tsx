import React, { useState, useMemo } from 'react';
import { 
  Receipt, 
  X, 
  Check, 
  Zap, 
  Printer, 
  DollarSign, 
  CreditCard 
} from 'lucide-react';
import { Contract, PaymentRecord, UserRole } from '../types/index.ts';
import { formatCurrency } from '../utils/calculations.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  contracts: Contract[];
  defaultContract?: Contract | null;
  currentUser?: { id?: string; username: string; name: string; role?: UserRole } | null;
  onRecordPayment: (paymentData: {
    contractId: string;
    amount: number;
    installmentNumbers: number[];
    paymentMethod: 'cash' | 'bank_transfer' | 'fastpay' | 'fib';
    isEarlyPayoff: boolean;
    notes?: string;
    collectedBy?: {
      userId: string;
      userName: string;
      role?: UserRole;
    };
  }) => Promise<PaymentRecord>;
  onPrintReceipt: (payment: PaymentRecord, contract: Contract) => void;
}

export const PaymentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  contracts,
  defaultContract,
  currentUser,
  onRecordPayment,
  onPrintReceipt,
}) => {
  const activeContracts = contracts.filter((c) => c.status !== 'completed');

  const [selectedContractId, setSelectedContractId] = useState<string>(
    defaultContract?.id || (activeContracts[0]?.id || '')
  );

  const selectedContract = contracts.find((c) => c.id === selectedContractId) || null;

  // Unpaid installments for selected contract
  const unpaidInstallments = useMemo(() => {
    if (!selectedContract) return [];
    return selectedContract.schedule.filter((i) => i.status !== 'paid');
  }, [selectedContract]);

  // Selected installments to pay
  const [selectedInstallmentNumbers, setSelectedInstallmentNumbers] = useState<number[]>([]);
  const [isEarlyPayoff, setIsEarlyPayoff] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'fib' | 'fastpay'>('cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdPayment, setCreatedPayment] = useState<PaymentRecord | null>(null);

  // Sync default selection
  React.useEffect(() => {
    if (defaultContract) {
      setSelectedContractId(defaultContract.id);
    }
  }, [defaultContract]);

  // When changing contract, reset installment selection
  React.useEffect(() => {
    if (unpaidInstallments.length > 0) {
      // Auto-select the first pending installment
      setSelectedInstallmentNumbers([unpaidInstallments[0].installmentNumber]);
    } else {
      setSelectedInstallmentNumbers([]);
    }
    setIsEarlyPayoff(false);
    setCreatedPayment(null);
  }, [selectedContractId, unpaidInstallments.length]);

  // Total debt remaining on selected contract
  const totalRemainingDebt = useMemo(() => {
    return unpaidInstallments.reduce((sum, i) => sum + i.amount, 0);
  }, [unpaidInstallments]);

  // Calculated payment amount
  const paymentAmount = useMemo(() => {
    if (isEarlyPayoff) {
      return totalRemainingDebt;
    }
    return unpaidInstallments
      .filter((i) => selectedInstallmentNumbers.includes(i.installmentNumber))
      .reduce((sum, i) => sum + i.amount, 0);
  }, [isEarlyPayoff, totalRemainingDebt, unpaidInstallments, selectedInstallmentNumbers]);

  const toggleInstallment = (num: number) => {
    if (isEarlyPayoff) return;
    if (selectedInstallmentNumbers.includes(num)) {
      setSelectedInstallmentNumbers(selectedInstallmentNumbers.filter((n) => n !== num));
    } else {
      setSelectedInstallmentNumbers([...selectedInstallmentNumbers, num].sort((a, b) => a - b));
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract) return;
    if (paymentAmount <= 0) {
      alert('تکایە لانیکەم یەک قیست یان پارەدانی پێشوەختە هەڵبژێرە');
      return;
    }

    setLoading(true);
    try {
      const rec = await onRecordPayment({
        contractId: selectedContract.id,
        amount: paymentAmount,
        installmentNumbers: isEarlyPayoff
          ? unpaidInstallments.map((i) => i.installmentNumber)
          : selectedInstallmentNumbers,
        paymentMethod,
        isEarlyPayoff,
        notes,
        collectedBy: currentUser ? {
          userId: currentUser.id || currentUser.username,
          userName: currentUser.name,
          role: currentUser.role,
        } : undefined,
      });
      setCreatedPayment(rec);
    } catch {
      alert('هەڵە لە تۆمارکردنی پارەدانەکە');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-right">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">
              وەرگرتنی پارەی قیست و دەرکردنی وەسڵ
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {createdPayment ? (
          <div className="space-y-4 text-center py-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">پارەدانەکە بە سەرکەوتوویی تۆمارکرا!</h3>
              <p className="text-xs text-slate-500 font-mono mt-1">
                ژمارەی وەسڵ: <strong>{createdPayment.receiptNumber}</strong> · بڕ: <strong>{formatCurrency(createdPayment.amount)}</strong>
              </p>
              <p className="text-xs text-slate-600 mt-1">
                بڕی ماوەی لای کڕیار: <strong className="font-mono text-red-700">{formatCurrency(createdPayment.remainingBalanceAfter)}</strong>
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-3">
              <button
                onClick={() => {
                  if (selectedContract) {
                    onPrintReceipt(createdPayment, selectedContract);
                  }
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>پرینتی دەستبەجێی وەسڵ</span>
              </button>
              <button
                onClick={onClose}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium px-4 py-2.5 rounded-xl"
              >
                داخستن
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePay} className="space-y-4 text-xs">
            
            {/* Select Contract */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                هەڵبژاردنی کڕیار و گرێبەست *
              </label>
              <select
                value={selectedContractId}
                onChange={(e) => setSelectedContractId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium"
              >
                {activeContracts.length === 0 && (
                  <option value="">هیچ گرێبەستێکی چالاک بەردەست نییە</option>
                )}
                {activeContracts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.customerName} - {c.device.model} ({c.contractNumber})
                  </option>
                ))}
              </select>
            </div>

            {selectedContract && (
              <>
                {/* Early Payoff Toggle (پارەدانی پێشوەختە) */}
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-emerald-950 block">
                      پارەدانی پێشوەختە (دانەوەی تەواوی قەرز)
                    </span>
                    <span className="text-[11px] text-emerald-800">
                      کڕیار دەتوانێت هەموو قەرزەکەی پێش کاتی خۆی بدات و گرێبەستەکە دابخرێت
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEarlyPayoff(!isEarlyPayoff);
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors ${
                      isEarlyPayoff
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white border border-emerald-300 text-emerald-700'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{isEarlyPayoff ? 'چالاکە' : 'دانەوەی هەموو'}</span>
                  </button>
                </div>

                {/* Specific Installment Checkboxes */}
                {!isEarlyPayoff && (
                  <div>
                    <label className="block font-medium text-slate-700 mb-1.5">
                      قیستە ماوەکان (دەتوانی یەک یان چەند قیست هەڵبژێریت):
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1">
                      {unpaidInstallments.map((inst) => {
                        const isChecked = selectedInstallmentNumbers.includes(inst.installmentNumber);
                        return (
                          <div
                            key={inst.installmentNumber}
                            onClick={() => toggleInstallment(inst.installmentNumber)}
                            className={`p-2 rounded-lg border cursor-pointer flex justify-between items-center transition-colors ${
                              isChecked
                                ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <div>
                              <span>قیستی #{inst.installmentNumber}</span>
                              <span className="block text-[10px] text-slate-400 font-mono">{inst.dueDate}</span>
                            </div>
                            <span className="font-mono">{formatCurrency(inst.amount)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Total amount to pay banner */}
                <div className="bg-slate-900 text-white p-3.5 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 block text-[11px]">کۆی پارەی وەرگیراو:</span>
                    <strong className="text-lg font-mono font-bold text-emerald-400">
                      {formatCurrency(paymentAmount)}
                    </strong>
                  </div>
                  <div className="text-left">
                    <span className="text-slate-400 block text-[11px]">قەرزی ماوە پاش پارەدان:</span>
                    <strong className="font-mono text-xs text-amber-300">
                      {formatCurrency(Math.max(0, totalRemainingDebt - paymentAmount))}
                    </strong>
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    شێوازی پارەدان
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'cash', label: 'کاش' },
                      { id: 'bank_transfer', label: 'حەواڵە' },
                      { id: 'fib', label: 'FIB' },
                      { id: 'fastpay', label: 'فاستپەی' },
                    ].map((pm) => (
                      <button
                        type="button"
                        key={pm.id}
                        onClick={() => setPaymentMethod(pm.id as any)}
                        className={`py-2 text-center rounded-lg border text-xs transition-colors ${
                          paymentMethod === pm.id
                            ? 'bg-blue-600 text-white font-bold border-blue-600'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {pm.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    تێبینی (ئارەزوومەندانە)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="بۆ نموونە: قیستی مانگی ۳ درا لە ڕێگەی بانکەوە"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || paymentAmount <= 0}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-emerald-600/30 text-xs flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                >
                  <Check className="w-4 h-4" />
                  {loading ? 'تۆمارکردن...' : 'تۆمارکردن و دەرکردنی وەسڵ'}
                </button>
              </>
            )}

          </form>
        )}

      </div>
    </div>
  );
};

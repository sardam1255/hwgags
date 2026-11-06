import React from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Smartphone, 
  Users, 
  Plus, 
  ArrowUpRight, 
  Wallet
} from 'lucide-react';
import { Contract, PaymentRecord, Customer } from '../types/index.ts';
import { formatCurrency } from '../utils/calculations.ts';

interface Props {
  contracts: Contract[];
  payments: PaymentRecord[];
  customers: Customer[];
  onNewContract: () => void;
  onViewContract: (contract: Contract) => void;
  onNewPayment: (contract?: Contract) => void;
}

export const FinancialDashboard: React.FC<Props> = ({
  contracts,
  payments,
  customers,
  onNewContract,
  onViewContract,
  onNewPayment,
}) => {
  // 1. Receivables (قەرزی ماوە لای کڕیارەکان)
  let totalReceivables = 0;
  let totalExpectedProfit = 0;
  let totalDownPayments = 0;

  contracts.forEach((c) => {
    totalExpectedProfit += c.pricing.totalProfit;
    totalDownPayments += c.pricing.downPayment || 0;
    const unpaid = c.schedule
      .filter((i) => i.status !== 'paid')
      .reduce((sum, i) => sum + i.amount, 0);
    totalReceivables += unpaid;
  });

  // 2. Realized Payments and Profit
  const totalPaymentsReceived = payments.reduce((sum, p) => sum + p.amount, 0);

  // Realized profit: proportion of paid installments
  let realizedProfit = 0;
  contracts.forEach((c) => {
    const paidInSchedule = c.schedule
      .filter((i) => i.status === 'paid')
      .reduce((sum, i) => sum + (i.paidAmount || i.amount), 0);
    if (c.pricing.remainingBalance > 0) {
      const fraction = Math.min(1, paidInSchedule / c.pricing.remainingBalance);
      realizedProfit += Math.round(c.pricing.totalProfit * fraction);
    }
  });

  // 3. Cash Box (سندوق / کاشی کۆکراوە لە پێشەکی و قیستەکان)
  const cashBox = totalDownPayments + totalPaymentsReceived;

  // Active / Overdue
  const activeContracts = contracts.filter((c) => c.status === 'active');
  const completedContracts = contracts.filter((c) => c.status === 'completed');

  // Overdue check
  const today = new Date().toISOString().split('T')[0];
  const overdueList: { contract: Contract; installmentNumber: number; amount: number; dueDate: string }[] = [];

  contracts.forEach((c) => {
    if (c.status !== 'completed') {
      c.schedule.forEach((inst) => {
        if (inst.status !== 'paid' && inst.dueDate < today) {
          overdueList.push({
            contract: c,
            installmentNumber: inst.installmentNumber,
            amount: inst.amount,
            dueDate: inst.dueDate,
          });
        }
      });
    }
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Hero Bar */}
      <div className="bg-gradient-to-l from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-sm border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            پوختەی دارایی و حیساباتی قیستەکان
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            چاودێریکردنی ڕاستەقینەی پارەی ماوەی لای کڕیار، قازانجی صافی، سندوق و گرێبەستەکان
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onNewContract}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/30 flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>گرێبەستی نوێ</span>
          </button>
          <button
            onClick={() => onNewPayment()}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/30 flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>وەرگرتنی قیست</span>
          </button>
        </div>
      </div>

      {/* Financial Metric Boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Receivables (قەرزی ماوە لای کڕیارەکان) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">قەرزی تۆ لای کڕیار (Receivables)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {formatCurrency(totalReceivables)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            کۆی پارەی قیستە نەدراوەکانی کڕیاران
          </p>
        </div>

        {/* 2. Expected Profit (قازانجی پلاندانراو) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">قازانجی پلاندانراو (Expected Profit)</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-blue-900 tabular-nums">
            {formatCurrency(totalExpectedProfit)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            کۆی قازانجی هەموو گرێبەستەکان بە %2.5
          </p>
        </div>

        {/* 3. Realized Profit (قازانجی بەدەستهاتوو) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">قازانجی بەدەستهاتوو (Realized Profit)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
            {formatCurrency(realizedProfit)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            قازانج لە ڕێگەی قیستە دراوەکانەوە
          </p>
        </div>

        {/* 4. Cash Box (پارەی سندوق) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">پارەی سندوق (کاشی وەرگیراو)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
            {formatCurrency(cashBox)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            کۆی پارەی کاشی وەرگیراو (پێشەکی + قیستەکان)
          </p>
        </div>

      </div>

      {/* Overdue Alerts Section if any exist */}
      {overdueList.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-red-900 font-bold text-sm">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span>ئاگاداری: {overdueList.length} قیستی دواکەوتوو هەیە!</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {overdueList.slice(0, 6).map((item, idx) => (
              <div key={idx} className="bg-white border border-red-200 rounded-xl p-3 flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-slate-900">{item.contract.customerName}</div>
                  <div className="text-[11px] text-slate-500">{item.contract.device.model} · قیستی #{item.installmentNumber}</div>
                  <div className="text-[10px] text-red-600 font-mono mt-0.5">بەرواری دان: {item.dueDate}</div>
                </div>
                <div className="text-left">
                  <div className="font-bold font-mono text-red-700">{formatCurrency(item.amount)}</div>
                  <button
                    onClick={() => onNewPayment(item.contract)}
                    className="mt-1 bg-red-600 hover:bg-red-700 text-white text-[10px] px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                  >
                    وەرگرتن
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contracts & Customer Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Recent Active Contracts */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">دوایین گرێبەستەکان</h2>
            </div>
            <span className="text-xs text-slate-500">
              {activeContracts.length} گرێبەستی چالاک
            </span>
          </div>

          {contracts.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Smartphone className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
              <p className="text-xs font-medium text-slate-600">هیچ گرێبەستێک تۆمار نەکراوە</p>
              <p className="text-[11px] text-slate-400 mt-0.5">بۆ تۆمارکردنی یەکەم مۆبایل و گرێبەست، کلیک لە دوگمەی سەرەوە بکە</p>
              <button
                onClick={onNewContract}
                className="mt-3 text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                تۆمارکردنی گرێبەست
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 pb-2">
                    <th className="pb-2 font-medium">کڕیار</th>
                    <th className="pb-2 font-medium">مۆبایل</th>
                    <th className="pb-2 font-medium">قیستی مانگانە</th>
                    <th className="pb-2 font-medium">ماوەی قەرز</th>
                    <th className="pb-2 font-medium text-center">دۆخ</th>
                    <th className="pb-2 font-medium text-center">کردار</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {contracts.slice(0, 5).map((ct) => {
                    const remainingDebt = ct.schedule
                      .filter((i) => i.status !== 'paid')
                      .reduce((sum, i) => sum + i.amount, 0);

                    return (
                      <tr key={ct.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 font-medium text-slate-900">{ct.customerName}</td>
                        <td className="py-2.5 text-slate-600">{ct.device.model} ({ct.device.storage})</td>
                        <td className="py-2.5 font-mono text-blue-900">{formatCurrency(ct.pricing.monthlyInstallmentAmount)}</td>
                        <td className="py-2.5 font-mono text-red-700">{formatCurrency(remainingDebt)}</td>
                        <td className="py-2.5 text-center">
                          {ct.status === 'completed' ? (
                            <span className="text-[10px] text-emerald-700 font-medium">داخراو</span>
                          ) : (
                            <span className="text-[10px] text-blue-700 font-medium">چالاک</span>
                          )}
                        </td>
                        <td className="py-2.5 text-center">
                          <button
                            onClick={() => onViewContract(ct)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline cursor-pointer"
                          >
                            پیشاندان
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Customer & Project Summary */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Users className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">پوختەی پڕۆژەکە</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-600">کۆی کڕیاران</span>
              <strong className="font-mono text-sm text-slate-900">{customers.length} کەس</strong>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-600">گرێبەستە چالاکەکان</span>
              <strong className="font-mono text-sm text-blue-700">{activeContracts.length}</strong>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-600">گرێبەستە تەواوکراوەکان</span>
              <strong className="font-mono text-sm text-emerald-700">{completedContracts.length}</strong>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-600">کۆی پارەی وەرگیراو بە وەسڵ</span>
              <strong className="font-mono text-sm text-slate-900">{formatCurrency(totalPaymentsReceived)}</strong>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-slate-600 font-medium">کۆی قازانجی گشتی گرێبەستەکان</span>
              <strong className="font-mono text-sm text-emerald-800 font-bold">{formatCurrency(totalExpectedProfit)}</strong>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

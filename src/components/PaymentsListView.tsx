import React, { useState } from 'react';
import { 
  Receipt, 
  Search, 
  Printer, 
  Calendar, 
  Plus, 
  ArrowUpRight 
} from 'lucide-react';
import { PaymentRecord, Contract } from '../types/index.ts';
import { formatCurrency } from '../utils/calculations.ts';

interface Props {
  payments: PaymentRecord[];
  contracts: Contract[];
  onOpenNewPayment: () => void;
  onPrintReceipt: (payment: PaymentRecord, contract?: Contract) => void;
}

export const PaymentsListView: React.FC<Props> = ({
  payments,
  contracts,
  onOpenNewPayment,
  onPrintReceipt,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = payments.filter((p) => {
    return (
      p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.date.includes(searchQuery)
    );
  });

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-5">
      
      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            <span>وەسڵ و مێژووی پارەدانەکان</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            بینینی هەموو وەسڵە دەرچووەکان، بڕی پارەی کۆکراوە و چاپکردنەوەی وەسڵی قیست
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">کۆی پارەی وەرگیراو:</span>
            <strong className="text-sm font-bold font-mono text-emerald-700">
              {formatCurrency(totalCollected)}
            </strong>
          </div>
          <button
            onClick={onOpenNewPayment}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>وەرگرتنی قیستی نوێ</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="گەڕان بەپێی ناوی کڕیار، ژمارەی وەسڵ، یان بەروار..."
          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 pl-10 text-xs text-slate-900 focus:bg-white"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
      </div>

      {/* Receipts Table */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
          <Receipt className="w-12 h-12 mx-auto text-slate-300 mb-2 stroke-1" />
          <h3 className="text-sm font-bold text-slate-700">هیچ وەسڵێک تۆمار نەکراوە</h3>
          <p className="text-xs text-slate-400 mt-1">
            کاتێک کڕیار قیست دەدات یان پارەدانی پێشوەختە ئەنجام دەدات لێرەدا وەسڵی دەردەچێت
          </p>
          <button
            onClick={onOpenNewPayment}
            className="mt-3 bg-emerald-600 text-white text-xs font-semibold px-3.5 py-2 rounded-xl"
          >
            تۆمارکردنی یەکەم پارەدان
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="py-3 px-4 font-medium">ژمارەی وەسڵ</th>
                  <th className="py-3 px-4 font-medium">ناوی کڕیار</th>
                  <th className="py-3 px-4 font-medium">بەروار</th>
                  <th className="py-3 px-4 font-medium">بڕی وەرگیراو</th>
                  <th className="py-3 px-4 font-medium">قیستی ژمارە</th>
                  <th className="py-3 px-4 font-medium">قەرزی ماوە</th>
                  <th className="py-3 px-4 font-medium text-center">چاپکردنەوە</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((pay) => {
                  const contract = contracts.find((c) => c.id === pay.contractId);

                  return (
                    <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{pay.receiptNumber}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{pay.customerName}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{pay.date}</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                        {formatCurrency(pay.amount)}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {pay.isEarlyPayoff ? (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                            تەواوی قەرز
                          </span>
                        ) : (
                          <span className="font-mono">#{pay.installmentNumbers.join('، #')}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-red-700">
                        {formatCurrency(pay.remainingBalanceAfter)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onPrintReceipt(pay, contract)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-medium px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1 transition-colors"
                        >
                          <Printer className="w-3 h-3" />
                          <span>پرینتی وەسڵ</span>
                        </button>
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
  );
};

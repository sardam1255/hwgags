import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Printer, 
  ArrowUpRight, 
  Trash2, 
  Calendar, 
  CheckCircle, 
  AlertCircle,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Contract } from '../types/index.ts';
import { formatCurrency } from '../utils/calculations.ts';

interface Props {
  contracts: Contract[];
  onPrintLegal: (contract: Contract) => void;
  onPrintBank: (contract: Contract) => void;
  onNewPayment: (contract: Contract) => void;
  onDeleteContract: (id: string) => void;
  onNewContractClick: () => void;
}

export const ContractsListView: React.FC<Props> = ({
  contracts,
  onPrintLegal,
  onPrintBank,
  onNewPayment,
  onDeleteContract,
  onNewContractClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [expandedContractId, setExpandedContractId] = useState<string | null>(null);

  const filtered = contracts.filter((c) => {
    const matchesSearch =
      c.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.customerPhone.includes(searchQuery) ||
      c.contractNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.device.model.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ? true : c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5">
      
      {/* Top Bar with Search & Filter */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="گەڕان بەپێی ناوی کڕیار، ژمارەی مۆبایل، ژمارەی گرێبەست یان مۆدێل..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pl-10 text-xs text-slate-900 focus:bg-white focus:ring-1 focus:ring-blue-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            هەموو ({contracts.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              statusFilter === 'active'
                ? 'bg-white text-blue-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            چالاک ({contracts.filter((c) => c.status === 'active').length})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              statusFilter === 'completed'
                ? 'bg-white text-emerald-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            تەواوکراو ({contracts.filter((c) => c.status === 'completed').length})
          </button>
        </div>

      </div>

      {/* Contracts List */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
          <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3 stroke-1" />
          <h3 className="text-sm font-bold text-slate-700">هیچ گرێبەستێک نەدۆزرایەوە</h3>
          <p className="text-xs text-slate-400 mt-1">تۆمارکردنی یەکەم گرێبەست دەستپێبکە</p>
          <button
            onClick={onNewContractClick}
            className="mt-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm"
          >
            تۆمارکردنی گرێبەستی نوێ
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((ct) => {
            const paidCount = ct.schedule.filter((i) => i.status === 'paid').length;
            const totalCount = ct.schedule.length;
            const progressPercent = Math.round((paidCount / totalCount) * 100);

            const remainingDebt = ct.schedule
              .filter((i) => i.status !== 'paid')
              .reduce((sum, i) => sum + i.amount, 0);

            const isExpanded = expandedContractId === ct.id;

            return (
              <div
                key={ct.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs transition-shadow hover:shadow-sm"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  
                  {/* Left info: Customer & Device */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                        {ct.contractNumber}
                      </span>
                      <h2 className="text-base font-bold text-slate-900">{ct.customerName}</h2>
                      {ct.status === 'completed' ? (
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          تەواوکراو
                        </span>
                      ) : (
                        <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                          چالاک
                        </span>
                      )}
                    </div>
                    
                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                      <span>مۆبایل: <strong className="text-slate-800">{ct.device.model}</strong> ({ct.device.storage} - {ct.device.color})</span>
                      <span>·</span>
                      <span>پەیوەندی: <strong className="font-mono">{ct.customerPhone}</strong></span>
                      <span>·</span>
                      <span>ڕێکەوت: <strong className="font-mono">{ct.createdAt ? ct.createdAt.split('T')[0] : ''}</strong></span>
                    </div>
                  </div>

                  {/* Financials & Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    
                    <button
                      onClick={() => onPrintLegal(ct)}
                      className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
                      title="پرینتی گرێبەست و کۆمپیالە لەسەر A4"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>گرێبەستی فەرمی (A4)</span>
                    </button>

                    <button
                      onClick={() => onPrintBank(ct)}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
                      title="پرینتی فۆرمی ڕەزامەندی بانکی لەسەر A4"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>فۆرمی بانکی (A4)</span>
                    </button>

                    {ct.status !== 'completed' && (
                      <button
                        onClick={() => onNewPayment(ct)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>وەرگرتنی قیست</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        if (confirm('دڵنیایت لە سڕینەوەی ئەم گرێبەستە؟')) {
                          onDeleteContract(ct.id);
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="سڕینەوە"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress bar and details */}
                <div className="pt-3 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs items-center">
                  <div>
                    <span className="text-slate-500">قیستی مانگانە:</span>
                    <strong className="block font-mono text-sm text-blue-900 font-bold">
                      {formatCurrency(ct.pricing.monthlyInstallmentAmount)}
                    </strong>
                  </div>

                  <div>
                    <span className="text-slate-500">قەرزی ماوەی لای کڕیار:</span>
                    <strong className="block font-mono text-sm text-red-700 font-bold">
                      {formatCurrency(remainingDebt)}
                    </strong>
                  </div>

                  <div>
                    <span className="text-slate-500">دانەوەی قیستەکان:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] text-slate-700 font-semibold">
                        {paidCount} / {totalCount}
                      </span>
                    </div>
                  </div>

                  <div className="text-left">
                    <button
                      onClick={() => setExpandedContractId(isExpanded ? null : ct.id)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
                    >
                      <span>{isExpanded ? 'شاردنەوەی خشتە' : 'پیشاندانی هەموو قیستەکان'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Schedule Details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-slate-800 mb-2.5">
                      خشتەی قیستەکانی ئەم گرێبەستە:
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {ct.schedule.map((item) => (
                        <div
                          key={item.installmentNumber}
                          className={`p-2 rounded-xl border text-[11px] flex flex-col justify-between ${
                            item.status === 'paid'
                              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                              : 'bg-slate-50 border-slate-200 text-slate-800'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold">قیستی #{item.installmentNumber}</span>
                            {item.status === 'paid' ? (
                              <span className="text-[9.5px] font-bold text-emerald-700">دراوە</span>
                            ) : (
                              <span className="text-[9.5px] text-slate-500">نەدراوە</span>
                            )}
                          </div>
                          <div className="font-mono text-xs font-semibold">
                            {formatCurrency(item.amount)}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-1">
                            {item.dueDate}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

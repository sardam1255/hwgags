import React from 'react';
import { Contract, Customer, ShopSettings } from '../types/index.ts';
import { formatCurrency } from '../utils/calculations.ts';

interface Props {
  contract: Contract;
  customer?: Customer;
  settings: ShopSettings;
}

export const LegalContractDocument: React.FC<Props> = ({ contract, customer, settings }) => {
  return (
    <div className="printable-document bg-white text-slate-900 text-right p-4 border border-slate-300 rounded shadow-sm text-[12px] leading-tight max-w-[210mm] mx-auto single-page-a4">
      {/* Header */}
      <div className="text-center border-b-2 border-slate-900 pb-2 mb-2">
        <h1 className="text-lg font-black tracking-wide text-slate-900">
          گرێبەست و کۆمپیالەی فرۆشتنی مۆبایل بە قست
        </h1>
        <p className="text-[10px] text-slate-600 mt-0.5">
          (لەگەڵ مەرجی تەکنیکی و یاسایی بەپێی یاساکانی هەرێمی کوردستان)
        </p>
        <div className="flex justify-between items-center text-[10px] font-mono mt-1 text-slate-700 border-t border-slate-200 pt-1">
          <span>ژمارەی گرێبەست: <strong>{contract.contractNumber}</strong></span>
          <span>ڕێکەوتی واژووکردن: <strong>{contract.createdAt ? contract.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]}</strong></span>
        </div>
      </div>

      {/* بەشی یەکەم: زانیارییەکانی لایەنەکان */}
      <div className="mb-2">
        <div className="bg-slate-800 text-white font-bold px-2 py-0.5 text-[11px] rounded-t">
          یەکەم: زانیارییەکانی لایەنەکان
        </div>
        <div className="grid grid-cols-3 gap-2 border border-slate-400 p-2 text-[10.5px]">
          {/* فرۆشیار */}
          <div className="border-l border-slate-300 pl-1.5">
            <div className="font-bold text-slate-950 border-b border-slate-200 pb-0.5 mb-1">
              لایەنی یەکەم (فرۆشیار)
            </div>
            <div>ناوی تەواو: <strong className="text-slate-900">{settings.sellerName || 'فرۆشیار'}</strong></div>
            {contract.createdBy && contract.createdBy.role === 'deputy' && (
              <div className="text-blue-900">جێگری تۆمارکار: <strong>{contract.createdBy.userName}</strong></div>
            )}
            <div>دووکان: <strong>{settings.shopName}</strong></div>
            <div>ژ. مۆبایل: <strong className="font-mono">{settings.phone}</strong></div>
            <div>ناونیشان: <span>{settings.address}</span></div>
          </div>

          {/* کڕیار */}
          <div className="border-l border-slate-300 pl-1.5">
            <div className="font-bold text-slate-950 border-b border-slate-200 pb-0.5 mb-1">
              لایەنی دووەم (کڕیار)
            </div>
            <div>ناوی تەواو: <strong className="text-slate-900">{customer?.fullName || contract.customerName}</strong></div>
            <div>ژ. ناسنامە: <strong className="font-mono">{customer?.idNumber || '—'}</strong></div>
            <div>ژ. مۆبایل: <strong className="font-mono">{customer?.phone || contract.customerPhone}</strong></div>
            <div>شوێنی کار: <span>{customer?.workplace || '—'}</span></div>
          </div>

          {/* کفیل */}
          <div>
            <div className="font-bold text-slate-950 border-b border-slate-200 pb-0.5 mb-1">
              لایەنی سێیەم (کفیل)
            </div>
            <div>ناوی تەواو: <strong className="text-slate-900">{customer?.guarantorName || '—'}</strong></div>
            <div>ژ. کارت/ناسنامە: <strong className="font-mono">{customer?.guarantorId || '—'}</strong></div>
            <div>ژ. مۆبایل: <strong className="font-mono">{customer?.guarantorPhone || '—'}</strong></div>
            <div>شوێنی کار: <span>{customer?.guarantorWorkplace || '—'}</span></div>
          </div>
        </div>
      </div>

      {/* بەشی دووەم: زانیارییەکانی مۆبایلەکە */}
      <div className="mb-2">
        <div className="bg-slate-800 text-white font-bold px-2 py-0.5 text-[11px] rounded-t">
          دووەم: زانیارییەکانی مۆبایلەکە
        </div>
        <div className="grid grid-cols-4 gap-2 border border-slate-400 p-2 text-[10.5px]">
          <div>جۆری مۆبایل: <strong className="text-slate-900">{contract.device.model}</strong></div>
          <div>ڕەنگ: <strong>{contract.device.color}</strong></div>
          <div>بیرگە: <strong>{contract.device.storage}</strong></div>
          <div>سیستەم: <strong className="uppercase">{contract.device.os === 'ios' ? 'ئایفۆن (iOS)' : 'ئەندرۆید (Android)'}</strong></div>
          <div className="col-span-2">IMEI 1: <strong className="font-mono tracking-wider">{contract.device.imei1 || '—'}</strong></div>
          <div className="col-span-2">IMEI 2: <strong className="font-mono tracking-wider">{contract.device.imei2 || '—'}</strong></div>
        </div>
      </div>

      {/* بەشی سێیەم: خشتەی نرخ و قستەکان */}
      <div className="mb-2">
        <div className="bg-slate-800 text-white font-bold px-2 py-0.5 text-[11px] rounded-t">
          سێیەم: خشتەی نرخ و قیستەکان
        </div>
        <div className="border border-slate-400 p-2 text-[10.5px]">
          <div className="grid grid-cols-4 gap-2 border-b border-slate-200 pb-1 mb-1">
            <div>نرخی گشتی بە قیست: <strong className="font-mono">{formatCurrency(contract.pricing.totalInstallmentPrice)}</strong></div>
            <div>پێشەکی دراو: <strong className="font-mono text-emerald-800">{formatCurrency(contract.pricing.downPayment)}</strong></div>
            <div>پارەی ماوە (قیست): <strong className="font-mono text-red-800">{formatCurrency(contract.pricing.remainingBalance)}</strong></div>
            <div>قیستی مانگانە: <strong className="font-mono text-blue-900">{formatCurrency(contract.pricing.monthlyInstallmentAmount)}</strong></div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>ماوەی قیست: <strong>{contract.pricing.months} مانگ</strong></div>
            <div>بەرواری دەستپێکردن: <strong className="font-mono">{contract.firstInstallmentDate}</strong> ({contract.dueDayType === 'salary_day' ? 'لەگەڵ هاتنی مووچەی مانگ' : `ڕۆژی ${contract.dueDayNumber}ی مانگ`})</div>
            <div>بەرواری کۆتا قیست: <strong className="font-mono">{contract.lastInstallmentDate}</strong></div>
          </div>
        </div>
      </div>

      {/* بەشی چوارەم: مەرجە یاسایی و تەکنیکییەکان */}
      <div className="mb-2">
        <div className="bg-slate-800 text-white font-bold px-2 py-0.5 text-[11px] rounded-t">
          چوارەم: مەرجە یاسایی و تەکنیکییەکان
        </div>
        <div className="border border-slate-400 p-2 text-[9.5px] leading-relaxed text-justify bg-slate-50/50">
          <p className="whitespace-pre-line">{contract.legalTerms || settings.customLegalTerms}</p>
        </div>
      </div>

      {/* بەشی پێنجەم: واژوو، پەنجەمۆر و بەڵگەکان */}
      <div className="mt-1">
        <div className="bg-slate-800 text-white font-bold px-2 py-0.5 text-[11px] rounded-t">
          پێنجەم: واژوو، پەنجەمۆر و بەڵگەکان
        </div>
        <div className="border border-slate-400 p-2">
          <p className="text-[9.5px] font-semibold text-slate-700 mb-2 border-b border-slate-200 pb-1 text-center">
            پێویستە فۆتۆکۆپی کارتی نیشتمانی (کڕیار و کفیل) و وێنەی کەسیی کڕیار هاوپێچی ئەم گرێبەستە بکرێت.
          </p>

          <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
            {/* لایەنی یەکەم */}
            <div className="border border-slate-300 p-1.5 rounded flex flex-col justify-between h-[100px]">
              <div className="font-bold text-slate-900">لایەنی یەکەم (فرۆشیار)</div>
              <div className="text-slate-500 text-[9px]">واژوو و مۆری فەرمی دووکان</div>
              <div className="border-b border-dotted border-slate-400 mt-auto pt-4 text-[9px] text-slate-400">
                واژوو: .........................
              </div>
            </div>

            {/* لایەنی دووەم */}
            <div className="border border-slate-300 p-1.5 rounded flex flex-col justify-between h-[100px]">
              <div className="font-bold text-slate-900">لایەنی دووەم (کڕیار)</div>
              <div className="border border-dashed border-slate-400 w-12 h-10 mx-auto my-0.5 rounded flex items-center justify-center text-[8px] text-slate-400">
                شوێنی پەنجەمۆر
              </div>
              <div className="border-b border-dotted border-slate-400 text-[9px] text-slate-400">
                واژوو: .........................
              </div>
            </div>

            {/* لایەنی سێیەم */}
            <div className="border border-slate-300 p-1.5 rounded flex flex-col justify-between h-[100px]">
              <div className="font-bold text-slate-900">لایەنی سێیەم (کفیل)</div>
              <div className="border border-dashed border-slate-400 w-12 h-10 mx-auto my-0.5 rounded flex items-center justify-center text-[8px] text-slate-400">
                شوێنی پەنجەمۆر
              </div>
              <div className="border-b border-dotted border-slate-400 text-[9px] text-slate-400">
                واژوو: .........................
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center text-[9px] text-slate-500 mt-1">
        ئەم گرێبەستە لە دوو دانەی یەکسان ئامادەکراوە و بەپێی یاساکانی هەرێمی کوردستان کاری پێ دەکرێت.
      </div>
    </div>
  );
};

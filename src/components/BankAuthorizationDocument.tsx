import React from 'react';
import { Contract, Customer, ShopSettings } from '../types/index.ts';
import { formatCurrency } from '../utils/calculations.ts';

interface Props {
  contract: Contract;
  customer?: Customer;
  settings: ShopSettings;
}

export const BankAuthorizationDocument: React.FC<Props> = ({ contract, customer, settings }) => {
  const buyerName = customer?.fullName || contract.customerName;

  return (
    <div className="printable-document bg-white text-slate-900 text-right p-4 border border-slate-300 rounded shadow-sm text-[12px] leading-tight max-w-[210mm] mx-auto single-page-a4">
      {/* Header */}
      <div className="text-center border-b-2 border-slate-900 pb-2 mb-2">
        <h1 className="text-lg font-black tracking-wide text-slate-900">
          فۆرمی گرێبەستی فرۆشتنی قیست و ڕەزامەندی بانکی
        </h1>
        <p className="text-[10px] text-slate-600 mt-0.5">
          (تایبەت بە کڕیارانی مووچەخۆر و هەژمارە بانکییەکان بەپێی یاساکانی هەرێمی کوردستان)
        </p>
        <div className="flex justify-between items-center text-[10px] font-mono mt-1 text-slate-700 border-t border-slate-200 pt-1">
          <span>ژمارەی دۆسیە: <strong>{contract.contractNumber}</strong></span>
          <span>ڕێکەوت: <strong>{contract.createdAt ? contract.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]}</strong></span>
        </div>
      </div>

      {/* بەشی یەکەم: زانیاری لایەنی فرۆشیار */}
      <div className="mb-2">
        <div className="bg-slate-800 text-white font-bold px-2 py-0.5 text-[11px] rounded-t">
          بەشی یەکەم: زانیاری لایەنی فرۆشیار
        </div>
        <div className="grid grid-cols-3 gap-2 border border-slate-400 p-2 text-[10.5px]">
          <div>ناوی دووکان / کۆمپانیا: <strong className="text-slate-900">{settings.shopName}</strong></div>
          <div>ناوی فرۆشیار: <strong className="text-slate-900">{settings.sellerName || 'فرۆشیار'}</strong></div>
          <div>ژمارەی مۆبایل: <strong className="font-mono text-slate-900">{settings.phone}</strong></div>
        </div>
      </div>

      {/* بەشی دووەم: زانیاری لایەنی کڕیار (مووچەخۆر) */}
      <div className="mb-2">
        <div className="bg-slate-800 text-white font-bold px-2 py-0.5 text-[11px] rounded-t">
          بەشی دووەم: زانیاری لایەنی کڕیار (مووچەخۆر)
        </div>
        <div className="grid grid-cols-3 gap-2 border border-slate-400 p-2 text-[10.5px]">
          <div>ناوی تەواوی کڕیار: <strong className="text-slate-900">{buyerName}</strong></div>
          <div>ژ. ناسنامەی نیشتمانی / پاسپۆرت: <strong className="font-mono">{customer?.idNumber || '—'}</strong></div>
          <div>ژمارەی مۆبایل: <strong className="font-mono">{customer?.phone || contract.customerPhone}</strong></div>
          <div>شوێنی کار: <strong>{customer?.workplace || 'مووچەخۆر'}</strong></div>
          <div>ناوی بانکی مووچە: <strong>{customer?.salaryBank || 'بانکی هەرێم'}</strong></div>
          <div>ژمارەی حیساب (Account No): <strong className="font-mono">{customer?.bankAccountNumber || '—'}</strong></div>
        </div>
      </div>

      {/* بەشی سێیەم: وردەکاری کاڵا و نرخ */}
      <div className="mb-2">
        <div className="bg-slate-800 text-white font-bold px-2 py-0.5 text-[11px] rounded-t">
          بەشی سێیەم: وردەکاری کاڵا و نرخ
        </div>
        <div className="grid grid-cols-3 gap-2 border border-slate-400 p-2 text-[10.5px]">
          <div>جۆری کاڵا / مۆبایل: <strong>{contract.device.model} ({contract.device.storage} - {contract.device.color})</strong></div>
          <div className="col-span-2">ژمارەی سەرەکی (IMEI / Serial): <strong className="font-mono">{contract.device.imei1 || '—'}</strong></div>
          <div>نرخی کاڵا بە نەقد (Cash): <strong className="font-mono">{formatCurrency(contract.pricing.cashPrice)}</strong></div>
          <div>بڕی پێشەکی (Advance): <strong className="font-mono text-emerald-800">{formatCurrency(contract.pricing.downPayment)}</strong></div>
          <div>بڕی قیستی مانگانە: <strong className="font-mono text-blue-900">{formatCurrency(contract.pricing.monthlyInstallmentAmount)}</strong></div>
          <div>ژمارەی مانگەکان: <strong>{contract.pricing.months} مانگ</strong></div>
          <div className="col-span-2">
            ڕێکەوتی دەستپێکردنی قیست: <strong>{contract.dueDayType === 'salary_day' ? 'لەگەڵ هاتنی مووچەی مانگدا لە هەر مانگێکدا' : `لە هەر مانگێک لە ڕێکەوتی (${contract.dueDayNumber || 25}) ڕۆژیدا`}</strong>
          </div>
        </div>
      </div>

      {/* بەشی چوارەم: مەرج و ڕەزامەندییەکان (زۆر گرنگ) */}
      <div className="mb-2">
        <div className="bg-slate-800 text-white font-bold px-2 py-0.5 text-[11px] rounded-t">
          بەشی چوارەم: مەرج و ڕەزامەندییەکان (زۆر گرنگ)
        </div>
        <div className="border border-slate-400 p-2 text-[10px] space-y-1.5 leading-relaxed bg-slate-50/50">
          <p>
            <strong>ڕەزامەندی بانکی:</strong> منی کڕیار (ناوی تەواو: <u>{buyerName}</u>) لێرەدا ڕەزامەندی خۆم دەردەبڕم کە پابەند دەبم بە ناردنی بڕی قیستی مانگانەی سەرەوە لە ڕێگەی مۆبایل بانکییەکەمەوە (یاخود بە سەردانیکردنی بانکەکەم لەگەڵ وەرگرتنی مووچەی مانگانە) بۆ سەر ژمارەی IBANـی خاوەن دووکان کە ڕوونکراوەتەوە:
          </p>

          <div className="bg-white border border-slate-300 p-1.5 rounded grid grid-cols-3 gap-2 text-[10px]">
            <div>ناوی خاوەن حیساب: <strong>{settings.sellerName || 'فرۆشیار'}</strong></div>
            <div>ناوی بانک: <strong>{settings.bankName || 'RT Bank'}</strong></div>
            <div>ژمارەی IBAN: <strong className="font-mono text-blue-900">{settings.iban || 'IQ00RTBK00000000000000000000'}</strong></div>
          </div>

          <p>
            <strong>مسۆگەری و بەرپرسیارێتی:</strong> لە حاڵەتی دواکەوتنی قیستەکە یان ڕوودانی هەر کێشەیەک لە حیسابی بانکییەکەدا، من بەرپرسیار دەبم لە پێدانی پارەکە بە شێوەی کاش، و خاوەن دووکان مافی یاسایی هەیە ڕێکاری پێویست بگرێتە بەر بەپێی یاساکانی هەرێمی کوردستان.
          </p>

          <p>
            <strong>چێکی مسۆگەری:</strong> بڕی (<strong className="font-mono">{formatCurrency(contract.securityCheckAmount || contract.pricing.remainingBalance)}</strong>) لەگەڵ ئەم گرێبەستەدا وەک چێکی مسۆگەری / بارمتە درا بە فرۆشیار.
          </p>
        </div>
      </div>

      {/* واژوو و مۆرەکان */}
      <div className="border border-slate-400 p-2 mt-2">
        <div className="grid grid-cols-2 gap-4 text-center text-[10px]">
          {/* کڕیار */}
          <div className="border border-slate-300 p-2 rounded flex flex-col justify-between h-[120px]">
            <div className="font-bold text-slate-900">واژوو و پەنجەمۆری لایەنی کڕیار</div>
            <div>ناوی کڕیار: <strong>{buyerName}</strong></div>
            <div className="border border-dashed border-slate-400 w-14 h-11 mx-auto rounded flex items-center justify-center text-[8px] text-slate-400">
              شوێنی پەنجەمۆر
            </div>
            <div className="text-slate-400 text-[9px]">واژوو: .......................................</div>
          </div>

          {/* فرۆشیار */}
          <div className="border border-slate-300 p-2 rounded flex flex-col justify-between h-[120px]">
            <div className="font-bold text-slate-900">واژوو و مۆری لایەنی فرۆشیار</div>
            <div>ناوی فرۆشیار: <strong>{settings.sellerName || 'فرۆشیار'}</strong></div>
            <div className="border border-dashed border-slate-400 w-14 h-11 mx-auto rounded flex items-center justify-center text-[8px] text-slate-400">
              مۆری فەرمی دووکان
            </div>
            <div className="text-slate-400 text-[9px]">واژوو: .......................................</div>
          </div>
        </div>

        <div className="text-center font-bold text-[9.5px] text-slate-800 mt-2 border-t border-slate-200 pt-1">
          ئەم گرێبەستە بە ئیفادەی تەواوی هەردوو لا ئیمزا کراوە و لەبەرچاوگیراوە بەپێی یاساکانی هەرێمی کوردستان.
        </div>
      </div>
    </div>
  );
};

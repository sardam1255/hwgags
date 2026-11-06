import React from 'react';
import { PaymentRecord, Contract, ShopSettings } from '../types/index.ts';
import { formatCurrency } from '../utils/calculations.ts';

interface Props {
  payment: PaymentRecord;
  contract?: Contract;
  settings: ShopSettings;
}

export const ReceiptDocument: React.FC<Props> = ({ payment, contract, settings }) => {
  return (
    <div className="printable-receipt bg-white text-slate-900 text-right p-4 border-2 border-slate-900 rounded max-w-[148mm] mx-auto text-[11px] leading-normal shadow-sm">
      {/* Header */}
      <div className="text-center border-b-2 border-slate-900 pb-2 mb-2">
        <h2 className="text-base font-black text-slate-950">{settings.shopName}</h2>
        <p className="text-[10px] text-slate-600">وەسڵی وەرگرتنی پارەی قیستی مۆبایل</p>
        <div className="flex justify-between items-center text-[9.5px] font-mono mt-1 text-slate-700">
          <span>ژمارەی وەسڵ: <strong>{payment.receiptNumber}</strong></span>
          <span>بەروار: <strong>{payment.date}</strong></span>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-1.5 border border-slate-300 p-2 rounded mb-2 bg-slate-50/50">
        <div className="flex justify-between">
          <span className="text-slate-600">ناوی کڕیار:</span>
          <strong className="text-slate-950 text-xs">{payment.customerName}</strong>
        </div>

        {contract && (
          <>
            <div className="flex justify-between">
              <span className="text-slate-600">مۆبایل:</span>
              <span>{contract.device.model} ({contract.device.storage})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">ژ. گرێبەست:</span>
              <span className="font-mono">{contract.contractNumber}</span>
            </div>
          </>
        )}

        <div className="flex justify-between">
          <span className="text-slate-600">شێوازی پارەدان:</span>
          <span>
            {payment.paymentMethod === 'cash' && 'کاش / دەستی'}
            {payment.paymentMethod === 'bank_transfer' && 'حەواڵەی بانکی'}
            {payment.paymentMethod === 'fib' && 'First Iraqi Bank (FIB)'}
            {payment.paymentMethod === 'fastpay' && 'فاستپەی (FastPay)'}
          </span>
        </div>

        {payment.isEarlyPayoff ? (
          <div className="bg-emerald-50 text-emerald-900 font-bold p-1 rounded text-center text-[10px] border border-emerald-300">
            ⚡ پارەدانی پێشوەختە و یەکلاییکردنەوەی تەواوی قەرز
          </div>
        ) : (
          <div className="flex justify-between">
            <span className="text-slate-600">بەرامبەر قیستی ژمارە:</span>
            <strong className="font-mono">#{payment.installmentNumbers.join('، #')}</strong>
          </div>
        )}
      </div>

      {/* Financial Numbers */}
      <div className="border-2 border-slate-900 p-2 rounded text-center mb-2 bg-slate-100/70">
        <div className="text-[10px] text-slate-600">بڕی پارەی وەرگیراو</div>
        <div className="text-lg font-black text-slate-950 font-mono">
          {formatCurrency(payment.amount)}
        </div>
        <div className="text-[9.5px] text-slate-600 border-t border-slate-300 mt-1 pt-1 flex justify-between px-2">
          <span>قەرزی ماوە لای کڕیار:</span>
          <strong className="font-mono text-red-900">{formatCurrency(payment.remainingBalanceAfter)}</strong>
        </div>
      </div>

      {payment.notes && (
        <div className="text-[9px] text-slate-600 mb-2 italic">
          تێبینی: {payment.notes}
        </div>
      )}

      {/* Signature & Stamp */}
      <div className="grid grid-cols-2 gap-2 text-center text-[9.5px] border-t border-slate-300 pt-2 mt-2">
        <div>
          <div className="text-slate-700">واژووی کڕیار</div>
          <div className="mt-4 border-b border-dotted border-slate-400"></div>
        </div>
        <div>
          <div className="text-slate-700 font-medium">مۆر و واژووی وەرگر ({payment.collectedBy?.userName || settings.sellerName})</div>
          <div className="mt-4 border-b border-dotted border-slate-400"></div>
        </div>
      </div>

      <div className="text-center text-[8px] text-slate-400 mt-2">
        پەیوەندی: {settings.phone} | {settings.address}
      </div>
    </div>
  );
};

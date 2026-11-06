import React from 'react';
import { X, Printer, ArrowLeft } from 'lucide-react';
import { LegalContractDocument } from './LegalContractDocument.tsx';
import { BankAuthorizationDocument } from './BankAuthorizationDocument.tsx';
import { ReceiptDocument } from './ReceiptDocument.tsx';
import { Contract, Customer, PaymentRecord, ShopSettings } from '../types/index.ts';

export type PrintMode = 'legal' | 'bank' | 'receipt';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: PrintMode;
  contract?: Contract | null;
  customer?: Customer | null;
  payment?: PaymentRecord | null;
  settings: ShopSettings;
}

export const PrintPreviewModal: React.FC<Props> = ({
  isOpen,
  onClose,
  mode,
  contract,
  customer,
  payment,
  settings,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-start p-2 sm:p-6">
      
      {/* Top Bar for Action (Hidden on Print) */}
      <div className="no-print w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl p-4 mb-4 flex items-center justify-between text-white shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-sm font-bold">
              {mode === 'legal' && 'گرێبەست و کۆمپیالەی فرۆشتنی مۆبایل بە قیست (A4)'}
              {mode === 'bank' && 'فۆرمی ڕەزامەندی بانکی و وەرگرتنی مووچە (A4)'}
              {mode === 'receipt' && 'وەسڵی فەرمی پارەدانی قیست'}
            </h2>
            <p className="text-[11px] text-slate-400">
              ئامادەکراو بۆ پرینتکردن ڕاستەوخۆ لەسەر ١ لاپەڕەی A4 بەبێ بەگراوند و زیادە
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>چاپکردن (Print)</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Document Viewport */}
      <div className="w-full max-w-[215mm] bg-white text-slate-900 shadow-2xl rounded-sm print:rounded-none print:shadow-none print:p-0 my-auto">
        {mode === 'legal' && contract && (
          <LegalContractDocument
            contract={contract}
            customer={customer || undefined}
            settings={settings}
          />
        )}

        {mode === 'bank' && contract && (
          <BankAuthorizationDocument
            contract={contract}
            customer={customer || undefined}
            settings={settings}
          />
        )}

        {mode === 'receipt' && payment && (
          <div className="p-4">
            <ReceiptDocument
              payment={payment}
              contract={contract || undefined}
              settings={settings}
            />
          </div>
        )}
      </div>

    </div>
  );
};

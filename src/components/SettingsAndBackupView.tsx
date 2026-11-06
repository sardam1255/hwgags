import React, { useState } from 'react';
import { 
  Settings, 
  Save, 
  Download, 
  Upload, 
  Cloud, 
  ShieldCheck, 
  Building2, 
  FileText, 
  CheckCircle,
  RefreshCw,
  LogOut,
  Smartphone,
  Laptop,
  Monitor,
  Terminal,
  FolderArchive,
  HardDrive,
  ExternalLink
} from 'lucide-react';
import { ShopSettings } from '../types/index.ts';
import { User } from 'firebase/auth';

interface Props {
  settings: ShopSettings;
  onSaveSettings: (settings: ShopSettings) => Promise<void>;
  onRestoreBackup: (data: any) => Promise<void>;
  driveUser: User | null;
  onConnectDrive: () => Promise<void>;
  onDisconnectDrive: () => Promise<void>;
  onSyncDriveNow: () => Promise<void>;
  onRestoreFromDrive: () => Promise<void>;
  driveSyncing: boolean;
  lastDriveSync: string | null;
}

export const SettingsAndBackupView: React.FC<Props> = ({
  settings,
  onSaveSettings,
  onRestoreBackup,
  driveUser,
  onConnectDrive,
  onDisconnectDrive,
  onSyncDriveNow,
  onRestoreFromDrive,
  driveSyncing,
  lastDriveSync,
}) => {
  const [formData, setFormData] = useState<ShopSettings>({ ...settings });
  const [saving, setSaving] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const handleChange = (field: keyof ShopSettings, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveSettings(formData);
      alert('ڕێکخستنەکان بە سەرکەوتوویی پاشەکەوتکران');
    } catch {
      alert('هەڵە لە پاشەکەوتکردنی ڕێکخستنەکان');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadBackup = () => {
    window.location.href = '/api/backup';
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        try {
          setRestoring(true);
          const parsed = JSON.parse(reader.result);
          await onRestoreBackup(parsed);
          alert('هەموو داتاکان بە سەرکەوتوویی گەڕێنرانەوە!');
        } catch {
          alert('فایلەکە شیاو نییە یان هەڵەیەک لە خوێندنەوەی هەیە');
        } finally {
          setRestoring(false);
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <span>ڕێکخستنەکانی سیستەم و باکئەپی گووگڵ درایڤ</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            زانیاری دووکان و فرۆشیار، حیسابی بانکی IBAN، ڕێژەی قازانج و هاوکاتکردنی داتاکان لە هەموو ئامێرەکان
          </p>
        </div>

        <button
          onClick={handleDownloadBackup}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors shadow-xs"
        >
          <Download className="w-4 h-4" />
          <span>داگرتنی باکئەپ بە فایلی JSON</span>
        </button>
      </div>

      {/* Google Drive Automatic Sync Panel (Specifically requested by user) */}
      <div className="bg-white border-2 border-blue-500/30 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>بەستنەوە بە Google Drive و پاشەکەوتکردنی ئۆتۆماتیکی</span>
                {driveUser && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    بەستراوەتەوە
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                لەگەڵ تۆمارکردنی هەر کڕیار، گرێبەست، وەسڵ و خەرجییەک بە ئۆتۆماتیکی لە Google Driveـەکەت خەزن دەبێت
              </p>
            </div>
          </div>

          <div>
            {!driveUser ? (
              <button
                type="button"
                onClick={onConnectDrive}
                className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl border border-slate-300 shadow-sm transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>بەستنەوە بە Google Drive</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onSyncDriveNow}
                  disabled={driveSyncing}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${driveSyncing ? 'animate-spin' : ''}`} />
                  <span>{driveSyncing ? 'خەزنکردن...' : 'ئێستا خەزنی بکە'}</span>
                </button>
                <button
                  type="button"
                  onClick={onRestoreFromDrive}
                  disabled={driveSyncing}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs px-3.5 py-2 rounded-xl transition-all"
                >
                  گەڕاندنەوە لە Drive
                </button>
                <button
                  type="button"
                  onClick={onDisconnectDrive}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  title="پچڕانی پەیوەندی"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {driveUser ? (
          <div className="bg-blue-50/60 border border-blue-200/60 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-blue-950 gap-2">
            <div>
              <span className="font-bold">ئەکاونتی بەستراوە: </span>
              <span className="font-mono text-blue-900">{driveUser.email}</span>
              <span className="block text-[11px] text-blue-700 mt-0.5">
                فایلی <code>sarvan_qist_mobile_backup.json</code> بە بەردەوامی نوێ دەکرێتەوە.
              </span>
            </div>
            {lastDriveSync && (
              <div className="text-[11px] text-slate-500 font-mono">
                دوایین خەزنکردن: {new Date(lastDriveSync).toLocaleTimeString('ar-IQ')}
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-500 leading-relaxed">
            کاتێک دوگمەی سەرەوە دەکەیتەوە، سیستەمەکە ڕەزامەندی وەردەگرێت بۆ دروستکردن و نوێکردنەوەی فایلی باکئەپی تایبەت لەسەر Google Driveـەکەت، بەجۆرێک لەگەڵ هەر کردارێکی نوێ (گرێبەست، وەرگرتنی قیست یان خەرجی) داتاکان بە شێوەی خۆکار لەسەر درایڤەکەت دەمێننەوە.
          </p>
        )}
      </div>

      {/* Cloud & Multi-device Sync status card */}
      <div className="bg-gradient-to-l from-blue-900 to-indigo-900 text-white rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 font-bold text-sm">
          <Cloud className="w-5 h-5 text-blue-300" />
          <span>هاوکاتکردنی ڕاستەوخۆی لاپتۆپ و مۆبایل (Cloud Sync)</span>
        </div>
        <p className="text-xs text-blue-100 leading-relaxed">
          داتاکانت ڕاستەوخۆ لەسەر سێرڤەری هەوری پارێزراون. هەر شتێک لە لاپتۆپ زیاد بکەیت، دەستبەجێ لەسەر مۆبایلەکەشت نوێ دەبێتەوە کاتێک بە یوزەرنەیم و پاسۆردەکەت دەچیتە ژوورەوە.
        </p>
        <div className="flex flex-wrap items-center gap-4 text-xs pt-1 border-t border-blue-800/80">
          <span className="flex items-center gap-1.5 text-blue-200">
            <Laptop className="w-4 h-4" /> لاپتۆپ: دەستبەجێ بەستراوە
          </span>
          <span className="flex items-center gap-1.5 text-blue-200">
            <Smartphone className="w-4 h-4" /> مۆبایل: دەستبەجێ بەستراوە
          </span>
          <span className="flex items-center gap-1.5 text-blue-200">
            <ShieldCheck className="w-4 h-4" /> پارێزراوە بە وشەی نهێنی خاوەن کار
          </span>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
        
        {/* Store & Seller Info */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>زانیاری لایەنی فرۆشیار (بۆ سەر گرێبەست و کۆمپیالە)</span>
          </h2>

          <div>
            <label className="block text-slate-700 font-medium mb-1">
              ناوی دووکان / کۆمپانیا *
            </label>
            <input
              type="text"
              required
              value={formData.shopName}
              onChange={(e) => handleChange('shopName', e.target.value)}
              placeholder="ناوی دووکانی مۆبایلەکەت بنووسە"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">
              ناوی فرۆشیار (خاوەن کار) *
            </label>
            <input
              type="text"
              required
              value={formData.sellerName}
              onChange={(e) => handleChange('sellerName', e.target.value)}
              placeholder="ناوی تەواوی بەڕێوەبەر / فرۆشیار"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white font-medium"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">
              ژمارەی مۆبایلی دووکان / پەیوەندی *
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="0750 000 0000"
              dir="ltr"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white font-mono text-right"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">
              ناونیشانی دووکان
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="هەولێر / بازاڕی نیشتمان / شەقامی سەرەکی"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white"
            />
          </div>
        </div>

        {/* Bank & Payment Info */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>هەژماری بانکی تۆ (بۆ فۆرمی ڕەزامەندی بانکی کڕیار)</span>
          </h2>

          <div>
            <label className="block text-slate-700 font-medium mb-1">
              ناوی بانکی تۆ
            </label>
            <input
              type="text"
              value={formData.bankName}
              onChange={(e) => handleChange('bankName', e.target.value)}
              placeholder="RT Bank، TBI، بانکی جیهان، هەرێم..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">
              ژمارەی حیساب (Account No)
            </label>
            <input
              type="text"
              value={formData.accountNumber}
              onChange={(e) => handleChange('accountNumber', e.target.value)}
              placeholder="123456789"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white font-mono"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">
              ژمارەی IBANـی تۆ (کڕیار پارەی دەخاتە سەر ئەمە)
            </label>
            <input
              type="text"
              value={formData.iban}
              onChange={(e) => handleChange('iban', e.target.value)}
              placeholder="IQ00RTBK00000000000000000000"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white font-mono font-bold text-blue-900"
              dir="ltr"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                ڕێژەی قازانجی بنەڕەتی (% مانگانە)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.defaultProfitRate}
                onChange={(e) => handleChange('defaultProfitRate', Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white font-mono"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                خەرجی مامەڵەی خاوەن کار (دینار)
              </label>
              <input
                type="number"
                step="5000"
                value={formData.ownerFeeAmount}
                onChange={(e) => handleChange('ownerFeeAmount', Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white font-mono"
                dir="ltr"
              />
            </div>
          </div>
        </div>

        {/* Legal Clauses Section */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <h2 className="text-xs font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-slate-700" />
            <span>مەرجە یاسایی و تەکنیکییەکان (دەقی فەرمی سەر گرێبەستی A4)</span>
          </h2>
          <p className="text-[11px] text-slate-500">
            دەتوانیت مەرجی تایبەتی خۆت زیاد بکەیت یان دەستکاری بکەیت، ئەم دەقە ڕاستەوخۆ دەچێتە سەر گرێبەستی کڕیار و کفیل:
          </p>
          <textarea
            rows={6}
            value={formData.customLegalTerms}
            onChange={(e) => handleChange('customLegalTerms', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs leading-relaxed text-slate-900 focus:bg-white font-mono"
          />
        </div>

        {/* Save button */}
        <div className="lg:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-blue-600/30 text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'پاشەکەوتکردن...' : 'پاشەکەوتکردنی هەموو گۆڕانکارییەکان'}</span>
          </button>
        </div>

      </form>

      {/* Manual Backup and Restore Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
        <h2 className="text-xs font-bold text-slate-900 flex items-center gap-2">
          <Download className="w-4 h-4 text-emerald-600" />
          <span>پاشەکەوتکردنی دەستی و گەڕاندنەوەی باکئەپ (Manual Backup & Restore)</span>
        </h2>
        <p className="text-xs text-slate-500">
          دەتوانیت بە یەک کلیک هەموو زانیاری و گرێبەستەکان بە فایلی JSON دابگریت و لەسەر کۆمپیوتەر یان فلاش پاشەکەوتی بکەیت:
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleDownloadBackup}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>داگرتنی کۆپییەکی تەواو (JSON)</span>
          </button>

          <label className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            <span>{restoring ? 'گەڕاندنەوە...' : 'گەڕاندنەوەی فایلی باکئەپ لە کۆمپیوتەر'}</span>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleRestoreFile}
            />
          </label>
        </div>
      </div>

      {/* Windows Desktop & Offline EXE Section */}
      <div className="bg-white border-2 border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Monitor className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>کارپێکردن لەسەر لاپتۆپ و کۆمپیوتەر وەک بەرنامەی سەربەخۆ (Windows .exe)</span>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                  100% ئۆفلاین
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                سیستەمەکە دەتوانرێت بەتەواوی لەسەر لاپتۆپەکەت بەبێ ئینتەرنێت کاربکات و داتاکان لە ناوخۆی کۆمپیوتەرەکەت دەمێننەوە.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Method 1: Pre-packaged QISTYAR.exe */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <FolderArchive className="w-4 h-4 text-blue-600" />
              <span>شێوازی یەکەم: فایلی ئامادەکراوی سەربەخۆ (QISTYAR.exe)</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              لە ڕێگەی گیت‌هەبەوە فایلی <code className="bg-slate-200 px-1 py-0.5 rounded text-blue-900 font-bold">build-windows.yml</code> بە ئۆتۆماتیکی فایلی تەواوی پڕۆژەکە دەکاتە بەرنامەی <code className="font-bold text-emerald-700">QISTYAR.exe</code>. دەتوانیت فایلی زیپەکە دابگریت و لەسەر کۆمپیوتەر دەربهێنیت.
            </p>
            <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-[11px] text-slate-700 space-y-1">
              <div className="font-semibold text-slate-900">هەنگاوەکان:</div>
              <ol className="list-decimal list-inside space-y-1 text-slate-600">
                <li>فایلی زیپ لە گیت‌هەب دابگرە و بیکەرەوە (Extract)</li>
                <li>دوو کلیک لەسەر <span className="font-bold text-blue-700">QISTYAR.exe</span> بکە</li>
                <li>وێبگەڕ خۆکارانە لەسەر <span className="font-mono text-slate-900">http://localhost:3000</span> دەکرێتەوە</li>
              </ol>
            </div>
          </div>

          {/* Method 2: 1-Click Batch Launcher */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <Terminal className="w-4 h-4 text-emerald-600" />
              <span>شێوازی دووەم: دەستپێکردنی خێرا (Start-QISTYAR.bat)</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              ئەگەر کۆدی پڕۆژەکەت لایە، تەنیا ئەم فایلە هەڵکەرە بخەرە ناو فۆڵدەری سەرەکی پڕۆژەکە و کلیکی لێ بکە؛ خۆی هەموو شتێک ئامادە دەکات و پەڕەکە دەکاتەوە.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <a
                href="/api/download-launcher"
                download="Start-QISTYAR.bat"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>داگرتنی Start-QISTYAR.bat</span>
              </a>

              <a
                href="/api/download-silent-launcher"
                download="Start-QISTYAR-Silent.vbs"
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-[11px] px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
                title="دەستپێکردن بەبێ دەرکەوتنی پەنجەرەی ڕەشی CMD"
              >
                <Download className="w-3.5 h-3.5" />
                <span>داگرتنی شێوازی بێدەنگ (.vbs)</span>
              </a>
            </div>
          </div>
        </div>

        {/* Local Storage & Security Notice */}
        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="font-bold text-blue-950 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-blue-700" />
              <span>داتاکانی ناوخۆ لە کۆمپیوتەرەکەت:</span>
            </div>
            <p className="text-blue-900 text-[11px]">
              هەموو کڕیاران و گرێبەستەکان لە فایلی <code className="bg-blue-100 px-1 py-0.5 rounded font-mono font-bold">data/db.json</code> لە تەنیشت بەرنامەکە پاشەکەوت دەبن و هەمیشە پارێزراون.
            </p>
          </div>

          <a
            href="/api/download-readme"
            download="README-Windows.txt"
            className="inline-flex items-center gap-1.5 bg-white hover:bg-blue-100/50 text-blue-800 font-semibold text-xs px-3 py-2 rounded-lg border border-blue-300 transition-colors shrink-0"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>خوێندنەوەی ڕێنمایی کوردی (README.txt)</span>
          </a>
        </div>
      </div>

    </div>
  );
};

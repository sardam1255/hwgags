import React, { useState } from 'react';
import { 
  Send, 
  CheckCircle, 
  AlertTriangle, 
  BellRing, 
  Save, 
  MessageSquare, 
  Share2, 
  Clock, 
  Calendar,
  Zap,
  PhoneCall
} from 'lucide-react';
import { ShopSettings, Contract } from '../types/index.ts';
import { formatCurrency } from '../utils/calculations.ts';

interface Props {
  settings: ShopSettings;
  contracts: Contract[];
  onSaveSettings: (settings: ShopSettings) => Promise<void>;
}

export const TelegramAndAlertsView: React.FC<Props> = ({
  settings,
  contracts,
  onSaveSettings,
}) => {
  const [botToken, setBotToken] = useState(settings.telegramBotToken || '');
  const [chatId, setChatId] = useState(settings.telegramChatId || '');
  const [telegramEnabled, setTelegramEnabled] = useState(settings.telegramEnabled || false);

  const [notify3DaysBefore, setNotify3DaysBefore] = useState(settings.notify3DaysBefore ?? true);
  const [notifyOnDueDay, setNotifyOnDueDay] = useState(settings.notifyOnDueDay ?? true);
  const [notify7DaysOverdue, setNotify7DaysOverdue] = useState(settings.notify7DaysOverdue ?? true);
  const [notifyOnContractComplete, setNotifyOnContractComplete] = useState(settings.notifyOnContractComplete ?? true);
  const [notifyEndOfDay, setNotifyEndOfDay] = useState(settings.notifyEndOfDay ?? true);

  const [testStatus, setTestStatus] = useState<{ loading: boolean; success?: boolean; message?: string }>({
    loading: false,
  });

  const [cronStatus, setCronStatus] = useState<{ loading: boolean; message?: string }>({
    loading: false,
  });

  const [saving, setSaving] = useState(false);

  // Quick WhatsApp / SMS alert generator for a specific customer
  const [selectedContractForAlert, setSelectedContractForAlert] = useState<string>(
    contracts[0]?.id || ''
  );

  const selectedContract = contracts.find((c) => c.id === selectedContractForAlert);

  const nextPendingInstallment = selectedContract?.schedule.find((i) => i.status !== 'paid');

  const customerAlertMessage = selectedContract && nextPendingInstallment
    ? `سڵاو بەڕێز ${selectedContract.customerName}،
ئاگادارت دەکەینەوە لە ${settings.shopName}، کاتی دانەوەی قیستی مۆبایلەکەت (#${nextPendingInstallment.installmentNumber}) بە بڕی ${formatCurrency(nextPendingInstallment.amount)} لە ڕێکەوتی ${nextPendingInstallment.dueDate} نزیک بووەتەوە.
سوپاس بۆ پابەندبوون و متمانەت.`
    : '';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveSettings({
        ...settings,
        telegramBotToken: botToken,
        telegramChatId: chatId,
        telegramEnabled,
        notify3DaysBefore,
        notifyOnDueDay,
        notify7DaysOverdue,
        notifyOnContractComplete,
        notifyEndOfDay,
      });
      alert('ڕێکخستنەکانی تێلیگرام و ئاگادارکردنەوە پاشەکەوتکران');
    } catch {
      alert('هەڵە لە پاشەکەوتکردن');
    } finally {
      setSaving(false);
    }
  };

  const handleTestTelegram = async () => {
    if (!botToken || !chatId) {
      alert('تکایە سەرەتا Bot Token و Chat ID بنووسە');
      return;
    }
    setTestStatus({ loading: true });
    try {
      const res = await fetch('/api/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken, chatId }),
      });
      const data = await res.json();
      setTestStatus({ loading: false, success: data.success, message: data.message });
    } catch {
      setTestStatus({ loading: false, success: false, message: 'هەڵە لە پەیوەندی کردن بە تێلیگرام' });
    }
  };

  const handleCheckDueNow = async () => {
    setCronStatus({ loading: true });
    try {
      const res = await fetch('/api/telegram/check-due', {
        method: 'POST',
      });
      const data = await res.json();
      setCronStatus({
        loading: false,
        message: data.success
          ? `پشکنین تەواو بوو! (${data.alertsSentCount} ئاگاداری بۆ تێلیگرام نێردرا)`
          : data.message,
      });
    } catch {
      setCronStatus({ loading: false, message: 'هەڵە لە ئەنجامدانی پشکنین' });
    }
  };

  const handleSendDailyReportNow = async () => {
    setCronStatus({ loading: true });
    try {
      const res = await fetch('/api/telegram/daily-report', {
        method: 'POST',
      });
      const data = await res.json();
      setCronStatus({
        loading: false,
        message: data.success ? 'ڕاپۆرتی کۆتایی ڕۆژ بە سەرکەوتوویی بۆ تێلیگرام نێردرا' : data.message,
      });
    } catch {
      setCronStatus({ loading: false, message: 'هەڵە لە ناردنی ڕاپۆرت' });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-500" />
            <span>سیستەمی زیرەکی ئاگادارکردنەوە و بۆتی تێلیگرام</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            ئاگادارکردنەوەی خۆکار بۆ قیستەکان ٣ ڕۆژ پێش کات، ڕۆژی قیست، دواکەوتنی ٧ ڕۆژ و ناردنی نامە بۆ کڕیار
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCheckDueNow}
            disabled={cronStatus.loading}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>پشکنینی ئێستای قیستەکان</span>
          </button>
          <button
            onClick={handleSendDailyReportNow}
            disabled={cronStatus.loading}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>ناردنی ڕاپۆرتی ڕۆژ</span>
          </button>
        </div>
      </div>

      {cronStatus.message && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded-xl text-center font-medium">
          {cronStatus.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Telegram Bot Setup */}
        <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-600" />
              <span>بەستنەوە بە بۆتی تێلیگرام (Telegram Bot API)</span>
            </h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={telegramEnabled}
                onChange={(e) => setTelegramEnabled(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="font-bold text-slate-800">چالاککردنی بۆت</span>
            </label>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">
              تۆکنی بۆت (Bot Token) لە BotFather
            </label>
            <input
              type="text"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="بۆ نموونە: 123456789:ABCDefghIJKlmnoPQRstuv..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white font-mono"
              dir="ltr"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              لە تێلیگرام بچۆ ناو @BotFather و فەرمانی /newbot بنووسە بۆ بەدەستهێنانی Token.
            </p>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">
              ژمارەی چات (Chat ID)
            </label>
            <input
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="بۆ نموونە: 123456789 یان -100123456789"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white font-mono"
              dir="ltr"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              دەتوانیت لە ڕێگەی بۆتی @userinfobot لە تێلیگرام ژمارەی Chat ID ی خۆت ببینیتەوە.
            </p>
          </div>

          {/* Alert Type Checkboxes */}
          <div className="pt-3 border-t border-slate-100 space-y-2.5">
            <h3 className="font-bold text-slate-900 mb-2">جۆرەکانی ئاگادارکردنەوەی خۆکار:</h3>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={notify3DaysBefore}
                onChange={(e) => setNotify3DaysBefore(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-slate-800">٣ ڕۆژ پێش هاتنی کاتی قیست ئاگادارم بکەرەوە</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyOnDueDay}
                onChange={(e) => setNotifyOnDueDay(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-slate-800">لە ڕۆژی قیستدا ئاگادارکردنەوە بنێرێت</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={notify7DaysOverdue}
                onChange={(e) => setNotify7DaysOverdue(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-rose-700 font-bold">ئەگەر قیست ٧ ڕۆژ دواکەوت ئاگاداری تایبەتی سوور بنێرێت</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyOnContractComplete}
                onChange={(e) => setNotifyOnContractComplete(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-emerald-800 font-medium">ئەگەر کڕیار هەموو قەرزەکەی دا، گرێبەستەکە خۆکار دابخرێت و پیرۆزبایی بنێرێت</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyEndOfDay}
                onChange={(e) => setNotifyEndOfDay(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-slate-800">ڕاپۆرتی پوختەی کۆتایی ڕۆژ (داهات، خەرجی و سندووق)</span>
            </label>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl shadow-xs"
            >
              {saving ? 'پاشەکەوتکردن...' : 'پاشەکەوتکردنی ڕێکخستنەکان'}
            </button>
            <button
              type="button"
              onClick={handleTestTelegram}
              disabled={testStatus.loading}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium px-4 py-2.5 rounded-xl"
            >
              {testStatus.loading ? 'ناردن...' : 'تێستی پەیوەندی بۆت'}
            </button>
          </div>

          {testStatus.message && (
            <div
              className={`p-2.5 rounded-xl text-center ${
                testStatus.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {testStatus.message}
            </div>
          )}
        </form>

        {/* Right Column: Direct Customer Message / WhatsApp / SMS Alert Sender */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5 text-xs">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>ئاگادارکردنەوەی ڕاستەوخۆی کڕیار بە WhatsApp / SMS / تێلیگرام</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">
              دروستکردنی دەقی فەرمی و جوان بۆ بیرخستنەوەی کاتی قیست بە کڕیار
            </p>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">
              کڕیار هەڵبژێرە:
            </label>
            <select
              value={selectedContractForAlert}
              onChange={(e) => setSelectedContractForAlert(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium"
            >
              {contracts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.customerName} - {c.device.model} ({c.customerPhone})
                </option>
              ))}
            </select>
          </div>

          {selectedContract && nextPendingInstallment && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1 font-mono text-[11px]">
              <div>کڕیار: <strong className="text-slate-900">{selectedContract.customerName}</strong></div>
              <div>ژ. مۆبایل: <strong className="text-slate-900">{selectedContract.customerPhone}</strong></div>
              <div>قیستی داهاتوو: <strong>#{nextPendingInstallment.installmentNumber}</strong></div>
              <div>بەرواری قیست: <strong>{nextPendingInstallment.dueDate}</strong></div>
              <div>بڕ: <strong className="text-emerald-700">{formatCurrency(nextPendingInstallment.amount)}</strong></div>
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-medium mb-1">
              دەقی نامەی ئاگادارکردنەوە بۆ کڕیار:
            </label>
            <textarea
              rows={5}
              readOnly
              value={customerAlertMessage}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-mono text-[11px] leading-relaxed select-all"
            />
          </div>

          {/* Action buttons to trigger chat links */}
          {selectedContract && (
            <div className="grid grid-cols-3 gap-2">
              <a
                href={`https://wa.me/${selectedContract.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(customerAlertMessage)}`}
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-xl text-center flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <span>WhatsApp</span>
              </a>

              <a
                href={`https://t.me/share/url?url=${encodeURIComponent('https://' + (settings.phone || ''))}&text=${encodeURIComponent(customerAlertMessage)}`}
                target="_blank"
                rel="noreferrer"
                className="bg-blue-500 hover:bg-blue-400 text-white font-medium py-2.5 rounded-xl text-center flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <span>Telegram</span>
              </a>

              <a
                href={`sms:${selectedContract.customerPhone}?body=${encodeURIComponent(customerAlertMessage)}`}
                className="bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 rounded-xl text-center flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <span>SMS</span>
              </a>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

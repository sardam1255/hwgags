import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import child_process from 'child_process';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { ShopSettings, Customer, Contract, PaymentRecord, AppUser } from './src/types/index.ts';

interface Expense {
  id: string;
  title: string;
  amount: number;
  date: string;
  category?: string;
  notes?: string;
}

dotenv.config();

const isSea = typeof (process as any).isSea === 'function' ? (process as any).isSea() : false;
const isDesktopExe = process.env.IS_DESKTOP_EXE === 'true' || isSea || process.execPath.toLowerCase().endsWith('.exe');

let baseAppDir: string;
try {
  const currentFile = fileURLToPath(import.meta.url);
  baseAppDir = isDesktopExe ? path.dirname(process.execPath) : path.dirname(currentFile);
} catch {
  baseAppDir = isDesktopExe ? path.dirname(process.execPath) : process.cwd();
}

// Data storage directory and file (works in cloud, dev, or local desktop exe)
const DATA_DIR = fs.existsSync(path.resolve(baseAppDir, 'data'))
  ? path.resolve(baseAppDir, 'data')
  : (fs.existsSync(path.resolve(process.cwd(), 'data')) ? path.resolve(process.cwd(), 'data') : path.resolve(baseAppDir, 'data'));
const DB_FILE = path.join(DATA_DIR, 'db.json');

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

const defaultLegalTerms = `١. لایەنی دووەم (کڕیار) و لایەنی سێیەم (کفیل) بە یەکەوە و بە هاوبەشی بەرپرسیارن لە دانەوەی هەموو بڕی پارەی قیستەکان لە کاتی دیاریکراوی خۆیدا.
٢. لە حاڵەتی دواکەوتنی هەر قیستێک بۆ ماوەی زیاتر لە ٧ ڕۆژ، تەواوی پارەی ماوەی قیستەکان دەبێتە قەرزێکی دەستبەجێ (حاڵ) و فرۆشیار مافی قانونی هەیە پەنا بباتە بەر دادگاکانی هەرێمی کوردستان و دەستبەسەرداگرتنی مۆڵەت و مووچەی کڕیار یان کفیل.
٣. مۆبایلەکە بە ئەمانەت لای کڕیارە تا کاتی دانەوەی تەواوی کۆتا دیناری قیستەکان، و کڕیار مافی فرۆشتن، بەخشین، یا ڕەهنکردنی مۆبایلەکەی نییە بەبێ ڕەزامەندی نووسراوی فرۆشیار.
٤. کڕیار ڕەزامەندە لەسەر ئەوەی ئەگەر لە قیستەکان دواکەوت، خاوەن دووکان مافی هەیە لە ڕێگەی سیستەمی کۆنتڕۆڵ و خزمەتگوزاری قفڵکردنی ئایکلۆد (iCloud) یان ئەکاونتی گووگڵ یا بەرنامەی تایبەتی قیست دەستبەجێ مۆبایلەکە ڕابگرێت تا کاتی یەکلاییکردنەوەی قەرزەکە.
٥. ئەم گرێبەستە بەپێی یاسای مەدەنی عێراقی و ڕێنماییە کارپێکراوەکانی هەرێمی کوردستان داڕێژراوە و لە بەردەم لایەنە دادوەرییەکان بەڵگەیەکی تەواوی بەستراوە.`;

const defaultSettings: ShopSettings = {
  shopName: 'سیستەمی بەڕێوەبردنی قیست',
  sellerName: 'بەڕێوەبەری سەرەکی',
  phone: '0750 000 0000',
  address: 'هەولێر - بازاڕی مۆبایل',
  bankName: 'بانکی ئەهلی عێراقی / RT Bank',
  accountNumber: '',
  iban: 'IQ00RTBK00000000000000000000',
  defaultProfitRate: 2.5,
  enableOwnerFee: true,
  ownerFeeAmount: 50000,
  initialCapital: 10000000, // 10,000,000 IQD initial capital default
  usdExchangeRate: 150000, // 100$ = 150,000 IQD
  capitalHistory: [],
  telegramBotToken: '',
  telegramChatId: '',
  telegramEnabled: false,
  notify3DaysBefore: true,
  notifyOnDueDay: true,
  notify7DaysOverdue: true,
  notifyOnContractComplete: true,
  notifyEndOfDay: true,
  customLegalTerms: defaultLegalTerms,
};

interface DatabaseSchema {
  customers: Customer[];
  contracts: Contract[];
  payments: PaymentRecord[];
  expenses: Expense[];
  settings: ShopSettings;
  users: AppUser[];
}

function initDb(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialData: DatabaseSchema = {
      customers: [],
      contracts: [],
      payments: [],
      expenses: [],
      settings: defaultSettings,
      users: [],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf8');
    return initialData;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      customers: parsed.customers || [],
      contracts: parsed.contracts || [],
      payments: parsed.payments || [],
      expenses: parsed.expenses || [],
      settings: { ...defaultSettings, ...(parsed.settings || {}) },
      users: parsed.users || [],
    };
  } catch (err) {
    console.error('Error reading db.json, recreating empty db', err);
    const fallback: DatabaseSchema = {
      customers: [],
      contracts: [],
      payments: [],
      expenses: [],
      settings: defaultSettings,
      users: [],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(fallback, null, 2), 'utf8');
    return fallback;
  }
}

function saveDb(db: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write db.json:', err);
  }
}

let db = initDb();

// Helper to send Telegram message
async function sendTelegramMessage(text: string, overrideBotToken?: string, overrideChatId?: string): Promise<boolean> {
  const token = overrideBotToken || db.settings.telegramBotToken;
  const chatId = overrideChatId || db.settings.telegramChatId;

  if (!token || !chatId) {
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
      }),
    });
    const data = await res.json();
    return data.ok === true;
  } catch (e) {
    console.error('Telegram notification error:', e);
    return false;
  }
}

// ----------------- API ROUTES ----------------- //

// Auth endpoint
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const cleanUser = (username || '').trim();
  const cleanPass = (password || '').trim();

  // 1. Check Master Manager credentials
  if (cleanUser === 'sss.barzaniii' && cleanPass === 'SARvan123456@#$') {
    return res.json({
      success: true,
      token: 'session_barzani_' + Date.now(),
      user: {
        id: 'user_master_manager',
        username: 'sss.barzaniii',
        name: db.settings.sellerName || 'بەڕێوەبەری سەرەکی',
        phone: db.settings.phone || '0750 000 0000',
        role: 'manager',
        shopName: db.settings.shopName,
      },
    });
  }

  // 2. Check Employee / Deputy / Collector / Accountant accounts
  const matchedUser = db.users.find(
    (u) => u.username.toLowerCase() === cleanUser.toLowerCase() && u.password === cleanPass
  );

  if (matchedUser) {
    if (matchedUser.isActive === false) {
      return res.status(403).json({ success: false, message: 'ئەم هەژمارە ناچالاک کراوە لەلایەن بەڕێوەبەرەوە' });
    }

    return res.json({
      success: true,
      token: 'session_' + matchedUser.id + '_' + Date.now(),
      user: {
        id: matchedUser.id,
        username: matchedUser.username,
        name: matchedUser.fullName,
        phone: matchedUser.phone,
        role: matchedUser.role,
        shopName: db.settings.shopName,
      },
    });
  }

  return res.status(401).json({ success: false, message: 'ناوی بەکارهێنەر (Username) یان وشەی نهێنی (Password) هەڵەیە' });
});

// Full data fetch for cross-device sync
app.get('/api/data', (_req, res) => {
  db = initDb();
  res.json({
    customers: db.customers,
    contracts: db.contracts,
    payments: db.payments,
    expenses: db.expenses,
    settings: db.settings,
    users: db.users,
  });
});

// User Management Endpoints (Manager only)
app.get('/api/users', (_req, res) => {
  res.json({ success: true, users: db.users || [] });
});

app.post('/api/users', (req, res) => {
  const user: AppUser = req.body;
  if (!user.username || !user.password) {
    return res.status(400).json({ success: false, message: 'تکایە ناوی بەکارهێنەر و وشەی نهێنی بنووسە' });
  }

  // Check unique username (except itself on update)
  const duplicate = db.users.find(
    (u) => u.username.toLowerCase() === user.username.trim().toLowerCase() && u.id !== user.id
  );
  if (duplicate || user.username.trim().toLowerCase() === 'sss.barzaniii') {
    return res.status(400).json({ success: false, message: 'ئەم ناوی بەکارهێنەرە پێشتر بەکارهاتووە' });
  }

  if (!user.id) {
    user.id = 'USR-' + Date.now();
  }
  if (!user.createdAt) {
    user.createdAt = new Date().toISOString();
  }
  if (user.isActive === undefined) {
    user.isActive = true;
  }

  const existingIdx = db.users.findIndex((u) => u.id === user.id);
  if (existingIdx >= 0) {
    db.users[existingIdx] = user;
  } else {
    db.users.push(user);
  }
  saveDb(db);
  res.json({ success: true, user });
});

app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  db.users = db.users.filter((u) => u.id !== id);
  saveDb(db);
  res.json({ success: true });
});

// Capital update and deposit endpoint
app.post('/api/capital', (req, res) => {
  const { initialCapital, depositAmount, note, addedBy, action } = req.body;
  if (!db.settings.capitalHistory) {
    db.settings.capitalHistory = [];
  }

  if (action === 'deposit' && typeof depositAmount === 'number' && depositAmount > 0) {
    const prevCapital = db.settings.initialCapital || 0;
    const newCapital = prevCapital + depositAmount;
    db.settings.initialCapital = newCapital;

    const transaction = {
      id: 'CAP-' + Date.now(),
      amount: depositAmount,
      type: 'deposit' as const,
      date: new Date().toISOString(),
      note: note || 'زیادکردنی پارە بۆ سەرمایە',
      balanceAfter: newCapital,
      addedBy: addedBy || db.settings.sellerName || 'بەڕێوەبەری سەرەکی',
    };
    db.settings.capitalHistory.unshift(transaction);
    saveDb(db);
    return res.json({ 
      success: true, 
      initialCapital: db.settings.initialCapital,
      transaction,
      capitalHistory: db.settings.capitalHistory 
    });
  }

  if (typeof initialCapital === 'number' && initialCapital >= 0) {
    const prevCapital = db.settings.initialCapital || 0;
    db.settings.initialCapital = initialCapital;

    const diff = initialCapital - prevCapital;
    if (diff !== 0) {
      const transaction = {
        id: 'CAP-' + Date.now(),
        amount: Math.abs(diff),
        type: (diff > 0 ? 'deposit' : 'withdraw') as 'deposit' | 'withdraw',
        date: new Date().toISOString(),
        note: note || (diff > 0 ? 'زیادکردن و ڕێکخستنی سەرمایە' : 'کەمکردنەوەی سەرمایە'),
        balanceAfter: initialCapital,
        addedBy: addedBy || db.settings.sellerName || 'بەڕێوەبەری سەرەکی',
      };
      db.settings.capitalHistory.unshift(transaction);
    }
    saveDb(db);
    return res.json({ 
      success: true, 
      initialCapital: db.settings.initialCapital,
      capitalHistory: db.settings.capitalHistory 
    });
  }
  res.status(400).json({ success: false, message: 'بڕی سەرمایە نادروستە' });
});

// Save or Update Customer
app.post('/api/customers', (req, res) => {
  const customer: Customer = req.body;
  if (!customer.id) {
    customer.id = 'CUST-' + Date.now();
  }
  if (!customer.createdAt) {
    customer.createdAt = new Date().toISOString();
  }

  const existingIdx = db.customers.findIndex((c) => c.id === customer.id);
  if (existingIdx >= 0) {
    db.customers[existingIdx] = customer;
  } else {
    db.customers.unshift(customer);
  }
  saveDb(db);
  res.json({ success: true, customer });
});

// Delete customer
app.delete('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  db.customers = db.customers.filter((c) => c.id !== id);
  // Also remove contracts associated
  db.contracts = db.contracts.filter((ct) => ct.customerId !== id);
  saveDb(db);
  res.json({ success: true });
});

// Save or Update Contract
app.post('/api/contracts', async (req, res) => {
  const contract: Contract = req.body;
  if (!contract.id) {
    contract.id = 'CT-' + Date.now();
  }
  if (!contract.contractNumber) {
    contract.contractNumber = 'QIST-' + Math.floor(1000 + Math.random() * 9000);
  }
  if (!contract.createdAt) {
    contract.createdAt = new Date().toISOString();
  }

  const existingIdx = db.contracts.findIndex((c) => c.id === contract.id);
  const isNew = existingIdx < 0;

  if (!isNew) {
    db.contracts[existingIdx] = contract;
  } else {
    db.contracts.unshift(contract);
  }
  saveDb(db);

  // Send Telegram alert if enabled
  if (isNew && db.settings.telegramEnabled) {
    const text = `📱 <b>تۆمارکردنی گرێبەستی نوێی قیست</b>
━━━━━━━━━━━━━━━━━━━━
👤 کڕیار: <b>${contract.customerName}</b>
📞 مۆبایل: <code>${contract.customerPhone}</code>
📱 مۆبایل: <b>${contract.device.model}</b> (${contract.device.storage} - ${contract.device.color})
🔢 ژ. گرێبەست: <code>${contract.contractNumber}</code>
💵 پێشەکی دراو: <b>${contract.pricing.downPayment.toLocaleString()} دینار</b>
💰 کۆی قیست: <b>${contract.pricing.remainingBalance.toLocaleString()} دینار</b>
🗓 قیستی مانگانە: <b>${contract.pricing.monthlyInstallmentAmount.toLocaleString()} دینار (${contract.pricing.months} مانگ)</b>
━━━━━━━━━━━━━━━━━━━━
${db.settings.shopName || 'سیستەمی بەڕێوەبردنی قیست'}`;
    sendTelegramMessage(text).catch(() => {});
  }

  res.json({ success: true, contract });
});

// Delete Contract
app.delete('/api/contracts/:id', (req, res) => {
  const { id } = req.params;
  db.contracts = db.contracts.filter((c) => c.id !== id);
  db.payments = db.payments.filter((p) => p.contractId !== id);
  saveDb(db);
  res.json({ success: true });
});

// Record Payment (Single installment, Multiple installments, or Early Payoff)
app.post('/api/payments', async (req, res) => {
  const {
    contractId,
    customerId,
    customerName,
    amount,
    installmentNumbers,
    paymentMethod = 'cash',
    isEarlyPayoff = false,
    notes = '',
  } = req.body;

  const contract = db.contracts.find((c) => c.id === contractId);
  if (!contract) {
    return res.status(404).json({ error: 'گرێبەست نەدۆزرایەوە' });
  }

  const receiptNumber = 'REC-' + (db.payments.length + 1001);
  const today = new Date().toISOString().split('T')[0];

  // Mark installments as paid
  let paidSum = 0;
  if (isEarlyPayoff) {
    // Pay off all remaining installments
    contract.schedule.forEach((inst) => {
      if (inst.status !== 'paid') {
        inst.status = 'paid';
        inst.paidDate = today;
        inst.paidAmount = inst.amount;
        inst.receiptNumber = receiptNumber;
        paidSum += inst.amount;
      }
    });
    contract.status = 'completed';
  } else if (Array.isArray(installmentNumbers) && installmentNumbers.length > 0) {
    installmentNumbers.forEach((num) => {
      const inst = contract.schedule.find((i) => i.installmentNumber === num);
      if (inst && inst.status !== 'paid') {
        inst.status = 'paid';
        inst.paidDate = today;
        inst.paidAmount = inst.amount;
        inst.receiptNumber = receiptNumber;
        paidSum += inst.amount;
      }
    });

    // Check if all are now paid
    const remainingPending = contract.schedule.filter((i) => i.status !== 'paid');
    if (remainingPending.length === 0) {
      contract.status = 'completed';
    }
  }

  // Calculate remaining balance
  const remainingDebt = contract.schedule
    .filter((i) => i.status !== 'paid')
    .reduce((sum, i) => sum + i.amount, 0);

  const paymentRecord: PaymentRecord = {
    id: 'PAY-' + Date.now(),
    receiptNumber,
    contractId,
    customerId: customerId || contract.customerId,
    customerName: customerName || contract.customerName,
    amount: amount || paidSum,
    date: today,
    installmentNumbers: installmentNumbers || [],
    paymentMethod,
    remainingBalanceAfter: remainingDebt,
    isEarlyPayoff,
    notes,
    collectedBy: req.body.collectedBy,
  };

  db.payments.unshift(paymentRecord);
  saveDb(db);

  // Send Telegram notification
  if (db.settings.telegramEnabled) {
    let teleText = `🧾 <b>وەسڵی وەرگرتنی پارەی قیست</b>
━━━━━━━━━━━━━━━━━━━━
🔢 ژ. وەسڵ: <code>${receiptNumber}</code>
👤 کڕیار: <b>${contract.customerName}</b>
📱 مۆبایل: <b>${contract.device.model}</b>
💵 بڕی وەرگیراو: <b>${paymentRecord.amount.toLocaleString()} دینار</b>
${isEarlyPayoff ? '⚡ <b>پارەدانی پێشوەختە و یەکلاییکردنەوەی تەواوی قەرزەکە!</b>' : `🗓 قیستی ژمارە: <b>${paymentRecord.installmentNumbers.join('، ')}</b>`}
💰 بڕی ماوەی لای کڕیار: <b>${remainingDebt.toLocaleString()} دینار</b>
━━━━━━━━━━━━━━━━━━━━
${db.settings.shopName || 'سیستەمی بەڕێوەبردنی قیست'}`;

    if (contract.status === 'completed' && db.settings.notifyOnContractComplete) {
      teleText += `\n\n🎉 <b>پیرۆزە! ئەم گرێبەستە بە تەواوی کۆتایی هات و بە سەرکەوتوویی داخرا.</b>`;
    }

    sendTelegramMessage(teleText).catch(() => {});
  }

  res.json({
    success: true,
    paymentRecord,
    updatedContract: contract,
  });
});

// Shop Expenses
app.post('/api/expenses', (req, res) => {
  const expense: Expense = req.body;
  if (!expense.id) {
    expense.id = 'EXP-' + Date.now();
  }
  if (!expense.date) {
    expense.date = new Date().toISOString().split('T')[0];
  }
  db.expenses.unshift(expense);
  saveDb(db);
  res.json({ success: true, expense });
});

app.delete('/api/expenses/:id', (req, res) => {
  const { id } = req.params;
  db.expenses = db.expenses.filter((e) => e.id !== id);
  saveDb(db);
  res.json({ success: true });
});

// Settings update
app.post('/api/settings', (req, res) => {
  db.settings = { ...db.settings, ...req.body };
  saveDb(db);
  res.json({ success: true, settings: db.settings });
});

// Test Telegram bot
app.post('/api/telegram/test', async (req, res) => {
  const { botToken, chatId } = req.body;
  const token = botToken || db.settings.telegramBotToken;
  const chat = chatId || db.settings.telegramChatId;

  if (!token || !chat) {
    return res.status(400).json({ success: false, message: 'تکایە Bot Token و Chat ID بنووسە' });
  }

  const testMessage = `🤖 <b>تێستی بەستنەوەی بۆتی تێلیگرام</b>
━━━━━━━━━━━━━━━━━━━━
سڵاو! ئەم نامەیە لە سیستەمی بەڕێوەبردنی قیستی مۆبایلەکەتەوە نێردراوە.
بەستنەوەکە بە سەرکەوتوویی ئەنجامدرا!
ڕێکەوت: ${new Date().toLocaleString('ar-IQ')}
━━━━━━━━━━━━━━━━━━━━
${db.settings.shopName || 'سیستەمی بەڕێوەبردنی قیست'}`;

  const ok = await sendTelegramMessage(testMessage, token, chat);
  if (ok) {
    res.json({ success: true, message: 'نامەی تێست بە سەرکەوتوویی بۆ تێلیگرام نێردرا' });
  } else {
    res.status(500).json({ success: false, message: 'نەتوانرا پەیوەندی بە بۆتی تێلیگرامەوە بکرێت. تکایە دڵنیابە لە دروستی Token و Chat ID' });
  }
});

// Smart Notification Cron / Checker:
// 3 days before, due date, 7 days overdue, and end of day report
app.post('/api/telegram/check-due', async (_req, res) => {
  if (!db.settings.telegramEnabled || !db.settings.telegramBotToken || !db.settings.telegramChatId) {
    return res.json({ success: false, message: 'بۆتی تێلیگرام چالاک نەکراوە' });
  }

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const alertsSent: string[] = [];

  for (const ct of db.contracts) {
    if (ct.status === 'completed') continue;

    for (const inst of ct.schedule) {
      if (inst.status === 'paid') continue;

      const dueDate = new Date(inst.dueDate);
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // 3 days before alert
      if (diffDays === 3 && db.settings.notify3DaysBefore) {
        const msg = `🔔 <b>ئاگاداری قیست (٣ ڕۆژ ماوە)</b>
━━━━━━━━━━━━━━━━━━━━
👤 کڕیار: <b>${ct.customerName}</b>
📞 پەیوەندی: <code>${ct.customerPhone}</code>
📱 مۆبایل: <b>${ct.device.model}</b>
🗓 قیستی ژمارە: <b>#${inst.installmentNumber}</b>
💵 بڕ: <b>${inst.amount.toLocaleString()} دینار</b>
📅 بەرواری دان: <b>${inst.dueDate}</b>
━━━━━━━━━━━━━━━━━━━━
سیستەمی قیست`;
        await sendTelegramMessage(msg);
        alertsSent.push(`3-day alert for ${ct.customerName}`);
      }

      // On Due Day alert
      if (diffDays === 0 && db.settings.notifyOnDueDay) {
        const msg = `⚠️ <b>ئەمڕۆ کاتی دانەوەی قیستە!</b>
━━━━━━━━━━━━━━━━━━━━
👤 کڕیار: <b>${ct.customerName}</b>
📞 پەیوەندی: <code>${ct.customerPhone}</code>
📱 مۆبایل: <b>${ct.device.model}</b>
🗓 قیستی ژمارە: <b>#${inst.installmentNumber}</b>
💵 بڕ: <b>${inst.amount.toLocaleString()} دینار</b>
━━━━━━━━━━━━━━━━━━━━
سیستەمی قیست`;
        await sendTelegramMessage(msg);
        alertsSent.push(`Due day alert for ${ct.customerName}`);
      }

      // 7 days overdue alert
      if (diffDays === -7 && db.settings.notify7DaysOverdue) {
        const msg = `🚨 <b>ئاگاداری زۆر گرنگ: ٧ ڕۆژ دواکەوتنی قیست!</b>
━━━━━━━━━━━━━━━━━━━━
👤 کڕیار: <b>${ct.customerName}</b>
📞 پەیوەندی: <code>${ct.customerPhone}</code>
📱 مۆبایل: <b>${ct.device.model}</b>
🗓 قیستی ژمارە: <b>#${inst.installmentNumber}</b>
💵 بڕی قیست: <b>${inst.amount.toLocaleString()} دینار</b>
⚠️ پێویستە دەستبەجێ پەیوەندی بە کڕیار یان کەفیلەوە بکرێت یان ڕێکاری یاسایی بگیرێتە بەر.
━━━━━━━━━━━━━━━━━━━━
سیستەمی قیست`;
        await sendTelegramMessage(msg);
        alertsSent.push(`7-day overdue alert for ${ct.customerName}`);
      }
    }
  }

  res.json({ success: true, alertsSentCount: alertsSent.length, alertsSent });
});

// Daily End of Day summary report to Telegram
app.post('/api/telegram/daily-report', async (_req, res) => {
  if (!db.settings.telegramEnabled) {
    return res.json({ success: false, message: 'بۆتی تێلیگرام چالاک نەکراوە' });
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const todayPayments = db.payments.filter((p) => p.date === todayStr);
  const totalTodayIncome = todayPayments.reduce((sum, p) => sum + p.amount, 0);

  const todayExpenses = db.expenses.filter((e) => e.date === todayStr);
  const totalTodayExpense = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Overall calculations
  let totalReceivables = 0;
  let totalExpectedProfit = 0;
  let totalPhoneCost = 0;

  db.contracts.forEach((ct) => {
    totalExpectedProfit += ct.pricing.totalProfit;
    totalPhoneCost += ct.pricing.purchaseCost || 0;
    const unpaid = ct.schedule
      .filter((i) => i.status !== 'paid')
      .reduce((sum, i) => sum + i.amount, 0);
    totalReceivables += unpaid;
  });

  const totalAllPayments = db.payments.reduce((sum, p) => sum + p.amount, 0);
  const totalAllExpenses = db.expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalDownPayments = db.contracts.reduce((sum, ct) => sum + ct.pricing.downPayment, 0);
  const cashBox = totalDownPayments + totalAllPayments - totalPhoneCost - totalAllExpenses;

  const reportText = `📊 <b>ڕاپۆرتی کۆتایی ڕۆژ (${todayStr})</b>
━━━━━━━━━━━━━━━━━━━━
📥 هاتوو بە قیست ئەمڕۆ: <b>${totalTodayIncome.toLocaleString()} دینار</b> (${todayPayments.length} وەسڵ)
━━━━━━━━━━━━━━━━━━━━
<b>پوختەی گشتی سیستەم:</b>
👥 کۆی کڕیاران: <b>${db.customers.length} کڕیار</b>
📑 گرێبەستە چالاکەکان: <b>${db.contracts.filter((c) => c.status === 'active').length} گرێبەست</b>
💰 قەرزی ماوە لای کڕیارەکان: <b>${totalReceivables.toLocaleString()} دینار</b>
💵 پارەی سندووق (کاشی کۆکراوە): <b>${cashBox.toLocaleString()} دینار</b>
📈 قازانجی پلاندانراوی کۆی گرێبەستەکان: <b>${totalExpectedProfit.toLocaleString()} دینار</b>
━━━━━━━━━━━━━━━━━━━━
${db.settings.shopName || 'سیستەمی بەڕێوەبردنی قیست'}`;

  const ok = await sendTelegramMessage(reportText);
  res.json({ success: ok, message: ok ? 'ڕاپۆرت نێردرا' : 'هەڵە لە ناردنی ڕاپۆرت' });
});

// Backup Export Endpoint
app.get('/api/backup', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="sarvan_mobile_qist_backup_${new Date().toISOString().split('T')[0]}.json"`);
  res.send(JSON.stringify(db, null, 2));
});

// Download Windows Desktop Launcher Script
app.get('/api/download-launcher', (_req, res) => {
  const filePath = path.join(baseAppDir, 'Start-QISTYAR.bat');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/x-bat');
    res.setHeader('Content-Disposition', 'attachment; filename="Start-QISTYAR.bat"');
    res.sendFile(filePath);
  } else {
    res.status(404).send('فایلی هەڵکردن نەدۆزرایەوە');
  }
});

// Download Windows Silent Launcher Script
app.get('/api/download-silent-launcher', (_req, res) => {
  const filePath = path.join(baseAppDir, 'Start-QISTYAR-Silent.vbs');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'text/vbscript');
    res.setHeader('Content-Disposition', 'attachment; filename="Start-QISTYAR-Silent.vbs"');
    res.sendFile(filePath);
  } else {
    res.status(404).send('فایلی هەڵکردنی بێدەنگ نەدۆزرایەوە');
  }
});

// Download Windows Readme Guide
app.get('/api/download-readme', (_req, res) => {
  const filePath = path.join(baseAppDir, 'README-Windows.txt');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="README-Windows.txt"');
    res.sendFile(filePath);
  } else {
    res.status(404).send('فایلی ڕێنمایی نەدۆزرایەوە');
  }
});

// Restore Endpoint
app.post('/api/restore', (req, res) => {
  try {
    const importedData = req.body;
    if (!importedData || !Array.isArray(importedData.customers) || !Array.isArray(importedData.contracts)) {
      return res.status(400).json({ success: false, message: 'فایلی باکئەپەکە شیاو نییە' });
    }
    db = {
      customers: importedData.customers || [],
      contracts: importedData.contracts || [],
      payments: importedData.payments || [],
      expenses: importedData.expenses || [],
      settings: { ...defaultSettings, ...(importedData.settings || {}) },
      users: importedData.users || [],
    };
    saveDb(db);
    res.json({ success: true, message: 'داتاکان بە سەرکەوتوویی گەڕێنرانەوە' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'هەڵە لە گەڕاندنەوەی باکئەپ' });
  }
});

// Serve frontend with Vite in dev, or static build in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production' || isDesktopExe || isSea;
  const httpServer = http.createServer(app);

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const candidates = [
      path.resolve(baseAppDir, 'dist'),
      path.resolve(process.cwd(), 'dist'),
      path.resolve(__dirname || '', 'dist'),
    ];
    const distPath = candidates.find((p) => fs.existsSync(p)) || path.resolve(baseAppDir, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    const shouldOpen = process.argv.includes('--open') || process.env.OPEN_BROWSER === 'true' || isDesktopExe;
    if (shouldOpen) {
      const url = `http://localhost:${PORT}`;
      const cmd = process.platform === 'win32'
        ? `start "" "${url}"`
        : process.platform === 'darwin'
        ? `open "${url}"`
        : `xdg-open "${url}"`;
      child_process.exec(cmd, () => {});
    }
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});

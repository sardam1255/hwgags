/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navbar, NavTab } from './components/Navbar.tsx';
import { LoginView } from './components/LoginView.tsx';
import { ManagerPanelView } from './components/ManagerPanelView.tsx';
import { FinancialDashboard } from './components/FinancialDashboard.tsx';
import { ContractsListView } from './components/ContractsListView.tsx';
import { ContractCalculatorView } from './components/ContractCalculatorView.tsx';
import { CustomerProfileView } from './components/CustomerProfileView.tsx';
import { PaymentsListView } from './components/PaymentsListView.tsx';
import { TelegramAndAlertsView } from './components/TelegramAndAlertsView.tsx';
import { SettingsAndBackupView } from './components/SettingsAndBackupView.tsx';
import { PaymentModal } from './components/PaymentModal.tsx';
import { PrintPreviewModal, PrintMode } from './components/PrintPreviewModal.tsx';
import { 
  Customer, 
  Contract, 
  PaymentRecord, 
  ShopSettings,
  AppUser,
  UserRole
} from './types/index.ts';
import { User } from 'firebase/auth';
import { 
  initDriveAuth, 
  connectGoogleDrive, 
  disconnectGoogleDrive, 
  uploadBackupToGoogleDrive, 
  downloadBackupFromGoogleDrive 
} from './services/googleDrive.ts';

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
  initialCapital: 10000000,
  telegramBotToken: '',
  telegramChatId: '',
  telegramEnabled: false,
  notify3DaysBefore: true,
  notifyOnDueDay: true,
  notify7DaysOverdue: true,
  notifyOnContractComplete: true,
  notifyEndOfDay: true,
  customLegalTerms: `١. لایەنی دووەم (کڕیار) و لایەنی سێیەم (کفیل) بە یەکەوە و بە هاوبەشی بەرپرسیارن لە دانەوەی هەموو بڕی پارەی قیستەکان لە کاتی دیاریکراوی خۆیدا.
٢. لە حاڵەتی دواکەوتنی هەر قیستێک بۆ ماوەی زیاتر لە ٧ ڕۆژ، تەواوی پارەی ماوەی قیستەکان دەبێتە قەرزێکی دەستبەجێ (حاڵ) و فرۆشیار مافی قانونی هەیە پەنا بباتە بەر دادگاکانی هەرێمی کوردستان و دەستبەسەرداگرتنی مۆڵەت و مووچەی کڕیار یان کفیل.
٣. مۆبایلەکە بە ئەمانەت لای کڕیارە تا کاتی دانەوەی تەواوی کۆتا دیناری قیستەکان، و کڕیار مافی فرۆشتن، بەخشین، یا ڕەهنکردنی مۆبایلەکەی نییە بەبێ ڕەزامەندی نووسراوی فرۆشیار.
٤. کڕیار ڕەزامەندە لەسەر ئەوەی ئەگەر لە قیستەکان دواکەوت، خاوەن دووکان مافی هەیە لە ڕێگەی سیستەمی کۆنتڕۆڵ و خزمەتگوزاری قفڵکردنی ئایکلۆد (iCloud) یان ئەکاونتی گووگڵ یا بەرنامەی تایبەتی قیست دەستبەجێ مۆبایلەکە ڕابگرێت تا کاتی یەکلاییکردنەوەی قەرزەکە.
٥. ئەم گرێبەستە بەپێی یاسای مەدەنی عێراقی و ڕێنماییە کارپێکراوەکانی هەرێمی کوردستان داڕێژراوە.`,
};

export default function App() {
  // Authentication & Current User
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('sarvan_auth_token');
  });

  const [currentUser, setCurrentUser] = useState<{
    id?: string;
    username: string;
    name: string;
    phone?: string;
    role?: UserRole;
  } | null>(() => {
    try {
      const stored = localStorage.getItem('sarvan_user');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return null;
  });

  // Active navigation tab defaults to main dashboard
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Application Data State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [settings, setSettings] = useState<ShopSettings>(defaultSettings);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Google Drive state
  const [driveUser, setDriveUser] = useState<User | null>(null);
  const [driveSyncing, setDriveSyncing] = useState(false);
  const [lastDriveSync, setLastDriveSync] = useState<string | null>(null);

  // Modals
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentContractTarget, setPaymentContractTarget] = useState<Contract | null>(null);

  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printMode, setPrintMode] = useState<PrintMode>('legal');
  const [printContractTarget, setPrintContractTarget] = useState<Contract | null>(null);
  const [printPaymentTarget, setPrintPaymentTarget] = useState<PaymentRecord | null>(null);

  // Calculate available capital
  const availableCapital = useMemo(() => {
    const initialCapital = settings.initialCapital || 10000000;
    const totalPhonesCostAll = contracts.reduce(
      (sum, c) => sum + (c.pricing.purchaseCost || c.pricing.cashPrice || 0),
      0
    );
    const totalDownPayments = contracts.reduce((sum, c) => sum + (c.pricing.downPayment || 0), 0);
    const totalInstallmentsCollected = payments.reduce((sum, p) => sum + p.amount, 0);
    return Math.max(0, initialCapital - totalPhonesCostAll + totalDownPayments + totalInstallmentsCollected);
  }, [settings.initialCapital, contracts, payments]);

  // Listen to Google Drive auth state
  useEffect(() => {
    const unsub = initDriveAuth((user) => {
      setDriveUser(user);
    }, () => {
      setDriveUser(null);
    });
    return () => unsub();
  }, []);

  // Fetch full data from server API
  const refreshData = useCallback(async () => {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
        setContracts(data.contracts || []);
        setPayments(data.payments || []);
        setUsers(data.users || []);
        if (data.settings) {
          setSettings(data.settings);
        }
        return data;
      }
    } catch (err) {
      console.error('Failed to load server data:', err);
    } finally {
      setDataLoaded(true);
    }
    return null;
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
    }
  }, [isAuthenticated, refreshData]);

  // Helper to automatically sync latest database to Google Drive if connected
  const autoSyncToDrive = useCallback(async (customData?: any) => {
    if (!driveUser) return;
    setDriveSyncing(true);
    try {
      let dataToSync = customData;
      if (!dataToSync) {
        const res = await fetch('/api/data');
        if (res.ok) {
          dataToSync = await res.json();
        }
      }
      if (dataToSync) {
        const result = await uploadBackupToGoogleDrive(dataToSync);
        if (result.success) {
          setLastDriveSync(new Date().toISOString());
        }
      }
    } catch (err) {
      console.error('Auto sync to Google Drive error:', err);
    } finally {
      setDriveSyncing(false);
    }
  }, [driveUser]);

  // Google Drive connection handlers
  const handleConnectDrive = async () => {
    try {
      const { user } = await connectGoogleDrive();
      setDriveUser(user);
      setTimeout(() => {
        autoSyncToDrive();
      }, 500);
    } catch (err: any) {
      alert(err.message || 'هەڵە لە بەستنەوە بە Google Drive');
    }
  };

  const handleDisconnectDrive = async () => {
    await disconnectGoogleDrive();
    setDriveUser(null);
  };

  const handleSyncDriveNow = async () => {
    await autoSyncToDrive();
    alert('باکئەپەکە بە سەرکەوتوویی لە Google Drive خەزنکرا!');
  };

  const handleRestoreFromDrive = async () => {
    const confirmed = window.confirm(
      'ئایا دڵنیایت لە گەڕاندنەوەی داتاکان لە Google Drive؟ هەموو زانیاری و گرێبەستەکانی ئێستا بە کۆپییەکەی سەر گووگڵ درایڤ نوێ دەکرێنەوە.'
    );
    if (!confirmed) return;

    setDriveSyncing(true);
    try {
      const res = await downloadBackupFromGoogleDrive();
      if (res.success && res.data) {
        await handleRestoreBackup(res.data);
        alert('داتاکان بە سەرکەوتوویی لە Google Driveـەوە گەڕێنرانەوە!');
      } else {
        alert(res.error || 'نەتوانرا داتاکان بهێنرێتەوە');
      }
    } finally {
      setDriveSyncing(false);
    }
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('sarvan_auth_token');
    localStorage.removeItem('sarvan_user');
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  // Capital Update & Deposit
  const handleSaveCapital = async (
    amount: number, 
    action: 'deposit' | 'set' = 'set',
    note?: string
  ): Promise<boolean> => {
    try {
      const payload = action === 'deposit'
        ? { action: 'deposit', depositAmount: amount, note, addedBy: currentUser?.name || settings.sellerName || 'بەڕێوەبەر' }
        : { action: 'set', initialCapital: amount, note, addedBy: currentUser?.name || settings.sellerName || 'بەڕێوەبەر' };

      const res = await fetch('/api/capital', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const latestDb = await refreshData();
        autoSyncToDrive(latestDb);
        return true;
      }
    } catch (err) {
      console.error('Failed to update capital:', err);
    }
    return false;
  };

  // User Management Handlers
  const handleSaveUser = async (userData: Partial<AppUser>): Promise<boolean> => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      if (data.success) {
        const latestDb = await refreshData();
        autoSyncToDrive(latestDb);
        return true;
      }
    } catch (err) {
      console.error('Failed to save user:', err);
    }
    return false;
  };

  const handleDeleteUser = async (userId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        const latestDb = await refreshData();
        autoSyncToDrive(latestDb);
        return true;
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
    return false;
  };

  // Save new contract
  const handleSaveContract = async (newContract: Contract, newCust?: Customer): Promise<Contract> => {
    if (newCust) {
      await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCust),
      });
    }

    const res = await fetch('/api/contracts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newContract),
    });
    const data = await res.json();
    const latestDb = await refreshData();
    autoSyncToDrive(latestDb);
    return data.contract;
  };

  // Delete contract
  const handleDeleteContract = async (id: string) => {
    await fetch(`/api/contracts/${id}`, { method: 'DELETE' });
    const latestDb = await refreshData();
    autoSyncToDrive(latestDb);
  };

  // Record payment
  const handleRecordPayment = async (paymentData: any): Promise<PaymentRecord> => {
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData),
    });
    const data = await res.json();
    const latestDb = await refreshData();
    autoSyncToDrive(latestDb);
    return data.paymentRecord;
  };

  // Save Customer
  const handleSaveCustomer = async (customer: Customer) => {
    await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customer),
    });
    const latestDb = await refreshData();
    autoSyncToDrive(latestDb);
  };

  // Delete Customer
  const handleDeleteCustomer = async (id: string) => {
    await fetch(`/api/customers/${id}`, { method: 'DELETE' });
    const latestDb = await refreshData();
    autoSyncToDrive(latestDb);
  };

  // Save Settings
  const handleSaveSettings = async (newSettings: ShopSettings) => {
    setSettings(newSettings);
    if (currentUser && currentUser.role === 'manager' && newSettings.sellerName) {
      const updatedUser = { ...currentUser, name: newSettings.sellerName };
      setCurrentUser(updatedUser);
      localStorage.setItem('sarvan_user', JSON.stringify(updatedUser));
    }
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings),
    });
    const latestDb = await refreshData();
    autoSyncToDrive(latestDb);
  };

  // Restore Backup
  const handleRestoreBackup = async (data: any) => {
    await fetch('/api/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    await refreshData();
  };

  // Open Print Modal for Contract (Legal Form)
  const openPrintLegal = (contract: Contract) => {
    setPrintContractTarget(contract);
    setPrintPaymentTarget(null);
    setPrintMode('legal');
    setPrintModalOpen(true);
  };

  // Open Print Modal for Bank Authorization Form
  const openPrintBank = (contract: Contract) => {
    setPrintContractTarget(contract);
    setPrintPaymentTarget(null);
    setPrintMode('bank');
    setPrintModalOpen(true);
  };

  // Open Print Modal for Receipt
  const openPrintReceipt = (payment: PaymentRecord, contract?: Contract) => {
    setPrintPaymentTarget(payment);
    setPrintContractTarget(contract || contracts.find((c) => c.id === payment.contractId) || null);
    setPrintMode('receipt');
    setPrintModalOpen(true);
  };

  // If user is not authenticated, show secure Kurdish login screen
  if (!isAuthenticated) {
    return (
      <LoginView
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthenticated(true);
          const role = user.role || 'manager';
          if (role === 'deputy') setActiveTab('calculator');
          else if (role === 'collector') setActiveTab('payments');
          else setActiveTab('dashboard');
        }}
      />
    );
  }

  const printTargetCustomer = printContractTarget
    ? customers.find((c) => c.id === printContractTarget.customerId)
    : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased selection:bg-blue-600 selection:text-white">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        settings={settings}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 no-print">
        
        {/* Manager & Capital Management Panel */}
        {activeTab === 'manager' && (
          <ManagerPanelView
            settings={settings}
            contracts={contracts}
            payments={payments}
            users={users}
            onSaveCapital={handleSaveCapital}
            onSaveSettings={handleSaveSettings}
            onSaveUser={handleSaveUser}
            onDeleteUser={handleDeleteUser}
          />
        )}

        {activeTab === 'dashboard' && (
          <FinancialDashboard
            contracts={contracts}
            payments={payments}
            customers={customers}
            onNewContract={() => setActiveTab('calculator')}
            onViewContract={(ct) => {
              setPrintContractTarget(ct);
              setPrintMode('legal');
              setPrintModalOpen(true);
            }}
            onNewPayment={(ct) => {
              setPaymentContractTarget(ct || null);
              setPaymentModalOpen(true);
            }}
          />
        )}

        {activeTab === 'contracts' && (
          <ContractsListView
            contracts={contracts}
            onPrintLegal={openPrintLegal}
            onPrintBank={openPrintBank}
            onNewPayment={(ct) => {
              setPaymentContractTarget(ct);
              setPaymentModalOpen(true);
            }}
            onDeleteContract={handleDeleteContract}
            onNewContractClick={() => setActiveTab('calculator')}
          />
        )}

        {activeTab === 'calculator' && (
          <ContractCalculatorView
            customers={customers}
            settings={settings}
            currentUser={currentUser}
            availableCapital={availableCapital}
            onSaveContract={handleSaveContract}
            onOpenContractPrint={(ct, mode) => {
              if (mode === 'legal') openPrintLegal(ct);
              else openPrintBank(ct);
            }}
          />
        )}

        {activeTab === 'customers' && (
          <CustomerProfileView
            customers={customers}
            contracts={contracts}
            payments={payments}
            onSaveCustomer={handleSaveCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onNewContractForCustomer={(_c) => {
              setActiveTab('calculator');
            }}
            onViewContract={openPrintLegal}
          />
        )}

        {activeTab === 'payments' && (
          <PaymentsListView
            payments={payments}
            contracts={contracts}
            onOpenNewPayment={() => {
              setPaymentContractTarget(null);
              setPaymentModalOpen(true);
            }}
            onPrintReceipt={openPrintReceipt}
          />
        )}

        {activeTab === 'telegram' && (
          <TelegramAndAlertsView
            settings={settings}
            contracts={contracts}
            onSaveSettings={handleSaveSettings}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsAndBackupView
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onRestoreBackup={handleRestoreBackup}
            driveUser={driveUser}
            onConnectDrive={handleConnectDrive}
            onDisconnectDrive={handleDisconnectDrive}
            onSyncDriveNow={handleSyncDriveNow}
            onRestoreFromDrive={handleRestoreFromDrive}
            driveSyncing={driveSyncing}
            lastDriveSync={lastDriveSync}
          />
        )}
      </main>

      {/* Collect Payment Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        contracts={contracts}
        defaultContract={paymentContractTarget}
        currentUser={currentUser}
        onRecordPayment={handleRecordPayment}
        onPrintReceipt={(rec, ct) => {
          setPaymentModalOpen(false);
          openPrintReceipt(rec, ct);
        }}
      />

      {/* Print Preview & A4 Single-Page Print Modal */}
      <PrintPreviewModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        mode={printMode}
        contract={printContractTarget}
        customer={printTargetCustomer}
        payment={printPaymentTarget}
        settings={settings}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>{settings.shopName} · بەڕێوەبردنی سەرمایە، حسابات و قیستی مۆبایل</span>
          <span>بەپێی یاساکانی هەرێمی کوردستان · هاوکات لەگەڵ Google Drive</span>
        </div>
      </footer>

    </div>
  );
}

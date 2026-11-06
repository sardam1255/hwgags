export type UserRole = 'manager' | 'deputy' | 'collector' | 'accountant';

export interface AppUser {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface CapitalTransaction {
  id: string;
  amount: number;
  type: 'deposit' | 'withdraw';
  date: string;
  note?: string;
  balanceAfter: number;
  addedBy?: string;
}

export interface ShopSettings {
  shopName: string;
  sellerName: string;
  phone: string;
  address: string;
  bankName: string;
  accountNumber: string;
  iban: string;
  defaultProfitRate: number; // 2.5%
  enableOwnerFee: boolean; // 50,000 IQD toggle
  ownerFeeAmount: number; // 50000
  initialCapital: number; // سەرمایەی کار (بۆ نموونە: 10,000,000 دینار)
  usdExchangeRate?: number; // نرخی 100 دۆلار (وەک 150,000 دینار)
  capitalHistory?: CapitalTransaction[];
  telegramBotToken: string;
  telegramChatId: string;
  telegramEnabled: boolean;
  notify3DaysBefore: boolean;
  notifyOnDueDay: boolean;
  notify7DaysOverdue: boolean;
  notifyOnContractComplete: boolean;
  notifyEndOfDay: boolean;
  customLegalTerms: string;
}

export interface Customer {
  id: string;
  fullName: string;
  idNumber: string;
  phone: string;
  workplace: string;
  salaryBank: string;
  bankAccountNumber: string;
  guarantorName: string;
  guarantorId: string;
  guarantorPhone: string;
  guarantorWorkplace: string;
  idCardPhotoFront?: string;
  idCardPhotoBack?: string;
  personalPhoto?: string;
  notes?: string;
  createdAt: string;
}

export interface InstallmentItem {
  installmentNumber: number;
  dueDate: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  paidDate?: string;
  paidAmount?: number;
  receiptNumber?: string;
  notes?: string;
}

export interface DeviceInfo {
  model: string;
  color: string;
  storage: string;
  imei1: string;
  imei2?: string;
  os: 'ios' | 'android';
}

export interface ContractPricing {
  cashPrice: number; // نرخی کاڵا بە نەقد
  purchaseCost: number; // تێچووی کڕینی مۆبایل بۆ دووکاندار
  ownerFee: number; // بڕی 50,000 یان 0
  downPayment: number; // پێشەکی
  months: number; // ژمارەی مانگەکان
  monthlyProfitRate: number; // ڕێژەی قازانج بۆ هەر مانگێک (2.5%)
  totalProfit: number; // کۆی قازانج
  totalInstallmentPrice: number; // کۆی نرخی فرۆشتن بە قیست
  remainingBalance: number; // بڕی ماوە تەنها قیست بەبێ پێشەکی
  monthlyInstallmentAmount: number; // بڕی قیستی مانگانە
  expectedNetProfit: number; // قازانجی سافی پلاندانراو
}

export interface Contract {
  id: string;
  contractNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  device: DeviceInfo;
  pricing: ContractPricing;
  schedule: InstallmentItem[];
  dueDayType: 'salary_day' | 'fixed_day';
  dueDayNumber?: number;
  firstInstallmentDate: string;
  lastInstallmentDate: string;
  securityCheckAmount: number;
  status: 'active' | 'completed' | 'overdue';
  legalTerms: string;
  notes?: string;
  createdAt: string;
  createdBy?: {
    userId: string;
    userName: string;
    role: UserRole;
  };
}

export interface PaymentRecord {
  id: string;
  receiptNumber: string;
  contractId: string;
  customerId: string;
  customerName: string;
  amount: number;
  date: string;
  installmentNumbers: number[];
  paymentMethod: 'cash' | 'bank_transfer' | 'fastpay' | 'fib';
  remainingBalanceAfter: number;
  isEarlyPayoff?: boolean;
  notes?: string;
  collectedBy?: {
    userId: string;
    userName: string;
    role?: UserRole;
  };
}

export interface DashboardSummary {
  totalReceivables: number; // قەرزی تۆ لای کڕیارەکان (پارەی ماوە)
  expectedProfit: number; // قازانجی پلاندانراو
  realizedProfit: number; // قازانجی بەدەستهاتوو
  totalPurchaseCost: number; // تێچووی کڕینی مۆبایلەکان
  cashBox: number; // پارەی سندوق
  activeContractsCount: number;
  completedContractsCount: number;
  overdueInstallmentsCount: number;
  totalCustomersCount: number;
}

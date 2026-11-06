import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Calculator, 
  Users, 
  Receipt, 
  Send, 
  Settings, 
  LogOut,
  Smartphone,
  Menu,
  X,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { ShopSettings, UserRole } from '../types/index.ts';

export type NavTab = 
  | 'dashboard'
  | 'manager'
  | 'contracts'
  | 'calculator'
  | 'customers'
  | 'payments'
  | 'telegram'
  | 'settings';

interface Props {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  settings: ShopSettings;
  currentUser?: { id?: string; username: string; name: string; role?: UserRole } | null;
  onLogout: () => void;
}

export const Navbar: React.FC<Props> = ({ 
  activeTab, 
  setActiveTab, 
  settings, 
  currentUser,
  onLogout 
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const userRole = currentUser?.role || 'manager';

  const allNavItems: { id: NavTab; label: string; icon: React.ReactNode; roles: UserRole[] }[] = [
    { 
      id: 'dashboard', 
      label: 'داشبۆردی سەرەکی', 
      icon: <LayoutDashboard className="w-4 h-4 text-blue-600" />,
      roles: ['manager', 'accountant', 'deputy', 'collector']
    },
    { 
      id: 'manager', 
      label: 'بەڕێوەبەر و سەرمایە', 
      icon: <ShieldCheck className="w-4 h-4 text-purple-600" />,
      roles: ['manager']
    },
    { 
      id: 'calculator', 
      label: 'گرێبەستی نوێ و حیسابات', 
      icon: <Calculator className="w-4 h-4" />,
      roles: ['manager', 'deputy']
    },
    { 
      id: 'contracts', 
      label: 'گرێبەستەکان', 
      icon: <FileText className="w-4 h-4" />,
      roles: ['manager', 'deputy', 'collector', 'accountant']
    },
    { 
      id: 'customers', 
      label: 'پڕۆفایلی کڕیاران', 
      icon: <Users className="w-4 h-4" />,
      roles: ['manager', 'deputy', 'accountant']
    },
    { 
      id: 'payments', 
      label: 'وەسڵ و قیستەکان', 
      icon: <Receipt className="w-4 h-4" />,
      roles: ['manager', 'collector', 'accountant']
    },
    { 
      id: 'telegram', 
      label: 'ئاگاداری و تێلیگرام', 
      icon: <Send className="w-4 h-4" />,
      roles: ['manager']
    },
    { 
      id: 'settings', 
      label: 'ڕێکخستن و باکئەپ', 
      icon: <Settings className="w-4 h-4" />,
      roles: ['manager']
    },
  ];

  // Filter tabs according to current user's role
  const visibleNavItems = allNavItems.filter((item) => item.roles.includes(userRole));

  const roleLabelMap: Record<UserRole, { label: string; badgeClass: string }> = {
    manager: { label: 'بەڕێوەبەری گشتی', badgeClass: 'bg-purple-100 text-purple-800 border-purple-200' },
    deputy: { label: 'جێگری بەڕێوەبەر', badgeClass: 'bg-blue-100 text-blue-800 border-blue-200' },
    collector: { label: 'وەرگری قیست', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    accountant: { label: 'ژمێریار', badgeClass: 'bg-amber-100 text-amber-800 border-amber-200' },
  };

  const currentRoleInfo = roleLabelMap[userRole] || roleLabelMap.manager;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 leading-tight">
                {settings.shopName || 'سیستەمی قیستی مۆبایل'}
              </div>
              <div className="text-[11px] text-slate-500">
                {currentUser?.name || settings.sellerName || 'بەڕێوەبەری سیستم'}
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-1">
            {visibleNavItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Profile Badge & Logout Action */}
          <div className="flex items-center gap-2.5 shrink-0">
            {currentUser && (
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">
                  {currentUser.name ? currentUser.name.slice(0, 1) : 'U'}
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-800 leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {currentRoleInfo.label}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={onLogout}
              title="دەرچوون لە هەژمار"
              className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-lg transition-colors border border-rose-200/60"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">دەرچوون</span>
            </button>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 py-3 grid grid-cols-2 gap-1.5">
            {visibleNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-medium text-right transition-colors ${
                  activeTab === item.id
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {item.icon}
                <span className="truncate">{item.label}</span>
              </button>
            ))}
            <button
              onClick={onLogout}
              className="col-span-2 flex items-center justify-center gap-2 p-2.5 mt-2 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50"
            >
              <LogOut className="w-4 h-4" />
              <span>دەرچوون لە هەژمار</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

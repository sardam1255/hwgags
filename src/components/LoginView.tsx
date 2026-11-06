import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, ShieldCheck, Smartphone } from 'lucide-react';

import { UserRole } from '../types/index.ts';

interface Props {
  onLoginSuccess: (user: { id?: string; username: string; name: string; role?: UserRole }) => void;
}

export const LoginView: React.FC<Props> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('تکایە ناوی بەکارهێنەر و وشەی نهێنی بنووسە');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: username.trim(), 
          password: password.trim() 
        }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('sarvan_auth_token', data.token);
        localStorage.setItem('sarvan_user', JSON.stringify(data.user));
        onLoginSuccess(data.user);
      } else {
        setError(data.message || 'ناوی بەکارهێنەر یان وشەی نهێنی هەڵەیە');
      }
    } catch {
      setError('نەتوانرا پەیوەندی بە سێرڤەرەوە بکرێت');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-blue-600 selection:text-white">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-7 shadow-2xl text-slate-100">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-blue-600/10 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-3.5 border border-blue-500/20">
            <Smartphone className="w-7 h-7 text-blue-500" />
          </div>
          <h1 className="text-lg font-bold text-white tracking-wide">
            سیستەمی بەڕێوەبردنی قیست
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            چوونەژوورەوەی پارێزراوی تایبەت بە خاوەن کار
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-red-950/60 border border-red-800/80 text-red-200 text-xs rounded-xl text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Username Field */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              ناوی بەکارهێنەر (Username)
            </label>
            <div className="relative">
              <input
                type="text"
                required
                autoFocus
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ناوی بەکارهێنەر بنووسە"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pl-10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                dir="ltr"
              />
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              وشەی نهێنی (Password)
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pl-10 pr-10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono tracking-widest"
                dir="ltr"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                title={showPassword ? 'شاردنەوەی وشە' : 'پیشاندانی وشە'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/30 text-xs flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            {loading ? 'پشکنینی هەژمار...' : 'چوونەژوورەوەی پارێزراو'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-800/80 text-center text-[11px] text-slate-500">
          <span>داتاکان لە هەموو ئامێرەکانتدا بە پارێزراوی هاوکات کراون</span>
        </div>
      </div>
    </div>
  );
};

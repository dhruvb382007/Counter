'use client';

import { useState, FormEvent } from 'react';
import { Eye, EyeOff, User, Mail, Lock, LogIn, UserPlus, X } from 'lucide-react';

type Tab = 'login' | 'register';

interface Props {
  onSuccess: (user: { id: string; name: string; email: string }) => void;
}

export default function AuthModal({ onSuccess }: Props) {
  const [tab, setTab]         = useState<Tab>('login');
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPass]   = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const reset = () => { setName(''); setEmail(''); setPass(''); setError(''); };
  const switchTab = (t: Tab) => { setTab(t); reset(); };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body: Record<string, string> = { email, password };
      if (tab === 'register') body.name = name;

      const res = await fetch(endpoint, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      const json = await res.json();

      if (!json.success) { setError(json.error || 'Something went wrong.'); return; }
      onSuccess(json.user);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Full-screen overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(10px)' }}
    >
      <div
        className="w-full max-w-sm rounded-3xl overflow-hidden animate-slide-up"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="px-6 pt-7 pb-4">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">🔢</span>
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Counter App</h1>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>Sign in to track your counter</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <div
            className="flex rounded-2xl p-1 mb-5"
            style={{ background: 'var(--bg2)' }}
          >
            {(['login', 'register'] as Tab[]).map(t => (
              <button
                key={t}
                id={`tab-${t}`}
                onClick={() => switchTab(t)}
                className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: tab === t ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'transparent',
                  color:      tab === t ? '#fff' : 'var(--muted)',
                }}
              >
                {t === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="px-6 pb-7 flex flex-col gap-4">

          {/* Error */}
          {error && (
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
              style={{ background: 'rgba(239,68,68,.12)', color: '#f87171', border: '1px solid rgba(239,68,68,.25)' }}
            >
              <X size={14} className="shrink-0" />
              {error}
            </div>
          )}

          {/* Name (register only) */}
          {tab === 'register' && (
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
                <input
                  id="input-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: 'var(--bg2)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>Email</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
              <input
                id="input-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none"
                style={{
                  background: 'var(--bg2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
              <input
                id="input-password"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPass(e.target.value)}
                placeholder={tab === 'register' ? 'Min 6 characters' : '••••••••'}
                required
                className="w-full pl-9 pr-10 py-3 rounded-xl text-sm outline-none"
                style={{
                  background: 'var(--bg2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--muted)' }}
                aria-label="Toggle password visibility"
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            id="btn-auth-submit"
            type="submit"
            disabled={loading}
            className="btn w-full py-3.5 rounded-xl text-sm font-semibold text-white gap-2"
            style={{
              background: loading
                ? 'var(--bg2)'
                : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,.4)',
              color: loading ? 'var(--muted)' : '#fff',
            }}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto" />
            ) : tab === 'login' ? (
              <><LogIn size={16} /> Sign In</>
            ) : (
              <><UserPlus size={16} /> Create Account</>
            )}
          </button>

          {/* Switch tab hint */}
          <p className="text-center text-xs" style={{ color: 'var(--muted)' }}>
            {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => switchTab(tab === 'login' ? 'register' : 'login')}
              className="font-semibold"
              style={{ color: 'var(--primary)' }}
            >
              {tab === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Mail, Lock, User as UserIcon } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function AuthModal({ onSuccess }: { onSuccess: (user: any) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(isLogin ? { email, password } : { name, email, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed');
      }
      onSuccess(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="glass w-full max-w-sm overflow-hidden animate-slide-up shadow-2xl relative">
        <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
          <button
            className={`flex-1 py-4 text-sm font-semibold transition-colors ${isLogin ? 'text-indigo-500' : ''}`}
            style={{ color: !isLogin ? 'var(--muted)' : undefined, borderBottom: isLogin ? '2px solid #6366f1' : '2px solid transparent' }}
            onClick={() => { setIsLogin(true); setError(''); }}
          >
            Login
          </button>
          <button
            className={`flex-1 py-4 text-sm font-semibold transition-colors ${!isLogin ? 'text-indigo-500' : ''}`}
            style={{ color: isLogin ? 'var(--muted)' : undefined, borderBottom: !isLogin ? '2px solid #6366f1' : '2px solid transparent' }}
            onClick={() => { setIsLogin(false); setError(''); }}
          >
            Sign Up
          </button>
        </div>

        <div className="p-6">
          <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text)' }}>
            {isLogin ? 'Welcome back' : 'Create an account'}
          </h2>
          <p className="text-xs mb-6" style={{ color: 'var(--muted)' }}>
            {isLogin ? 'Login to access your saved counter.' : 'Sign up to start tracking your numbers.'}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {!isLogin && (
              <div className="relative">
                <UserIcon size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text" required placeholder="Name" value={name} onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            )}
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="email" required placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="password" required placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {error && <p className="text-xs text-red-400 font-medium text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              id="btn-auth-submit"
              className="mt-2 w-full py-3 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors flex justify-center items-center h-[44px]"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

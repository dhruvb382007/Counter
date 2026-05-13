'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Moon, Sun, TrendingUp, TrendingDown, RotateCcw,
  Send, Download, BarChart2, LogOut, User as UserIcon,
} from 'lucide-react';
import StatsChart from '@/components/StatsChart';
import AuthModal  from '@/components/AuthModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ── Types ─────────────────────────────────────────────────────────────────────
interface AuthUser  { id: string; name: string; email: string }
interface CounterData { value: number; updated_at: string }
interface DailyStat {
  day: string; max_value: number; min_value: number;
  increments: number; decrements: number; total_actions: number;
}
interface WeeklyStat {
  week_start: string; week_end: string; max_value: number; min_value: number;
  total_increments: number; total_decrements: number; total_actions: number;
}

function fmt(n: number) { return new Intl.NumberFormat().format(n); }

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Home() {
  // Auth
  const [authUser, setAuthUser]   = useState<AuthUser | null>(null);
  const [authLoading, setAuthLd]  = useState(true);

  // Theme
  const [dark, setDark]           = useState(false);

  // Counter
  const [counter, setCounter]     = useState<CounterData | null>(null);
  const [daily, setDaily]         = useState<DailyStat[]>([]);
  const [weekly, setWeekly]       = useState<WeeklyStat | null>(null);
  const [dataLoading, setDataLd]  = useState(false);
  const [actionLoading, setAction]= useState<string | null>(null);

  // UI state
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null);
  const [showChart, setShowChart] = useState(false);
  const [pop, setPop]             = useState(false);
  const digitRef                  = useRef<HTMLSpanElement>(null);

  // ── Dark mode ────────────────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const isDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  // ── Toast ────────────────────────────────────────────────────────────────
  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Session check on mount ────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_URL}/api/auth/me`, { credentials: 'include' })
      .then(r => r.json())
      .then(j => { if (j.success) setAuthUser(j.user); })
      .catch(() => {})
      .finally(() => setAuthLd(false));
  }, []);

  // ── Fetch counter + stats ─────────────
  const fetchData = useCallback(async () => {
    setDataLd(true);
    try {
      const [cr, sr] = await Promise.all([
        fetch(`${API_URL}/api/counter`, { credentials: 'include' }).then(r => r.json()),
        fetch(`${API_URL}/api/stats`, { credentials: 'include' }).then(r => r.json()),
      ]);
      if (cr.success) setCounter(cr.data);
      if (sr.success) { setDaily(sr.data.daily); setWeekly(sr.data.weekly); }
    } catch { /* ignore */ }
    finally { setDataLd(false); }
  }, []);

  useEffect(() => { if (authUser) fetchData(); }, [authUser, fetchData]);

  // ── Pop animation ─────────────────────────────────────────────────────────
  const triggerPop = () => {
    setPop(false);
    requestAnimationFrame(() => { setPop(true); setTimeout(() => setPop(false), 300); });
  };

  // ── Counter actions ───────────────────────────────────────────────────────
  const doAction = async (action: 'increment' | 'decrement' | 'reset') => {
    setAction(action);
    try {
      const r = await fetch(`${API_URL}/api/counter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action }),
      });
      const j = await r.json();
      if (j.success) { setCounter(j.data); triggerPop(); fetchData(); }
      else showToast(j.error ?? 'Error updating counter.', false);
    } catch { showToast('Network error.', false); }
    finally { setAction(null); }
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = async () => {
    await fetch(`${API_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    setAuthUser(null);
    setCounter(null);
    setDaily([]);
    setWeekly(null);
  };

  // ── PDF export (client-side jsPDF) ───────────────────────────────────────
  const exportPDF = async () => {
    setAction('pdf');
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      doc.setFillColor(99, 102, 241);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22); doc.setFont('helvetica', 'bold');
      doc.text('Counter App Report', 105, 16, { align: 'center' });
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      if (authUser) doc.text(`User: ${authUser.name} (${authUser.email})`, 105, 25, { align: 'center' });
      doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 32, { align: 'center' });

      doc.setFillColor(245, 243, 255);
      doc.roundedRect(15, 50, 180, 30, 4, 4, 'F');
      doc.setTextColor(99, 102, 241); doc.setFontSize(32); doc.setFont('helvetica', 'bold');
      doc.text(fmt(counter?.value ?? 0), 105, 71, { align: 'center' });
      doc.setFontSize(9); doc.setTextColor(100, 116, 139); doc.setFont('helvetica', 'normal');
      doc.text('Current Counter Value', 105, 56, { align: 'center' });

      let y = 95;
      doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 50);
      doc.text('Weekly Summary', 15, y); y += 7;
      const rows = [
        ['Period', `${weekly?.week_start ?? 'N/A'} → ${weekly?.week_end ?? 'N/A'}`],
        ['Highest', String(weekly?.max_value ?? 0)],
        ['Lowest',  String(weekly?.min_value ?? 0)],
        ['Increments', String(weekly?.total_increments ?? 0)],
        ['Decrements', String(weekly?.total_decrements ?? 0)],
        ['Total Actions', String(weekly?.total_actions ?? 0)],
      ];
      rows.forEach(([k, v]) => {
        doc.setFontSize(9); doc.setFont('helvetica', 'bold');   doc.setTextColor(60, 60, 90);  doc.text(k + ':', 18, y);
        doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 110); doc.text(v, 85, y); y += 7;
      });

      if (daily.length) {
        y += 4;
        doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 50);
        doc.text('Daily Breakdown (Last 7 Days)', 15, y); y += 7;
        ['Date', '+', '−', 'Actions'].forEach((h, i) => {
          doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(99, 102, 241);
          doc.text(h, [15, 80, 110, 155][i], y);
        });
        y += 5;
        daily.forEach(d => {
          doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 80);
          doc.text(d.day, 15, y);
          doc.text(`+${d.increments}`, 80, y);
          doc.text(`-${d.decrements}`, 110, y);
          doc.text(String(d.total_actions), 155, y);
          y += 6;
        });
      }

      doc.save(`counter-report-${authUser?.name.replace(/\s/g,'-') ?? 'user'}-${new Date().toISOString().split('T')[0]}.pdf`);
      showToast('PDF exported!');
    } catch (e: any) { showToast('PDF export failed: ' + e.message, false); }
    finally { setAction(null); }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
          <p style={{ color: 'var(--muted)' }} className="text-sm">Checking session…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {!authUser && <AuthModal onSuccess={u => { setAuthUser(u); }} />}

      {toast && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white text-sm font-medium shadow-2xl animate-fade-in"
          style={{ background: toast.ok ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#ef4444,#dc2626)' }}
        >
          {toast.ok ? '✅' : '❌'} {toast.msg}
        </div>
      )}

      <header
        className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between"
        style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔢</span>
          <span className="font-bold text-base hidden sm:block" style={{ color: 'var(--text)' }}>Counter App</span>
        </div>

        <div className="flex items-center gap-2">
          {authUser && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
              style={{ background: 'var(--bg2)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
              <UserIcon size={12} /> {authUser.name}
            </div>
          )}

          <button id="btn-chart-toggle" onClick={() => setShowChart(v => !v)}
            className="btn btn-reset px-3 py-2 text-xs gap-1 flex" title="Toggle chart" aria-label="Toggle chart">
            <BarChart2 size={15} /> <span className="hidden sm:inline">Stats</span>
          </button>

          <button id="btn-theme-toggle" onClick={toggleDark}
            className="btn btn-reset p-2 rounded-xl" aria-label="Toggle dark mode">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {authUser && (
            <button id="btn-logout" onClick={logout}
              className="btn btn-reset p-2 rounded-xl" aria-label="Logout" title="Logout">
              <LogOut size={18} />
            </button>
          )}
        </div>
      </header>

      <main className="px-4 pb-10 max-w-lg mx-auto">
        <div className="mt-8 glass p-6 sm:p-8 text-center animate-slide-up">
          <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: 'var(--muted)' }}>
            {authUser ? `${authUser.name}'s Counter` : 'Your Counter'}
          </p>
          {authUser && (
            <p className="text-xs mb-5" style={{ color: 'var(--muted)' }}>{authUser.email}</p>
          )}

          <div className="flex items-center justify-center mb-8">
            <div className="glow-ring w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
              <div className="glow-ring-inner w-full h-full flex items-center justify-center">
                {dataLoading && !counter ? (
                  <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
                ) : (
                  <span
                    ref={digitRef}
                    id="counter-value"
                    className={`counter-digit font-black ${pop ? 'pop' : ''}`}
                    style={{ fontSize: 'clamp(2.5rem, 10vw, 4rem)' }}
                  >
                    {fmt(counter?.value ?? 0)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-5 mb-6">
            <button id="btn-decrement"
              className="btn btn-dec w-16 h-16 sm:w-20 sm:h-20"
              onClick={() => doAction('decrement')}
              disabled={!!actionLoading || !authUser}
              aria-label="Decrement">
              {actionLoading === 'decrement'
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <TrendingDown size={28} />}
            </button>

            <button id="btn-reset"
              className="btn btn-reset px-5 py-3 text-sm gap-2 flex"
              onClick={() => doAction('reset')}
              disabled={!!actionLoading || !authUser}
              aria-label="Reset">
              {actionLoading === 'reset'
                ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                : <RotateCcw size={15} />}
              Reset
            </button>

            <button id="btn-increment"
              className="btn btn-inc w-16 h-16 sm:w-20 sm:h-20"
              onClick={() => doAction('increment')}
              disabled={!!actionLoading || !authUser}
              aria-label="Increment">
              {actionLoading === 'increment'
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <TrendingUp size={28} />}
            </button>
          </div>

          {counter?.updated_at && (
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Last updated: {new Date(counter.updated_at).toLocaleString()}
            </p>
          )}
        </div>

        {weekly && (
          <div className="mt-5 grid grid-cols-2 gap-3 animate-slide-up">
            {[
              { label: 'Highest this week', value: weekly.max_value,        color: '#10b981' },
              { label: 'Lowest this week',  value: weekly.min_value,        color: '#f59e0b' },
              { label: 'Increments',        value: `+${weekly.total_increments}`, color: '#10b981' },
              { label: 'Decrements',        value: `-${weekly.total_decrements}`, color: '#ef4444' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>{s.label}</p>
                <p className="text-2xl sm:text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {showChart && (
          <div className="mt-5 glass p-5 animate-fade-in">
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--muted)' }}>
              📈 Last 7 Days Activity
            </h2>
            <StatsChart daily={daily} dark={dark} />
          </div>
        )}

        <div className="mt-5 flex gap-3">
          <button id="btn-export-pdf"
            onClick={exportPDF}
            disabled={!!actionLoading || !authUser}
            className="btn btn-reset flex-1 py-3 text-sm gap-2 justify-center"
            style={{ borderRadius: '14px' }}>
            {actionLoading === 'pdf'
              ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              : <Download size={15} />}
            Export PDF
          </button>
        </div>

        <p className="mt-6 text-center text-xs" style={{ color: 'var(--muted)' }}>
          💾 MongoDB Atlas backend · 🔐 JWT secured · 📧 Weekly reports
        </p>
      </main>
    </div>
  );
}

"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';

const I = {
  Users: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Pigeon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 4s-2 2-3.5 3.5L7 11l-8.2 1.8c-.5.1-.5.8 0 .9l6.2 1.4 1.4 6.2c.1.5.8.5.9 0z"/></svg>,
  Mail: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
  Skull: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a9 9 0 0 1 9 9c0 3.2-1.7 6-4.3 7.6l-.7 2.4H8l-.7-2.4A9.4 9.4 0 0 1 3 11 9 9 0 0 1 12 2z"/><line x1="9" y1="17" x2="9" y2="21"/><line x1="15" y1="17" x2="15" y2="21"/><line x1="9" y1="12" x2="9.01" y2="12"/><line x1="15" y1="12" x2="15.01" y2="12"/></svg>,
  Seed: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 22c0-6.075 4.925-11 11-11h1V9a7 7 0 0 0-7-7H5v2a5 5 0 0 1 5 5v1H9a7 7 0 0 0-7 7v2z"/></svg>,
  Flight: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 4s-2 2-3.5 3.5L7 11l-8.2 1.8c-.5.1-.5.8 0 .9l6.2 1.4 1.4 6.2c.1.5.8.5.9 0z"/></svg>,
  Logout: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Refresh: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.18-5.21"/></svg>,
  Shield: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Chart: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
  Search: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  Trash: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Ban: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
  Gift: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
  Home: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Activity: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  Zap: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Gold: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8"/><path d="M12 8v8"/><path d="M10 10h4"/><path d="M10 14h4"/></svg>,
};

type Tab = 'overview' | 'users' | 'pigeons' | 'messages' | 'activity';

const C = {
  purple: '#818cf8', blue: '#60a5fa', green: '#34d399', red: '#f87171', yellow: '#fbbf24', amber: '#fbbf24'
};

function StatCard({ title, value, Icon, color, sub }: { title: string; value: any; Icon: () => React.ReactNode; color: string; sub?: string }) {
  return (
    <div style={{ background: 'rgba(15,21,36,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 20, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: `radial-gradient(circle at 80% 20%,${color}25,transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase' as const, letterSpacing: '0.8px' }}>{title}</p>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: color + '22', border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}><Icon /></div>
      </div>
      <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.5px' }}>{typeof value === 'number' ? value.toLocaleString() : (value ?? '—')}</p>
      {sub && <p style={{ margin: '6px 0 0', fontSize: 11, color: '#475569' }}>{sub}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    flying: [C.blue, 'rgba(96,165,250,0.15)'], idle: [C.green, 'rgba(52,211,153,0.15)'],
    resting: [C.yellow, 'rgba(251,191,36,0.15)'], returning: ['#a78bfa', 'rgba(167,139,250,0.15)'],
    dead: [C.red, 'rgba(248,113,113,0.15)'], delivered: [C.green, 'rgba(52,211,153,0.15)'],
    expired_lost: [C.red, 'rgba(248,113,113,0.15)'],
  };
  const labels: Record<string, string> = { flying: 'Repül', idle: 'Pihen', resting: 'Regenerál', returning: 'Hazatér', dead: 'Elhullott', delivered: 'Kézbesítve', expired_lost: 'Elveszett' };
  const [c, bg] = map[status] ?? ['#94a3b8', 'rgba(148,163,184,0.15)'];
  return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: 6, fontSize: 10, fontWeight: 700, color: c, background: bg, whiteSpace: 'nowrap' as const }}>{labels[status] ?? status}</span>;
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.max(0, Math.min(100, value))}%`, background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, minWidth: 32, textAlign: 'right' as const }}>{value}%</span>
    </div>
  );
}

function Avatar({ name, color }: { name: string; color?: string }) {
  const c = color || C.purple;
  return (
    <div style={{ width: 32, height: 32, borderRadius: 9, background: `${c}22`, border: `1.5px solid ${c}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c, fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
      {name?.charAt(0)?.toUpperCase() ?? '?'}
    </div>
  );
}

function LogBadge({ level }: { level: string }) {
  const [c, bg] = level === 'error' ? [C.red, 'rgba(248,113,113,0.12)'] : level === 'warn' ? [C.yellow, 'rgba(251,191,36,0.12)'] : [C.blue, 'rgba(96,165,250,0.12)'];
  return <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 5, fontSize: 10, fontWeight: 700, color: c, background: bg }}>{level.toUpperCase()}</span>;
}

const btn = (v: 'primary'|'ghost'|'danger'|'success'|'warning') => {
  const bg = { primary: 'rgba(99,102,241,0.18)', ghost: 'rgba(255,255,255,0.06)', danger: 'rgba(239,68,68,0.14)', success: 'rgba(16,185,129,0.14)', warning: 'rgba(245,158,11,0.14)' }[v];
  const co = { primary: '#818cf8', ghost: '#94a3b8', danger: '#f87171', success: '#34d399', warning: '#fbbf24' }[v];
  const bo = { primary: 'rgba(99,102,241,0.3)', ghost: 'rgba(255,255,255,0.09)', danger: 'rgba(239,68,68,0.3)', success: 'rgba(16,185,129,0.3)', warning: 'rgba(245,158,11,0.3)' }[v];
  return { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px', background: bg, color: co, border: `1px solid ${bo}`, borderRadius: 7, fontWeight: 600, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' as const };
};

// Special gold button style – distinct amber/gold look
const btnGold: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px',
  background: 'rgba(245,158,11,0.18)',
  color: '#f59e0b',
  border: '1px solid rgba(245,158,11,0.45)',
  borderRadius: 7, fontWeight: 700, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap',
};

const th: React.CSSProperties = { padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.7px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' };
const td: React.CSSProperties = { padding: '11px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', verticalAlign: 'middle' };

export default function AdminDashboard() {
  const [secret, setSecret] = useState('');
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [pigeons, setPigeons] = useState<any[]>([]);
  const [msgs, setMsgs] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [spinning, setSpinning] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  const hdr = useCallback(() => ({ Authorization: `Bearer ${secret}` }), [secret]);
  const toast$ = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3200); };

  const fetchStats   = useCallback(async () => { try { const r = await fetch('/api/admin/stats',   { headers: hdr() }); if (r.ok) setStats(await r.json()); } catch {} }, [hdr]);
  const fetchUsers   = useCallback(async () => { try { const r = await fetch('/api/admin/users',   { headers: hdr() }); if (r.ok) setUsers(await r.json()); } catch {} }, [hdr]);
  const fetchPigeons = useCallback(async () => { try { const r = await fetch('/api/admin/flights', { headers: hdr() }); if (r.ok) setPigeons(await r.json()); } catch {} }, [hdr]);
  const fetchMsgs    = useCallback(async () => { try { const r = await fetch('/api/admin/messages',{ headers: hdr() }); if (r.ok) setMsgs(await r.json()); } catch {} }, [hdr]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setErr('');
    try { const r = await fetch('/api/admin/stats', { headers: hdr() }); if (!r.ok) throw 0; setStats(await r.json()); setAuthed(true); }
    catch { setErr('Helytelen kulcs. Próbáld újra.'); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!authed) return;
    if (tab === 'overview' || tab === 'activity') fetchStats();
    if (tab === 'users') fetchUsers();
    if (tab === 'pigeons') fetchPigeons();
    if (tab === 'messages') fetchMsgs();
  }, [tab, authed]);

  const refresh = async () => {
    setSpinning(true);
    if (tab === 'overview' || tab === 'activity') await fetchStats();
    if (tab === 'users') await fetchUsers();
    if (tab === 'pigeons') await fetchPigeons();
    if (tab === 'messages') await fetchMsgs();
    setTimeout(() => setSpinning(false), 500);
  };

  const giveItem = async (ep: string, uid: string, uname: string, label: string) => {
    const amt = prompt(`Mennyi ${label} adjunk ${uname} számára?`);
    if (!amt || isNaN(+amt)) return;
    const r = await fetch(ep, { method: 'POST', headers: { 'Content-Type': 'application/json', ...hdr() }, body: JSON.stringify({ userId: uid, amount: +amt }) });
    if (r.ok) { toast$(`✓ ${amt} ${label} adva: ${uname}`); fetchUsers(); } else toast$(`✗ Sikertelen`);
  };

  const banUser = async (uid: string, uname: string) => {
    if (!confirm(`Letiltod „${uname}" fiókját?`)) return;
    const r = await fetch(`/api/admin/users?id=${uid}`, { method: 'DELETE', headers: hdr() });
    if (r.ok) { toast$(`✓ ${uname} letiltva`); fetchUsers(); } else toast$('✗ Sikertelen');
  };

  const deleteUser = async (uid: string, uname: string) => {
    if (!confirm(`Biztosan törölni szeretnéd „${uname}" fiókját?`)) return;
    const perm = confirm('OK = Végleges törlés | Mégse = Soft delete');
    const r = await fetch(`/api/admin/users?id=${uid}&permanent=${perm}`, { method: 'DELETE', headers: hdr() });
    if (r.ok) { toast$(`✓ ${uname} törölve`); fetchUsers(); } else toast$('✗ Sikertelen');
  };

  const recallPigeon = async (pid: string, name: string) => {
    if (!confirm(`Hazahívod „${name}" galambot azonnal?`)) return;
    const r = await fetch('/api/admin/pigeons/recall', { method: 'POST', headers: { 'Content-Type': 'application/json', ...hdr() }, body: JSON.stringify({ pigeonId: pid }) });
    const d = await r.json();
    if (r.ok) { toast$(`✓ ${d.message || name + ' hazatért!'}`); fetchPigeons(); fetchStats(); } else toast$(`✗ ${d.error || 'Sikertelen'}`);
  };

  const deliverMsg = async (mid: string) => {
    if (!confirm('Azonnal kézbesíted ezt a levelet?')) return;
    const r = await fetch('/api/admin/messages/deliver', { method: 'POST', headers: { 'Content-Type': 'application/json', ...hdr() }, body: JSON.stringify({ messageId: mid }) });
    const d = await r.json();
    if (r.ok) { toast$(`✓ ${d.message || 'Kézbesítve!'}`); fetchMsgs(); fetchStats(); } else toast$(`✗ ${d.error || 'Sikertelen'}`);
  };

  const sortedUsers = useMemo(() => {
    let rows = [...users];
    if (search) { const q = search.toLowerCase(); rows = rows.filter(u => u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)); }
    rows.sort((a, b) => {
      let av = a[sortBy], bv = b[sortBy];
      if (sortBy === 'seeds') { av = a.inventory?.seeds ?? 0; bv = b.inventory?.seeds ?? 0; }
      if (sortBy === 'gold')  { av = a.gold ?? 0; bv = b.gold ?? 0; }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return rows;
  }, [users, search, sortBy, sortDir]);

  const filteredPigeons = useMemo(() => {
    if (!search) return pigeons;
    const q = search.toLowerCase();
    return pigeons.filter(p => p.name?.toLowerCase().includes(q) || p.ownerId?.username?.toLowerCase().includes(q));
  }, [pigeons, search]);

  const sortToggle = (col: string) => { if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortBy(col); setSortDir('desc'); } };
  const SortI = ({ col }: { col: string }) => sortBy !== col ? <span style={{ color: '#374151', marginLeft: 3 }}>⇅</span> : <span style={{ color: C.purple, marginLeft: 3 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
  const toggleRow = (id: string) => { const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); setSelected(n); };

  const navItems: { id: Tab; label: string; Icon: () => React.ReactNode; badge?: number }[] = [
    { id: 'overview',  label: 'Áttekintés',   Icon: I.Chart,    badge: undefined },
    { id: 'users',     label: 'Felhasználók', Icon: I.Users,    badge: stats?.stats?.activeUsers },
    { id: 'pigeons',   label: 'Galambok',     Icon: I.Pigeon,   badge: stats?.stats?.flyingPigeons },
    { id: 'messages',  label: 'Üzenetek',     Icon: I.Mail,     badge: msgs?.stats?.flyingMessages },
    { id: 'activity',  label: 'Aktivitás',    Icon: I.Activity, badge: undefined },
  ];

  // ── LOGIN ────────────────────────────────────────────────────────────────────
  if (!authed) return (
    <div style={{ minHeight: '100vh', background: '#080b14', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 80% 50% at 50% -20%,rgba(99,102,241,0.14),transparent)', pointerEvents: 'none' }} />
      <div style={{ width: '100%', maxWidth: 420, padding: 40, borderRadius: 20, background: 'rgba(13,17,28,0.92)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(24px)', boxShadow: '0 32px 80px rgba(0,0,0,0.5)', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 62, height: 62, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#fff', boxShadow: '0 8px 32px rgba(99,102,241,0.45)' }}><I.Shield /></div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', margin: '0 0 6px', letterSpacing: '-0.5px' }}>PigeonPost Admin</h1>
          <p style={{ color: '#475569', fontSize: 13, margin: 0 }}>Adminisztrációs irányítópult</p>
        </div>
        <form onSubmit={login}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 7, textTransform: 'uppercase' as const, letterSpacing: '0.9px' }}>Admin titkos kulcs</label>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }}><I.Shield /></div>
            <input type="password" value={secret} onChange={e => setSecret(e.target.value)} placeholder="••••••••••••••"
              style={{ width: '100%', padding: '11px 14px 11px 40px', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 11, background: 'rgba(255,255,255,0.05)', fontSize: 14, color: '#e2e8f0', outline: 'none', boxSizing: 'border-box' as const }} />
          </div>
          {err && <p style={{ color: C.red, fontSize: 13, marginBottom: 12, background: 'rgba(248,113,113,0.08)', padding: '8px 12px', borderRadius: 8, border: `1px solid rgba(248,113,113,0.22)` }}>{err}</p>}
          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: 13, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 11, fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}>
            {loading ? 'Hitelesítés...' : 'Belépés →'}
          </button>
        </form>
      </div>
    </div>
  );

  // ── DASHBOARD ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Inter', system-ui, sans-serif", background: '#080b14', color: '#e2e8f0', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 60% 40% at 0% 0%,rgba(99,102,241,0.07),transparent),radial-gradient(ellipse 60% 40% at 100% 100%,rgba(139,92,246,0.05),transparent)', pointerEvents: 'none', zIndex: 0 }} />

      {/* SIDEBAR */}
      <aside style={{ width: 238, background: 'rgba(11,15,26,0.97)', backdropFilter: 'blur(24px)', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'relative', zIndex: 1 }}>
        <div style={{ padding: '22px 18px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}><I.Pigeon /></div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.3px' }}>PigeonPost</div>
              <div style={{ fontSize: 9, color: '#374151', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' as const }}>Admin Panel</div>
            </div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' as const }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#2d3748', letterSpacing: '1.5px', textTransform: 'uppercase' as const, padding: '10px 8px 5px' }}>Navigáció</div>
          {navItems.map(({ id, label, Icon, badge }) => {
            const active = tab === id;
            return (
              <button key={id} onClick={() => { setTab(id); setSearch(''); setSelected(new Set()); }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 11px', border: 'none', borderRadius: 8, marginBottom: 2, cursor: 'pointer', fontSize: 13, fontWeight: active ? 600 : 400, textAlign: 'left' as const, background: active ? 'rgba(99,102,241,0.14)' : 'transparent', color: active ? C.purple : '#64748b', borderLeft: active ? `2px solid ${C.purple}` : '2px solid transparent', transition: 'all 0.12s' }}>
                <Icon />
                <span style={{ flex: 1 }}>{label}</span>
                {badge !== undefined && badge > 0 && <span style={{ background: active ? C.purple : '#1e293b', color: active ? '#fff' : '#94a3b8', borderRadius: 10, fontSize: 10, fontWeight: 700, padding: '1px 7px' }}>{badge}</span>}
              </button>
            );
          })}
        </nav>
        <div style={{ padding: 10, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 11px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, marginBottom: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, boxShadow: `0 0 7px ${C.green}`, display: 'inline-block' }} />
            <span style={{ fontSize: 11, color: '#475569', fontFamily: 'monospace' }}>{now.toLocaleTimeString('hu-HU')}</span>
            <span style={{ fontSize: 9, color: '#2d3748', marginLeft: 'auto', fontWeight: 700, letterSpacing: '0.8px' }}>LIVE</span>
          </div>
          <button onClick={() => setAuthed(false)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 11px', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, background: 'transparent', color: '#475569', cursor: 'pointer', fontSize: 12 }}>
            <I.Logout />Kijelentkezés
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <header style={{ height: 58, background: 'rgba(11,15,26,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>{navItems.find(n => n.id === tab)?.label}</h2>
            {(tab === 'users' || tab === 'pigeons') && (
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }}><I.Search /></div>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Keresés..."
                  style={{ padding: '7px 12px 7px 32px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, color: '#e2e8f0', fontSize: 13, outline: 'none', width: 210 }} />
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: '#374151', fontFamily: 'monospace', background: 'rgba(255,255,255,0.04)', padding: '4px 10px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.06)' }}>{stats?.serverTime ?? '—'}</span>
            <button onClick={refresh} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, cursor: 'pointer', fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
              <div style={{ transform: spinning ? 'rotate(360deg)' : 'none', transition: 'transform 0.5s' }}><I.Refresh /></div>Frissítés
            </button>
          </div>
        </header>

        {/* Toast */}
        {toast && (
          <div style={{ position: 'fixed', bottom: 26, right: 26, zIndex: 9999, padding: '12px 20px', borderRadius: 12, background: toast.startsWith('✓') ? 'rgba(16,185,129,0.14)' : 'rgba(239,68,68,0.14)', border: `1px solid ${toast.startsWith('✓') ? 'rgba(52,211,153,0.4)' : 'rgba(248,113,113,0.4)'}`, color: toast.startsWith('✓') ? C.green : C.red, fontWeight: 700, fontSize: 14, backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
            {toast}
          </div>
        )}

        {/* Content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: 22 }}>

          {/* ══ OVERVIEW ═══════════════════════════════════════════════════ */}
          {tab === 'overview' && (<>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 22 }}>
              <StatCard title="Aktív felhasználók" value={stats?.stats?.activeUsers} Icon={I.Users} color={C.purple} sub="regisztrált fiók" />
              <StatCard title="Repülő galambok" value={stats?.stats?.flyingPigeons} Icon={I.Flight} color={C.blue} sub="jelenleg a levegőben" />
              <StatCard title="Elhullott (24ó)" value={stats?.stats?.deadPigeons} Icon={I.Skull} color={C.red} sub="utolsó 24 óra" />
              <StatCard title="Maggazdaság" value={stats?.stats?.seedEconomy} Icon={I.Seed} color={C.green} sub="összes mag" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 20 }}>
              <div style={{ background: 'rgba(15,21,36,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 20 }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#94a3b8' }}>⚡ Gyors műveletek</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {([['users', 'Felhasználók kezelése', 'Magok, kalitkák, tiltás, törlés', C.purple], ['pigeons', 'Galambok kezelése', 'Repülő galambok hazahívása', C.blue], ['messages', 'Repülések kezelése', 'Kézbesítés, nyomon követés', C.green], ['activity', 'Rendszernaplók', 'Hibanaplók, figyelmeztetések', C.yellow]] as [Tab, string, string, string][]).map(([id, label, sub, color]) => (
                    <button key={id} onClick={() => setTab(id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, cursor: 'pointer', textAlign: 'left' as const }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color }}>{label}</div>
                        <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{sub}</div>
                      </div>
                      <span style={{ color: '#374151', fontSize: 18, marginLeft: 10 }}>›</span>
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ background: 'rgba(15,21,36,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 20 }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#94a3b8' }}>🏥 Rendszer állapota</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {([['Aktív felhasználók', stats?.stats?.activeUsers ?? 0, 1000, C.purple], ['Repülő galambok', stats?.stats?.flyingPigeons ?? 0, 500, C.blue], ['Elhullási ráta (24ó)', stats?.stats?.deadPigeons ?? 0, 50, C.red]] as [string, number, number, string][]).map(([label, val, max, color]) => (
                    <div key={label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 12, color: '#64748b' }}>{label}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>{val.toLocaleString()}</span>
                      </div>
                      <ProgressBar value={Math.min(100, Math.round((val / max) * 100))} color={color} />
                    </div>
                  ))}
                  <div style={{ marginTop: 6, padding: '10px 14px', background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 9 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.green, display: 'inline-block', boxShadow: `0 0 8px ${C.green}` }} />
                      <span style={{ fontSize: 12, color: C.green, fontWeight: 700 }}>Minden rendszer működik</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#1f5e42', marginTop: 3 }}>Adatbázis: OK · API: OK · Cron: OK</div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ background: 'rgba(15,21,36,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8' }}>📋 Legutóbbi naplók</span>
                <button onClick={() => setTab('activity')} style={btn('ghost')}>Összes megtekintése →</button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 }}>
                <thead><tr>{['Időbélyeg','Szint','Üzenet','Kontextus'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {(stats?.logs ?? []).slice(0, 6).map((log: any) => (
                    <tr key={log.id}>
                      <td style={{ ...td, fontFamily: 'monospace', fontSize: 11, color: '#475569' }}>{log.timestamp}</td>
                      <td style={td}><LogBadge level={log.level} /></td>
                      <td style={{ ...td, color: '#cbd5e1' }}>{log.message}</td>
                      <td style={{ ...td, fontFamily: 'monospace', fontSize: 11, color: '#475569' }}>{log.context}</td>
                    </tr>
                  ))}
                  {(!stats?.logs || stats.logs.length === 0) && <tr><td colSpan={4} style={{ ...td, textAlign: 'center', color: '#374151', padding: '30px 16px' }}>Nincs napló</td></tr>}
                </tbody>
              </table>
            </div>
          </>)}

          {/* ══ USERS ══════════════════════════════════════════════════════ */}
          {tab === 'users' && (<>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 18 }}>
              <StatCard title="Összes felhasználó" value={users.length} Icon={I.Users} color={C.purple} />
              <StatCard title="Szűrt eredmény" value={sortedUsers.length} Icon={I.Search} color={C.blue} />
              <StatCard title="Kiválasztott" value={selected.size} Icon={I.Check} color={C.green} />
            </div>
            <div style={{ background: 'rgba(15,21,36,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8' }}>👤 Felhasználók ({sortedUsers.length})</span>
                {selected.size > 0 && <span style={{ fontSize: 12, color: C.purple, fontWeight: 600 }}>{selected.size} kiválasztva</span>}
                <button onClick={() => { setSortBy('createdAt'); setSortDir('desc'); setSearch(''); setSelected(new Set()); }} style={{ ...btn('ghost'), marginLeft: 'auto' }}>Reset</button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={{ ...th, width: 36 }}><input type="checkbox" onChange={e => setSelected(e.target.checked ? new Set(sortedUsers.map((u: any) => u._id)) : new Set())} checked={selected.size === sortedUsers.length && sortedUsers.length > 0} /></th>
                      <th style={th} onClick={() => sortToggle('username')}><span style={{ cursor: 'pointer' }}>Felhasználó<SortI col="username" /></span></th>
                      <th style={th}>Email</th>
                      <th style={th} onClick={() => sortToggle('level')}><span style={{ cursor: 'pointer' }}>Szint<SortI col="level" /></span></th>
                      <th style={th} onClick={() => sortToggle('seeds')}><span style={{ cursor: 'pointer' }}>🌾 Magvak<SortI col="seeds" /></span></th>
                      <th style={th} onClick={() => sortToggle('gold')}><span style={{ cursor: 'pointer' }}>🪙 Arany<SortI col="gold" /></span></th>
                      <th style={th}>Kalitkák</th>
                      <th style={th}>Helyszín</th>
                      <th style={th} onClick={() => sortToggle('createdAt')}><span style={{ cursor: 'pointer' }}>Regisztráció<SortI col="createdAt" /></span></th>
                      <th style={th}>Műveletek</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedUsers.map((u: any) => (
                      <tr key={u._id} style={{ background: selected.has(u._id) ? 'rgba(99,102,241,0.06)' : 'transparent' }}>
                        <td style={td}><input type="checkbox" checked={selected.has(u._id)} onChange={() => toggleRow(u._id)} /></td>
                        <td style={td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            <Avatar name={u.username} color={u.pinColor} />
                            <div>
                              <div style={{ fontWeight: 700, color: '#e2e8f0' }}>{u.username}</div>
                              {u.role === 'admin' && <span style={{ fontSize: 9, fontWeight: 800, color: C.yellow, background: `${C.yellow}20`, padding: '1px 6px', borderRadius: 4 }}>ADMIN</span>}
                              {u.isDeleted && <span style={{ fontSize: 9, fontWeight: 800, color: C.red, background: `${C.red}20`, padding: '1px 6px', borderRadius: 4 }}>TILTOTT</span>}
                            </div>
                          </div>
                        </td>
                        <td style={{ ...td, color: '#64748b', fontSize: 12 }}>{u.email}</td>
                        <td style={td}><span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 5, fontSize: 10, fontWeight: 700, color: C.yellow, background: `${C.yellow}1a` }}>Lv.{u.level}</span></td>
                        <td style={{ ...td, fontWeight: 700, color: C.green }}>{(u.inventory?.seeds ?? 0).toLocaleString()}</td>
                        <td style={{ ...td, fontWeight: 700, color: C.yellow }}>{(u.gold ?? 0).toLocaleString()}</td>
                        <td style={{ ...td, color: '#94a3b8' }}>{u.inventory?.cages ?? 0}</td>
                        <td style={{ ...td, fontSize: 11, color: '#64748b' }}>{u.location?.city ?? '—'}</td>
                        <td style={{ ...td, fontSize: 11, color: '#475569', fontFamily: 'monospace' }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString('hu-HU') : '—'}</td>
                        <td style={td}>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const }}>
                            <button style={btn('success')} onClick={() => giveItem('/api/admin/users/seeds', u._id, u.username, 'mag')}><I.Seed />Mag</button>
                            <button style={btn('warning')} onClick={() => giveItem('/api/admin/users/cages', u._id, u.username, 'kalitka')}><I.Gift />Kalitka</button>
                            <button style={btnGold} onClick={() => giveItem('/api/admin/users/gold', u._id, u.username, 'arany')}><I.Gold />Arany</button>
                            <button style={btn('ghost')} onClick={() => banUser(u._id, u.username)}><I.Ban /></button>
                            <button style={btn('danger')} onClick={() => deleteUser(u._id, u.username)}><I.Trash /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {sortedUsers.length === 0 && <tr><td colSpan={10} style={{ ...td, textAlign: 'center', color: '#374151', padding: '36px 16px' }}>{search ? `Nincs találat: "${search}"` : 'Nincsenek felhasználók'}</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </>)}

          {/* ══ PIGEONS ════════════════════════════════════════════════════ */}
          {tab === 'pigeons' && (<>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 18 }}>
              <StatCard title="Összes galamb" value={pigeons.length} Icon={I.Pigeon} color={C.purple} />
              <StatCard title="Repülés alatt" value={pigeons.filter(p => p.status === 'flying').length} Icon={I.Flight} color={C.blue} />
              <StatCard title="Pihenő" value={pigeons.filter(p => p.status === 'idle').length} Icon={I.Home} color={C.green} />
              <StatCard title="Elhullott" value={pigeons.filter(p => p.status === 'dead').length} Icon={I.Skull} color={C.red} />
            </div>
            <div style={{ background: 'rgba(15,21,36,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8' }}>🕊️ Galambok ({filteredPigeons.length})</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 }}>
                  <thead><tr>{['Galamb','Azonosító','Tulajdonos','Állapot','Fáradtság','Faj','Frissítve','Művelet'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {filteredPigeons.map((p: any) => (
                      <tr key={p._id}>
                        <td style={td}><div style={{ fontWeight: 700, color: '#e2e8f0' }}>{p.name}</div>{p.level && <span style={{ fontSize: 10, color: '#64748b' }}>Szint: {p.level}</span>}</td>
                        <td style={{ ...td, fontFamily: 'monospace', fontSize: 11, color: '#475569' }}>{p.identifier ?? '—'}</td>
                        <td style={td}>
                          {p.ownerId ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Avatar name={p.ownerId.username ?? '?'} />
                              <span style={{ fontSize: 12, color: '#94a3b8' }}>{p.ownerId.username}</span>
                            </div>
                          ) : <span style={{ color: '#374151' }}>—</span>}
                        </td>
                        <td style={td}><StatusBadge status={p.status} /></td>
                        <td style={{ ...td, minWidth: 130 }}><ProgressBar value={p.fatigue ?? 0} color={p.fatigue > 70 ? C.red : p.fatigue > 40 ? C.yellow : C.green} /></td>
                        <td style={{ ...td, fontSize: 11, color: '#64748b' }}>{p.species ?? 'pigeon'}</td>
                        <td style={{ ...td, fontSize: 11, fontFamily: 'monospace', color: '#475569' }}>{p.updatedAt ? new Date(p.updatedAt).toLocaleString('hu-HU') : '—'}</td>
                        <td style={td}>
                          {p.status === 'flying' ? <button style={btn('primary')} onClick={() => recallPigeon(p._id, p.name)}><I.Home />Hazahív</button> : <span style={{ color: '#374151', fontSize: 12 }}>—</span>}
                        </td>
                      </tr>
                    ))}
                    {filteredPigeons.length === 0 && <tr><td colSpan={8} style={{ ...td, textAlign: 'center', color: '#374151', padding: '36px 16px' }}>{search ? `Nincs találat: "${search}"` : 'Nincs galamb'}</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </>)}

          {/* ══ MESSAGES ═══════════════════════════════════════════════════ */}
          {tab === 'messages' && (<>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
              <StatCard title="Összes üzenet" value={msgs?.stats?.totalMessages} Icon={I.Mail} color={C.purple} />
              <StatCard title="Repülés alatt" value={msgs?.stats?.flyingMessages} Icon={I.Flight} color={C.blue} />
              <StatCard title="Kézbesítve" value={msgs?.stats?.deliveredMessages} Icon={I.Check} color={C.green} />
              <StatCard title="Elveszett" value={msgs?.stats?.lostMessages} Icon={I.Skull} color={C.red} />
            </div>
            <div style={{ background: 'rgba(15,21,36,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8' }}>✉️ Aktív repülések ({(msgs?.activeMessages ?? []).length})</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 }}>
                  <thead><tr>{['Feladó','Címzett','Távolság','Elküldve','Várható érkezés / Haladás','Állapot','Késik','Művelet'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {(msgs?.activeMessages ?? []).map((m: any) => {
                      const sender = typeof m.senderId === 'object' ? m.senderId?.username : '?';
                      const recipient = typeof m.recipientId === 'object' ? m.recipientId?.username : '?';
                      const eta = m.estimatedArrivalAt ? new Date(m.estimatedArrivalAt) : null;
                      const isLate = eta && eta < now;
                      const dispatched = m.dispatchedAt ? new Date(m.dispatchedAt).getTime() : now.getTime();
                      const arrival = eta ? eta.getTime() : now.getTime();
                      const progress = Math.min(100, Math.max(0, Math.round(((now.getTime() - dispatched) / Math.max(1, arrival - dispatched)) * 100)));
                      return (
                        <tr key={m._id}>
                          <td style={td}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar name={sender} /><span style={{ fontWeight: 700, color: '#e2e8f0' }}>{sender}</span></div></td>
                          <td style={td}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar name={recipient} /><span style={{ color: '#94a3b8' }}>{recipient}</span></div></td>
                          <td style={{ ...td, fontWeight: 700, color: C.blue }}>{Math.round(m.distanceKm ?? 0)} km</td>
                          <td style={{ ...td, fontSize: 11, fontFamily: 'monospace', color: '#475569' }}>{m.dispatchedAt ? new Date(m.dispatchedAt).toLocaleString('hu-HU') : '—'}</td>
                          <td style={{ ...td, minWidth: 160 }}>
                            <span style={{ fontSize: 11, color: isLate ? C.red : C.green, fontWeight: isLate ? 700 : 400 }}>{eta ? eta.toLocaleTimeString('hu-HU') : '—'}</span>
                            <ProgressBar value={progress} color={isLate ? C.red : C.blue} />
                          </td>
                          <td style={td}><StatusBadge status={m.status} /></td>
                          <td style={td}>{isLate ? <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 5, fontSize: 10, fontWeight: 700, color: C.red, background: `${C.red}1a` }}>⚠ Késik</span> : <span style={{ color: '#374151' }}>—</span>}</td>
                          <td style={td}><button style={btn('success')} onClick={() => deliverMsg(m._id)}><I.Check />Kézbesít</button></td>
                        </tr>
                      );
                    })}
                    {(msgs?.activeMessages ?? []).length === 0 && <tr><td colSpan={8} style={{ ...td, textAlign: 'center', color: '#374151', padding: '36px 16px' }}>Nincs aktív repülés</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </>)}

          {/* ══ ACTIVITY ═══════════════════════════════════════════════════ */}
          {tab === 'activity' && (<>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 18 }}>
              <StatCard title="Napló bejegyzések" value={stats?.logs?.length ?? 0} Icon={I.Activity} color={C.purple} />
              <StatCard title="Hibák" value={(stats?.logs ?? []).filter((l: any) => l.level === 'error').length} Icon={I.Skull} color={C.red} />
              <StatCard title="Figyelmeztetések" value={(stats?.logs ?? []).filter((l: any) => l.level === 'warn').length} Icon={I.Zap} color={C.yellow} />
            </div>
            <div style={{ background: 'rgba(15,21,36,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8' }}>📋 Rendszernapló</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['error','warn','info'] as const).map(level => {
                    const count = (stats?.logs ?? []).filter((l: any) => l.level === level).length;
                    const [c, bg] = level === 'error' ? [C.red,'rgba(248,113,113,0.12)'] : level === 'warn' ? [C.yellow,'rgba(251,191,36,0.12)'] : [C.blue,'rgba(96,165,250,0.12)'];
                    return <span key={level} style={{ display: 'inline-flex', padding: '2px 9px', borderRadius: 5, fontSize: 10, fontWeight: 700, color: c, background: bg }}>{level.toUpperCase()}: {count}</span>;
                  })}
                </div>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
                {(stats?.logs ?? []).map((log: any, i: number) => (
                  <div key={log.id ?? i} style={{ display: 'flex', gap: 14, padding: '10px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'flex-start', background: log.level === 'error' ? 'rgba(248,113,113,0.04)' : log.level === 'warn' ? 'rgba(251,191,36,0.03)' : 'transparent' }}>
                    <span style={{ color: '#374151', whiteSpace: 'nowrap', fontSize: 11, minWidth: 140 }}>{log.timestamp}</span>
                    <LogBadge level={log.level} />
                    <span style={{ flex: 1, color: log.level === 'error' ? '#fca5a5' : log.level === 'warn' ? '#fde68a' : '#cbd5e1' }}>{log.message}</span>
                    <span style={{ color: '#374151', fontSize: 11, minWidth: 120, textAlign: 'right' as const }}>{log.context}</span>
                  </div>
                ))}
                {(!stats?.logs || stats.logs.length === 0) && <div style={{ padding: '36px 18px', textAlign: 'center', color: '#374151' }}>Nincs napló bejegyzés</div>}
              </div>
            </div>
          </>)}

        </main>
      </div>
    </div>
  );
}

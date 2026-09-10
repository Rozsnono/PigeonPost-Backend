"use client";

import React, { useState, useEffect, useCallback } from 'react';

const SvgUsers = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const SvgPigeon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 8c0 4-4 8-8 8H4l2-4"/><path d="M12 16V8"/><path d="M8 12h8"/><circle cx="18" cy="6" r="2"/></svg>;
const SvgMail = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>;
const SvgSkull = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a9 9 0 0 1 9 9c0 3.2-1.7 6-4.3 7.6l-.7 2.4H8l-.7-2.4A9.4 9.4 0 0 1 3 11 9 9 0 0 1 12 2z"/><line x1="9" y1="17" x2="9" y2="21"/><line x1="15" y1="17" x2="15" y2="21"/><line x1="9" y1="12" x2="9.01" y2="12"/><line x1="15" y1="12" x2="15.01" y2="12"/></svg>;
const SvgSeed = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 22c0-6.075 4.925-11 11-11h1V9a7 7 0 0 0-7-7H5v2a5 5 0 0 1 5 5v1H9a7 7 0 0 0-7 7v2z"/></svg>;
const SvgFlight = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 4s-2 2-3.5 3.5L7 11l-8.2 1.8c-.5.1-.5.8 0 .9l6.2 1.4 1.4 6.2c.1.5.8.5.9 0z"/></svg>;
const SvgLogout = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const SvgRefresh = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.18-5.21"/></svg>;
const SvgShield = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;

type Tab = 'overview' | 'users' | 'flights' | 'messages';

function StatCard({ title, value, Icon, color }: { title: string; value: number; Icon: () => React.ReactNode; color: string }) {
  return (
    <div style={{ background: '#fdfbf7', padding: 22, borderRadius: 16, border: '1px solid #e3d5b8', boxShadow: '0 1px 4px rgba(44,36,27,0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#8c7d6b', textTransform: 'uppercase', letterSpacing: 0.8 }}>{title}</p>
        <div style={{ color, opacity: 0.7 }}><Icon /></div>
      </div>
      <p style={{ margin: 0, fontSize: 30, fontFamily: 'Georgia, serif', fontWeight: 700, color }}>{(value ?? 0).toLocaleString()}</p>
    </div>
  );
}

function ActionBtn({ label, onClick, color }: { label: string; onClick: () => void; color: string }) {
  return (
    <button onClick={onClick} style={{ padding: '4px 10px', background: color + '18', color, border: `1px solid ${color}50`, borderRadius: 6, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
      {label}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; text: string }> = {
    flying: { label: 'Repül', bg: '#dbeafe', text: '#1e40af' },
    idle: { label: 'Pihen', bg: '#dcfce7', text: '#166534' },
    resting: { label: 'Regenerál', bg: '#fef3c7', text: '#92400e' },
    returning: { label: 'Hazatér', bg: '#ede9fe', text: '#6d28d9' },
    dead: { label: 'Elhullott', bg: '#fee2e2', text: '#b91c1c' },
    delivered: { label: 'Kézbesítve', bg: '#dcfce7', text: '#166534' },
    expired_lost: { label: 'Elveszett', bg: '#fee2e2', text: '#b91c1c' },
  };
  const s = map[status] ?? { label: status, bg: '#f0e8d4', text: '#4a3f32' };
  return <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: s.bg, color: s.text }}>{s.label}</span>;
}

function EmptyState({ label }: { label: string }) {
  return <div style={{ padding: '40px 20px', textAlign: 'center', color: '#a39887', fontSize: 14 }}>{label}</div>;
}

const TH = ({ children }: { children: string }) => (
  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, color: '#4a3f32', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6 }}>{children}</th>
);
const TD = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <td style={{ padding: '11px 16px', borderTop: '1px solid #f0e8d4', ...style }}>{children}</td>
);

export default function AdminDashboard() {
  const [secret, setSecret] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentTab, setCurrentTab] = useState<Tab>('overview');
  const [statsData, setStatsData] = useState<any>(null);
  const [usersData, setUsersData] = useState<any[]>([]);
  const [flightsData, setFlightsData] = useState<any[]>([]);
  const [messagesData, setMessagesData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const h = useCallback(() => ({ 'Authorization': `Bearer ${secret}` }), [secret]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const fetchStats   = useCallback(async () => { const r = await fetch('/api/admin/stats', { headers: h() }); if (r.ok) setStatsData(await r.json()); }, [h]);
  const fetchUsers   = useCallback(async () => { const r = await fetch('/api/admin/users', { headers: h() }); if (r.ok) setUsersData(await r.json()); }, [h]);
  const fetchFlights = useCallback(async () => { const r = await fetch('/api/admin/flights', { headers: h() }); if (r.ok) setFlightsData(await r.json()); }, [h]);
  const fetchMsgs    = useCallback(async () => { const r = await fetch('/api/admin/messages', { headers: h() }); if (r.ok) setMessagesData(await r.json()); }, [h]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const r = await fetch('/api/admin/stats', { headers: h() });
      if (!r.ok) throw new Error('Bad secret');
      setStatsData(await r.json());
      setIsAuthenticated(true);
    } catch { setError('Hitelesítés sikertelen. Ellenőrizd a titkos kulcsot.'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    if (currentTab === 'overview') fetchStats();
    if (currentTab === 'users') fetchUsers();
    if (currentTab === 'flights') fetchFlights();
    if (currentTab === 'messages') fetchMsgs();
  }, [currentTab, isAuthenticated]);

  const giveItem = async (endpoint: string, userId: string, uname: string, label: string) => {
    const amount = prompt(`Mennyi ${label} adjunk ${uname} számára?`);
    if (!amount || isNaN(Number(amount))) return;
    const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', ...h() }, body: JSON.stringify({ userId, amount: Number(amount) }) });
    if (r.ok) { showToast(`✓ ${amount} ${label} adva: ${uname}`); fetchUsers(); }
    else showToast(`✗ Nem sikerült adni ${label}`);
  };

  const banUser = async (userId: string, uname: string) => {
    if (!confirm(`Letiltod "${uname}" fiókját? (soft delete)`)) return;
    const r = await fetch(`/api/admin/users?id=${userId}`, { method: 'DELETE', headers: h() });
    if (r.ok) { showToast(`✓ ${uname} letiltva`); fetchUsers(); }
    else showToast('✗ Nem sikerült letiltani');
  };

  const deleteUser = async (userId: string, uname: string) => {
    if (!confirm(`Biztosan törölni szeretnéd "${uname}" fiókját?`)) return;
    const permanent = confirm(`Véglegesen töröljük az adatbázisból is?\nOK = Végleges törlés\nMégse = Csak archiválás/soft delete`);
    const r = await fetch(`/api/admin/users?id=${userId}&permanent=${permanent}`, { method: 'DELETE', headers: h() });
    if (r.ok) {
      showToast(`✓ ${uname} sikeresen törölve`);
      fetchUsers();
    } else {
      showToast('✗ Nem sikerült törölni a felhasználót');
    }
  };

  const recallPigeon = async (pigeonId: string, name: string) => {
    if (!confirm(`Azonnal hazahívod "${name}" galambot a dúcába és kipihenteted (0% fáradtság)?`)) return;
    const r = await fetch('/api/admin/pigeons/recall', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...h() },
      body: JSON.stringify({ pigeonId }),
    });
    const data = await r.json();
    if (r.ok) {
      showToast(`✓ ${data.message || `${name} hazatért!`}`);
      fetchFlights();
      fetchStats();
    } else {
      showToast(`✗ ${data.error || 'Nem sikerült hazahívni'}`);
    }
  };

  const deliverMessage = async (messageId: string) => {
    if (!confirm('Azonnal lezárod ezt a repülést és kézbesíted a levelet?')) return;
    const r = await fetch('/api/admin/messages/deliver', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...h() },
      body: JSON.stringify({ messageId }),
    });
    const data = await r.json();
    if (r.ok) {
      showToast(`✓ ${data.message || 'Repülés lezárva!'}`);
      fetchMsgs();
      fetchStats();
    } else {
      showToast(`✗ ${data.error || 'Nem sikerült kézbesíteni'}`);
    }
  };

  const refreshTab = () => {
    if (currentTab === 'overview') fetchStats();
    if (currentTab === 'users') fetchUsers();
    if (currentTab === 'flights') fetchFlights();
    if (currentTab === 'messages') fetchMsgs();
  };

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', background: '#f4ebd8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui,sans-serif' }}>
        <div style={{ width: '100%', maxWidth: 420, background: '#fdfbf7', padding: 40, borderRadius: 20, boxShadow: '0 8px 40px rgba(44,36,27,0.14)', border: '1px solid #e3d5b8' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ width: 52, height: 52, background: '#2c241b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: '#fdfbf7' }}><SvgShield /></div>
            <h1 style={{ fontFamily: 'Georgia,serif', fontSize: 24, color: '#2c241b', margin: 0 }}>PigeonPost Admin</h1>
            <p style={{ color: '#8c7d6b', fontSize: 13, margin: '6px 0 0' }}>Biztonságos belépés</p>
          </div>
          <form onSubmit={handleLogin}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4a3f32', marginBottom: 6 }}>Admin titkos kulcs</label>
            <input type="password" value={secret} onChange={e => setSecret(e.target.value)} placeholder="Titkos kulcs..."
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e3d5b8', borderRadius: 10, background: '#f4ebd8', fontSize: 14, color: '#2c241b', outline: 'none', boxSizing: 'border-box', marginBottom: 14 }} />
            {error && <p style={{ color: '#b91c1c', fontSize: 13, marginBottom: 10 }}>{error}</p>}
            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: 12, background: '#7a2222', color: '#fdfbf7', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
              {loading ? 'Hitelesítés...' : 'Belépés az irányítópultra'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'overview' as Tab, label: 'Áttekintés', Icon: SvgShield },
    { id: 'users' as Tab, label: 'Felhasználók', Icon: SvgUsers },
    { id: 'flights' as Tab, label: 'Galambok', Icon: SvgPigeon },
    { id: 'messages' as Tab, label: 'Üzenetek', Icon: SvgMail },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui,sans-serif', background: '#f4ebd8' }}>
      <div style={{ width: 230, background: '#2c241b', color: '#fdfbf7', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '26px 18px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ fontFamily: 'Georgia,serif', fontSize: 19, margin: 0, letterSpacing: 1 }}>PigeonPost</p>
          <p style={{ fontSize: 10, color: '#a39887', margin: '4px 0 0', letterSpacing: 2, textTransform: 'uppercase' }}>Admin Panel</p>
        </div>
        <nav style={{ flex: 1, padding: 10 }}>
          {navItems.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setCurrentTab(id)}
              style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '10px 13px', border: 'none', borderRadius: 9, marginBottom: 3, cursor: 'pointer', fontSize: 13,
                fontWeight: currentTab === id ? 700 : 500, textAlign: 'left',
                background: currentTab === id ? '#7a2222' : 'transparent',
                color: currentTab === id ? '#fdfbf7' : '#a39887' }}>
              <Icon />{label}
            </button>
          ))}
        </nav>
        <div style={{ padding: 10, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button onClick={() => setIsAuthenticated(false)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 13px', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, background: 'transparent', color: '#a39887', cursor: 'pointer', fontSize: 12 }}>
            <SvgLogout />Kijelentkezés
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <header style={{ height: 58, background: '#fdfbf7', borderBottom: '1px solid #e3d5b8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0 }}>
          <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 17, margin: 0, color: '#2c241b' }}>
            {navItems.find(n => n.id === currentTab)?.label}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {toast && <span style={{ fontSize: 12, color: toast.startsWith('✓') ? '#059669' : '#b91c1c', fontWeight: 700 }}>{toast}</span>}
            <span style={{ fontSize: 11, color: '#8c7d6b', fontFamily: 'monospace', background: '#f4ebd8', padding: '3px 9px', borderRadius: 6, border: '1px solid #e3d5b8' }}>{statsData?.serverTime}</span>
            <button onClick={refreshTab}
              style={{ padding: '6px 12px', background: '#f4ebd8', border: '1px solid #e3d5b8', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#4a3f32', fontWeight: 600 }}>
              <SvgRefresh />Frissítés
            </button>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

          {/* OVERVIEW */}
          {currentTab === 'overview' && (<>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 16, marginBottom: 24 }}>
              <StatCard title="Aktív felhasználók" value={statsData?.stats.activeUsers} Icon={SvgUsers} color="#2c241b" />
              <StatCard title="Repülő galambok"    value={statsData?.stats.flyingPigeons} Icon={SvgPigeon} color="#2563eb" />
              <StatCard title="Elhullott (24h)"    value={statsData?.stats.deadPigeons} Icon={SvgSkull} color="#b91c1c" />
              <StatCard title="Maggazdaság"         value={statsData?.stats.seedEconomy} Icon={SvgSeed} color="#059669" />
            </div>
            <div style={{ background: '#fdfbf7', borderRadius: 14, border: '1px solid #e3d5b8', overflow: 'hidden' }}>
              <div style={{ padding: '14px 22px', borderBottom: '1px solid #e3d5b8', background: '#f4ebd8' }}>
                <h3 style={{ fontFamily: 'Georgia,serif', fontSize: 15, margin: 0 }}>Rendszernapló</h3>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ background: 'rgba(227,213,184,0.3)' }}>{['Időbélyeg','Szint','Üzenet','Kontextus'].map(h => <TH key={h}>{h}</TH>)}</tr></thead>
                <tbody>
                  {statsData?.logs.map((log: any) => (
                    <tr key={log.id}>
                      <TD style={{ fontFamily: 'monospace', fontSize: 11, color: '#5c4f3d' }}>{log.timestamp}</TD>
                      <TD><span style={{ padding: '2px 7px', borderRadius: 5, fontSize: 10, fontWeight: 700,
                        background: log.level==='error'?'#fee2e2':log.level==='warn'?'#fef3c7':'#dbeafe',
                        color: log.level==='error'?'#b91c1c':log.level==='warn'?'#92400e':'#1e40af' }}>{log.level.toUpperCase()}</span></TD>
                      <TD>{log.message}</TD>
                      <TD style={{ fontFamily: 'monospace', fontSize: 11, color: '#8c7d6b' }}>{log.context}</TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>)}

          {/* USERS */}
          {currentTab === 'users' && (
            <div style={{ background: '#fdfbf7', borderRadius: 14, border: '1px solid #e3d5b8', overflow: 'hidden' }}>
              <div style={{ padding: '14px 22px', borderBottom: '1px solid #e3d5b8', background: '#f4ebd8' }}>
                <h3 style={{ fontFamily: 'Georgia,serif', fontSize: 15, margin: 0 }}>Felhasználók ({usersData.length})</h3>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ background: 'rgba(227,213,184,0.3)' }}>{['Felhasználónév','Email','Szint','Magvak','Kalitkák','Regisztrált','Műveletek'].map(h => <TH key={h}>{h}</TH>)}</tr></thead>
                <tbody>
                  {usersData.map((u: any) => (
                    <tr key={u._id}>
                      <TD>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#2c241b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fdfbf7', fontWeight: 800, fontSize: 11 }}>
                            {u.username.charAt(0).toUpperCase()}
                          </div>
                          {u.username}
                        </div>
                      </TD>
                      <TD style={{ color: '#8c7d6b' }}>{u.email}</TD>
                      <TD><span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 7px', borderRadius: 5, fontWeight: 700, fontSize: 11 }}>Lv.{u.level}</span></TD>
                      <TD style={{ color: '#059669', fontWeight: 700 }}>{u.inventory?.seeds ?? 0}</TD>
                      <TD style={{ color: '#d97706', fontWeight: 700 }}>{u.inventory?.cages ?? 0}</TD>
                      <TD style={{ fontSize: 11, color: '#8c7d6b', fontFamily: 'monospace' }}>{new Date(u.createdAt).toLocaleDateString('hu-HU')}</TD>
                      <TD>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <ActionBtn label="+ Mag" onClick={() => giveItem('/api/admin/users/seeds', u._id, u.username, 'mag')} color="#059669" />
                          <ActionBtn label="+ Kalitka" onClick={() => giveItem('/api/admin/users/cages', u._id, u.username, 'kalitka')} color="#d97706" />
                          <ActionBtn label="Tiltás" onClick={() => banUser(u._id, u.username)} color="#ea580c" />
                          <ActionBtn label="Törlés" onClick={() => deleteUser(u._id, u.username)} color="#b91c1c" />
                        </div>
                      </TD>
                    </tr>
                  ))}
                </tbody>
              </table>
              {usersData.length === 0 && <EmptyState label="Nincsenek felhasználók" />}
            </div>
          )}

          {/* FLIGHTS / PIGEONS */}
          {currentTab === 'flights' && (
            <div style={{ background: '#fdfbf7', borderRadius: 14, border: '1px solid #e3d5b8', overflow: 'hidden' }}>
              <div style={{ padding: '14px 22px', borderBottom: '1px solid #e3d5b8', background: '#f4ebd8' }}>
                <h3 style={{ fontFamily: 'Georgia,serif', fontSize: 15, margin: 0 }}>Repülő és Dúc Galambok ({flightsData.length})</h3>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ background: 'rgba(227,213,184,0.3)' }}>{['Galamb','Tulajdonos','Állapot','Fáradtság','Utoljára frissítve','Művelet'].map(h => <TH key={h}>{h}</TH>)}</tr></thead>
                <tbody>
                  {flightsData.map((p: any) => (
                    <tr key={p._id}>
                      <TD style={{ fontWeight: 700 }}>{p.name} <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#8c7d6b' }}>{p.identifier}</span></TD>
                      <TD style={{ color: '#5c4f3d' }}>{p.ownerId?.username ?? 'Ismeretlen'}</TD>
                      <TD><StatusBadge status={p.status} /></TD>
                      <TD>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 5, background: '#f0e8d4', borderRadius: 3 }}>
                            <div style={{ height: 5, borderRadius: 3, width: `${p.fatigue}%`, background: p.fatigue>70?'#b91c1c':p.fatigue>40?'#d97706':'#059669' }} />
                          </div>
                          <span style={{ fontSize: 11, color: '#4a3f32', fontWeight: 600, minWidth: 30 }}>{p.fatigue}%</span>
                        </div>
                      </TD>
                      <TD style={{ fontSize: 11, fontFamily: 'monospace', color: '#8c7d6b' }}>{new Date(p.updatedAt).toLocaleString('hu-HU')}</TD>
                      <TD>
                        <ActionBtn label="Azonnal Haza" onClick={() => recallPigeon(p._id, p.name)} color="#0284c7" />
                      </TD>
                    </tr>
                  ))}
                </tbody>
              </table>
              {flightsData.length === 0 && <EmptyState label="Jelenleg nincs repülő galamb" />}
            </div>
          )}

          {/* MESSAGES */}
          {currentTab === 'messages' && (<>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 16, marginBottom: 24 }}>
              <StatCard title="Összes üzenet" value={messagesData?.stats.totalMessages} Icon={SvgMail} color="#2c241b" />
              <StatCard title="Repülés alatt" value={messagesData?.stats.flyingMessages} Icon={SvgFlight} color="#2563eb" />
              <StatCard title="Kézbesítve" value={messagesData?.stats.deliveredMessages} Icon={SvgMail} color="#059669" />
              <StatCard title="Elveszett" value={messagesData?.stats.lostMessages} Icon={SvgSkull} color="#b91c1c" />
            </div>
            <div style={{ background: '#fdfbf7', borderRadius: 14, border: '1px solid #e3d5b8', overflow: 'hidden' }}>
              <div style={{ padding: '14px 22px', borderBottom: '1px solid #e3d5b8', background: '#f4ebd8' }}>
                <h3 style={{ fontFamily: 'Georgia,serif', fontSize: 15, margin: 0 }}>Aktív repülések</h3>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ background: 'rgba(227,213,184,0.3)' }}>{['Feladó','Címzett','Távolság','Elküldve','Várható érkezés','Állapot','Művelet'].map(h => <TH key={h}>{h}</TH>)}</tr></thead>
                <tbody>
                  {(messagesData?.activeMessages ?? []).map((msg: any) => {
                    const sender = typeof msg.senderId === 'object' ? msg.senderId?.username : '?';
                    const recipient = typeof msg.recipientId === 'object' ? msg.recipientId?.username : '?';
                    const eta = msg.estimatedArrivalAt ? new Date(msg.estimatedArrivalAt) : null;
                    const isLate = eta && eta < new Date();
                    return (
                      <tr key={msg._id}>
                        <TD style={{ fontWeight: 700 }}>{sender}</TD>
                        <TD>{recipient}</TD>
                        <TD style={{ color: '#2563eb', fontWeight: 600 }}>{Math.round(msg.distanceKm ?? 0)} km</TD>
                        <TD style={{ fontSize: 11, fontFamily: 'monospace', color: '#8c7d6b' }}>{msg.dispatchedAt ? new Date(msg.dispatchedAt).toLocaleString('hu-HU') : '—'}</TD>
                        <TD style={{ fontSize: 11, fontFamily: 'monospace', color: isLate ? '#b91c1c' : '#059669', fontWeight: isLate ? 700 : 400 }}>
                          {eta ? eta.toLocaleTimeString('hu-HU') : '—'}
                          {isLate && <span style={{ marginLeft: 5, fontSize: 10 }}>(késik!)</span>}
                        </TD>
                        <TD><StatusBadge status={msg.status} /></TD>
                        <TD>
                          <ActionBtn label="Kézbesítés" onClick={() => deliverMessage(msg._id)} color="#059669" />
                        </TD>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {(messagesData?.activeMessages ?? []).length === 0 && <EmptyState label="Jelenleg nincs aktív repülés" />}
            </div>
          </>)}

        </main>
      </div>
    </div>
  );
}

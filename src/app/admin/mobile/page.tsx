'use client';

/**
 * PigeonPost – mobilra szabott, egyszerűsített admin.
 * Funkciók: áttekintés, felhasználók (arany/mag/kalitka jóváírás, tiltás/feloldás), jelentések, repülések.
 * A teljes admin: /admin. Hitelesítés: Authorization: Bearer <ADMIN_SECRET> (mint a teljes adminnál).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';

interface AdminUser {
  _id: string;
  username: string;
  email?: string;
  level?: number;
  gold?: number;
  inventory?: { seeds?: number; cages?: number };
  location?: { city?: string };
  isDeleted?: boolean;
  status?: 'active' | 'banned';
}

interface AdminReport {
  _id: string;
  reason: string;
  details?: string;
  createdAt: string;
  reporterId?: { username?: string } | null;
  targetUserId?: { username?: string; status?: string } | null;
  messageId?: { content?: string } | null;
}

interface AdminFlight {
  _id: string;
  name?: string;
  status: string;
  ownerId?: { username?: string } | null;
}

interface AdminStats {
  stats?: { activeUsers?: number; flyingPigeons?: number; deadPigeons?: number; seedEconomy?: number };
  serverTime?: string;
}

type Tab = 'overview' | 'users' | 'reports' | 'flights';
type ItemKind = 'gold' | 'seeds' | 'cages';

const ITEM_META: Record<ItemKind, { label: string; endpoint: string; icon: string; quick: number[] }> = {
  gold: { label: 'Arany', endpoint: '/api/admin/users/gold', icon: '🪙', quick: [50, 100, 500] },
  seeds: { label: 'Mag', endpoint: '/api/admin/users/seeds', icon: '🌾', quick: [20, 50, 200] },
  cages: { label: 'Kalitka', endpoint: '/api/admin/users/cages', icon: '🎁', quick: [1, 2, 5] },
};

const STORAGE_KEY = 'pp_admin_secret_session';

const C = {
  bg: '#0b0d14',
  card: '#151826',
  border: 'rgba(255,255,255,0.08)',
  text: '#e2e8f0',
  muted: '#8c92a4',
  primary: '#818cf8',
  green: '#34d399',
  red: '#f87171',
  amber: '#fbbf24',
};

export default function MobileAdmin() {
  const [secret, setSecret] = useState('');
  const [authed, setAuthed] = useState(false);
  const [input, setInput] = useState('');
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [flights, setFlights] = useState<AdminFlight[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [sheet, setSheet] = useState<{ user: AdminUser; kind: ItemKind } | null>(null);
  const [amount, setAmount] = useState('');

  const hdr = useCallback(() => ({ Authorization: `Bearer ${secret}` }), [secret]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const fetchStats = useCallback(async (s: string) => {
    const r = await fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${s}` } });
    if (!r.ok) throw new Error(String(r.status));
    setStats(await r.json());
  }, []);

  const fetchUsers = useCallback(async (s: string) => {
    const r = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${s}` } });
    if (!r.ok) throw new Error(String(r.status));
    setUsers(await r.json());
  }, []);

  const fetchReports = useCallback(async (s: string) => {
    const r = await fetch('/api/admin/reports?status=open', { headers: { Authorization: `Bearer ${s}` } });
    if (!r.ok) throw new Error(String(r.status));
    setReports(await r.json());
  }, []);

  const fetchFlights = useCallback(async (s: string) => {
    const r = await fetch('/api/admin/flights', { headers: { Authorization: `Bearer ${s}` } });
    if (!r.ok) throw new Error(String(r.status));
    setFlights(await r.json());
  }, []);

  const enter = useCallback(
    async (s: string) => {
      setLoading(true);
      setError('');
      try {
        await fetchStats(s);
        setSecret(s);
        setAuthed(true);
        try {
          sessionStorage.setItem(STORAGE_KEY, s);
        } catch {
          // privát módban a sessionStorage nem elérhető – nem gond, csak újra be kell írni
        }
        fetchUsers(s).catch((e) => console.error('[admin/mobile] felhasználók betöltése sikertelen:', e));
      } catch {
        setError('Hibás admin titok, vagy a szerver nem elérhető.');
        try {
          sessionStorage.removeItem(STORAGE_KEY);
        } catch {}
      } finally {
        setLoading(false);
      }
    },
    [fetchStats, fetchUsers]
  );

  // Munkamenet-visszaállítás (a böngészőlap bezárásáig)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- a setState csak az aszinkron lekérés után fut
      if (saved) void enter(saved);
    } catch {}
  }, [enter]);

  const logout = () => {
    setAuthed(false);
    setSecret('');
    setInput('');
    setStats(null);
    setUsers([]);
    setReports([]);
    setFlights([]);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const submitAmount = async () => {
    if (!sheet) return;
    const n = Number(amount);
    if (!Number.isInteger(n) || n === 0) {
      showToast('✗ Adj meg egy 0-tól különböző egész számot');
      return;
    }
    const { user, kind } = sheet;
    const meta = ITEM_META[kind];
    const r = await fetch(meta.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...hdr() },
      body: JSON.stringify({ userId: user._id, amount: n }),
    });
    if (r.ok) {
      showToast(`✓ ${n} ${meta.label.toLowerCase()} → ${user.username}`);
      setSheet(null);
      setAmount('');
      fetchUsers(secret).catch((e) => console.error(e));
    } else {
      const detail = await r.json().then((d: { error?: string }) => d?.error).catch(() => undefined);
      showToast(`✗ ${r.status}${detail ? `: ${detail}` : ''}`);
    }
  };

  const toggleBan = async (u: AdminUser) => {
    const ban = u.status !== 'banned';
    if (!confirm(ban ? `Letiltod „${u.username}" fiókját? Kijelentkeztetjük, és nem tud belépni.` : `Feloldod „${u.username}" tiltását?`)) return;
    const r = await fetch('/api/admin/users/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...hdr() },
      body: JSON.stringify({ userId: u._id, status: ban ? 'banned' : 'active' }),
    });
    if (r.ok) {
      showToast(ban ? `✓ ${u.username} letiltva` : `✓ ${u.username} tiltása feloldva`);
      fetchUsers(secret).catch((e) => console.error(e));
    } else {
      showToast(`✗ Sikertelen (${r.status})`);
    }
  };

  const actOnReport = async (id: string, action: 'resolve' | 'dismiss' | 'ban') => {
    if (action === 'ban' && !confirm('Letiltod a jelentett felhasználót?')) return;
    const r = await fetch('/api/admin/reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...hdr() },
      body: JSON.stringify({ id, action }),
    });
    if (r.ok) {
      showToast(action === 'ban' ? '✓ Felhasználó letiltva' : '✓ Jelentés lezárva');
      fetchReports(secret).catch((e) => console.error(e));
    } else {
      showToast(`✗ Sikertelen (${r.status})`);
    }
  };

  const deliverAll = async () => {
    if (!confirm('Minden repülő levelet azonnal kézbesítesz, az expedíciók hazaérnek, a galambok pihennek. Biztos?')) return;
    const r = await fetch('/api/admin/flights', { method: 'POST', headers: hdr() });
    if (r.ok) {
      showToast('✓ Minden repülés felgyorsítva');
      fetchFlights(secret).catch((e) => console.error(e));
    } else {
      showToast(`✗ Sikertelen (${r.status})`);
    }
  };

  // Fül váltáskor frissítjük az adott fül adatait
  useEffect(() => {
    if (!authed) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a setState csak az aszinkron lekérés után fut
    if (tab === 'reports') fetchReports(secret).catch((e) => console.error('[admin/mobile] jelentések:', e));
    if (tab === 'flights') fetchFlights(secret).catch((e) => console.error('[admin/mobile] repülések:', e));
  }, [tab, authed, secret, fetchReports, fetchFlights]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.username.toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q));
  }, [users, search]);

  const page: React.CSSProperties = {
    minHeight: '100dvh',
    background: C.bg,
    color: C.text,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    paddingBottom: 'calc(72px + env(safe-area-inset-bottom))',
  };

  if (!authed) {
    return (
      <div style={{ ...page, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (input) void enter(input);
          }}
          style={{ width: '100%', maxWidth: 380, background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 22 }}
        >
          <div style={{ fontSize: 36, textAlign: 'center' }}>🕊️</div>
          <h1 style={{ fontSize: 20, textAlign: 'center', margin: '6px 0 18px' }}>PigeonPost Admin</h1>
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Admin titok"
            autoComplete="current-password"
            style={{ ...inputStyle, marginBottom: 12 }}
          />
          {error && <div style={{ color: C.red, fontSize: 13, marginBottom: 10 }}>{error}</div>}
          <button type="submit" disabled={loading || !input} style={{ ...primaryBtn, width: '100%', opacity: loading || !input ? 0.5 : 1 }}>
            {loading ? 'Belépés…' : 'Belépés'}
          </button>
          <a href="/admin" style={{ display: 'block', textAlign: 'center', color: C.muted, fontSize: 13, marginTop: 14 }}>
            Teljes admin felület →
          </a>
        </form>
      </div>
    );
  }

  return (
    <div style={page}>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 5,
          background: C.bg,
          borderBottom: `1px solid ${C.border}`,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <strong style={{ fontSize: 16 }}>🕊️ PigeonPost Admin</strong>
        <button onClick={logout} style={{ ...ghostBtn, padding: '6px 12px' }}>
          Kilépés
        </button>
      </header>

      <main style={{ padding: 16 }}>
        {tab === 'overview' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Stat label="Aktív felhasználó" value={stats?.stats?.activeUsers} icon="👥" color={C.primary} />
              <Stat label="Repülő galamb" value={stats?.stats?.flyingPigeons} icon="🕊️" color={C.green} />
              <Stat label="Elpusztult (24ó)" value={stats?.stats?.deadPigeons} icon="💀" color={C.red} />
              <Stat label="Összes mag" value={stats?.stats?.seedEconomy} icon="🌾" color={C.amber} />
            </div>
            <p style={{ color: C.muted, fontSize: 12, marginTop: 14 }}>Szerveridő: {stats?.serverTime ?? '–'}</p>
            <button
              onClick={() => fetchStats(secret).catch(() => showToast('✗ Frissítés sikertelen'))}
              style={{ ...ghostBtn, width: '100%', marginTop: 8 }}
            >
              ↻ Frissítés
            </button>
            <a href="/admin" style={{ display: 'block', textAlign: 'center', color: C.muted, fontSize: 13, marginTop: 18 }}>
              Teljes admin felület →
            </a>
          </>
        )}

        {tab === 'users' && (
          <>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Keresés névre vagy emailre…"
              style={{ ...inputStyle, marginBottom: 12 }}
            />
            <p style={{ color: C.muted, fontSize: 12, margin: '0 0 8px' }}>{filtered.length} felhasználó</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map((u) => (
                <div key={u._id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                    <strong style={{ fontSize: 15, overflowWrap: 'anywhere' }}>
                      {u.username}
                      {u.status === 'banned' && <span style={{ color: C.red, fontSize: 11, marginLeft: 6 }}>TILTVA</span>}
                    </strong>
                    <span style={{ color: C.muted, fontSize: 12, whiteSpace: 'nowrap' }}>Lv {u.level ?? 1}</span>
                  </div>
                  <div style={{ color: C.muted, fontSize: 12, overflowWrap: 'anywhere' }}>
                    {u.email}
                    {u.location?.city ? ` · ${u.location.city}` : ''}
                  </div>
                  <div style={{ display: 'flex', gap: 14, margin: '10px 0', fontSize: 13 }}>
                    <span>🪙 {(u.gold ?? 0).toLocaleString()}</span>
                    <span>🌾 {(u.inventory?.seeds ?? 0).toLocaleString()}</span>
                    <span>🎁 {u.inventory?.cages ?? 0}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {(Object.keys(ITEM_META) as ItemKind[]).map((k) => (
                      <button
                        key={k}
                        onClick={() => {
                          setSheet({ user: u, kind: k });
                          setAmount('');
                        }}
                        style={{ ...ghostBtn, flex: 1, minWidth: 80 }}
                      >
                        {ITEM_META[k].icon} {ITEM_META[k].label}
                      </button>
                    ))}
                    <button onClick={() => toggleBan(u)} style={{ ...ghostBtn, color: u.status === 'banned' ? C.green : C.red, flexBasis: '100%' }}>
                      {u.status === 'banned' ? 'Tiltás feloldása' : 'Letiltás'}
                    </button>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && <p style={{ color: C.muted, textAlign: 'center' }}>Nincs találat.</p>}
            </div>
          </>
        )}
        {tab === 'reports' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {reports.length === 0 && <p style={{ color: C.muted, textAlign: 'center' }}>Nincs nyitott jelentés. 🎉</p>}
            {reports.map((rp) => (
              <div key={rp._id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14 }}>
                <strong>{rp.targetUserId?.username ?? '(törölt felhasználó)'}</strong>
                {rp.targetUserId?.status === 'banned' && <span style={{ color: C.red, fontSize: 11, marginLeft: 6 }}>TILTVA</span>}
                <div style={{ color: C.muted, fontSize: 12, margin: '4px 0' }}>
                  {rp.reason} · jelentette: {rp.reporterId?.username ?? '?'} · {new Date(rp.createdAt).toLocaleString('hu-HU')}
                </div>
                {rp.details && <div style={{ fontSize: 13, marginBottom: 6 }}>&bdquo;{rp.details}&rdquo;</div>}
                {rp.messageId?.content && (
                  <div style={{ fontSize: 13, color: C.muted, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 8, marginBottom: 8, overflowWrap: 'anywhere' }}>
                    Levél: {rp.messageId.content}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => actOnReport(rp._id, 'ban')} style={{ ...ghostBtn, flex: 1, color: C.red }}>Tiltás</button>
                  <button onClick={() => actOnReport(rp._id, 'resolve')} style={{ ...ghostBtn, flex: 1 }}>Lezár</button>
                  <button onClick={() => actOnReport(rp._id, 'dismiss')} style={{ ...ghostBtn, flex: 1 }}>Elvet</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'flights' && (
          <>
            <button onClick={deliverAll} style={{ ...primaryBtn, width: '100%', marginBottom: 12 }}>
              ⚡ Minden repülés azonnali befejezése
            </button>
            <p style={{ color: C.muted, fontSize: 12, margin: '0 0 8px' }}>{flights.length} galamb úton</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {flights.map((f) => (
                <div key={f._id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span>🕊️ {f.name ?? 'Galamb'} <span style={{ color: C.muted }}>· {f.ownerId?.username ?? '?'}</span></span>
                  <span style={{ color: f.status === 'returning' ? C.amber : C.green, fontSize: 12 }}>{f.status}</span>
                </div>
              ))}
              {flights.length === 0 && <p style={{ color: C.muted, textAlign: 'center' }}>Nincs repülő galamb.</p>}
            </div>
          </>
        )}
      </main>

      <nav
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          background: C.card,
          borderTop: `1px solid ${C.border}`,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {([
          ['overview', '📊', 'Áttekintés'],
          ['users', '👥', 'Emberek'],
          ['reports', '🚩', 'Jelentések'],
          ['flights', '🕊️', 'Repülések'],
        ] as const).map(([id, icon, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              flex: 1,
              padding: '12px 0',
              background: 'none',
              border: 'none',
              color: tab === id ? C.primary : C.muted,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <div style={{ fontSize: 20 }}>{icon}</div>
            {label}
          </button>
        ))}
      </nav>

      {sheet && (
        <div
          onClick={() => setSheet(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 20, display: 'flex', alignItems: 'flex-end' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              background: C.card,
              borderRadius: '20px 20px 0 0',
              padding: '20px 16px calc(20px + env(safe-area-inset-bottom))',
            }}
          >
            <strong style={{ fontSize: 16 }}>
              {ITEM_META[sheet.kind].icon} {ITEM_META[sheet.kind].label} – {sheet.user.username}
            </strong>
            <p style={{ color: C.muted, fontSize: 12, margin: '4px 0 12px' }}>Negatív szám levonást jelent.</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {ITEM_META[sheet.kind].quick.map((q) => (
                <button key={q} onClick={() => setAmount(String(q))} style={{ ...ghostBtn, flex: 1 }}>
                  +{q}
                </button>
              ))}
            </div>
            <input
              type="number"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Mennyiség"
              style={{ ...inputStyle, marginBottom: 12 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setSheet(null)} style={{ ...ghostBtn, flex: 1 }}>
                Mégse
              </button>
              <button onClick={submitAmount} style={{ ...primaryBtn, flex: 2 }}>
                Jóváírás
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          style={{
            position: 'fixed',
            left: 16,
            right: 16,
            bottom: 'calc(84px + env(safe-area-inset-bottom))',
            background: '#1f2437',
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: '12px 14px',
            fontSize: 14,
            zIndex: 30,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, icon, color }: { label: string; value?: number; icon: string; color: string }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14 }}>
      <div style={{ fontSize: 22 }}>{icon}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color, margin: '4px 0' }}>{value?.toLocaleString() ?? '–'}</div>
      <div style={{ color: C.muted, fontSize: 12 }}>{label}</div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: '#0f1220',
  border: `1px solid ${C.border}`,
  borderRadius: 12,
  padding: '13px 14px',
  color: C.text,
  fontSize: 16, // 16px alatt az iOS ráközelít a mezőre
};

const primaryBtn: React.CSSProperties = {
  background: C.primary,
  color: '#0b0d14',
  border: 'none',
  borderRadius: 12,
  padding: '13px 16px',
  fontSize: 15,
  fontWeight: 700,
};

const ghostBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  color: C.text,
  border: `1px solid ${C.border}`,
  borderRadius: 12,
  padding: '11px 12px',
  fontSize: 14,
  fontWeight: 600,
};

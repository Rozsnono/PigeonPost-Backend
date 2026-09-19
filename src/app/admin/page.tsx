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
  Feather: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/></svg>,
  Plus: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Edit: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>,
  Upload: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  Compass: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>,
  Stamp: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="12" cy="12" r="4"/><path d="m16 8 2-2"/><path d="m8 16-2 2"/></svg>,
};

type Tab = 'overview' | 'users' | 'pigeons' | 'species' | 'expeditions' | 'wheel' | 'messages' | 'activity';

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
  const [speciesList, setSpeciesList] = useState<any[]>([]);
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

  // Species Modal & Form State
  const [speciesModal, setSpeciesModal] = useState<'add' | 'edit' | null>(null);
  const [editingSpecies, setEditingSpecies] = useState<any>(null);
  const [speciesForm, setSpeciesForm] = useState({
    speciesId: '',
    name: '',
    subtitle: '',
    speedKmH: 80,
    priceGold: 0,
    minLevel: 1,
    requirementText: '',
    avatarBase64: '',
    flyingBase64: '',
    sizeRank: 1,
    isActive: true,
  });
  const [speciesSaving, setSpeciesSaving] = useState(false);

  // Pigeon Edit Modal State
  const [editingPigeon, setEditingPigeon] = useState<any | null>(null);
  const [pigeonStatusFilter, setPigeonStatusFilter] = useState<'all' | 'flying' | 'idle' | 'resting' | 'dead'>('all');
  const [pigeonForm, setPigeonForm] = useState({
    name: '',
    level: 1,
    xp: 0,
    speedKmH: 80,
    fatigue: 0,
    status: 'idle',
    species: 'pigeon',
  });
  const [pigeonSaving, setPigeonSaving] = useState(false);

  // Wheel State
  const [wheelSlots, setWheelSlots] = useState<any[]>([]);
  const [wheelTotalWeight, setWheelTotalWeight] = useState(0);
  const [wheelModal, setWheelModal] = useState<'add' | 'edit' | null>(null);
  const [editingWheelSlot, setEditingWheelSlot] = useState<any | null>(null);
  const [wheelForm, setWheelForm] = useState({
    slotId: '',
    label: '',
    type: 'gold',
    amount: 50,
    weight: 10,
    color: '#f59e0b',
    rarity: 'common',
    isActive: true,
  });
  const [wheelSaving, setWheelSaving] = useState(false);

  // Expedition Cities State
  const [cities, setCities] = useState<any[]>([]);
  const [cityModal, setCityModal] = useState<'add' | 'edit' | null>(null);
  const [editingCity, setEditingCity] = useState<any | null>(null);
  const [cityForm, setCityForm] = useState({
    cityId: '',
    name: '',
    country: '',
    lat: 47.4979,
    lng: 19.0402,
    description: '',
    icon: 'monument',
    minLevel: 1,
    rewardMultiplier: 1.0,
    cageDropChance: 5,
    stamps: [] as Array<{ id?: string; code: string; name: string; country?: string }>,
    isActive: true,
    order: 0,
  });
  const [stampInput, setStampInput] = useState({ code: '', name: '' });
  const [citySaving, setCitySaving] = useState(false);

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  const hdr = useCallback(() => ({ Authorization: `Bearer ${secret}` }), [secret]);
  const toast$ = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3200); };

  const fetchStats   = useCallback(async () => { try { const r = await fetch('/api/admin/stats',   { headers: hdr() }); if (r.ok) setStats(await r.json()); } catch {} }, [hdr]);
  const fetchUsers   = useCallback(async () => { try { const r = await fetch('/api/admin/users',   { headers: hdr() }); if (r.ok) setUsers(await r.json()); } catch {} }, [hdr]);
  const fetchPigeons = useCallback(async () => { try { const r = await fetch('/api/admin/pigeons', { headers: hdr() }); if (r.ok) setPigeons(await r.json()); } catch {} }, [hdr]);
  const fetchSpecies = useCallback(async () => { try { const r = await fetch('/api/admin/species', { headers: hdr() }); if (r.ok) setSpeciesList(await r.json()); } catch {} }, [hdr]);
  const fetchCities  = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/expeditions/cities', { headers: hdr() });
      if (r.ok) {
        const d = await r.json();
        setCities(d.cities || []);
      }
    } catch {}
  }, [hdr]);
  const fetchWheel   = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/wheel', { headers: hdr() });
      if (r.ok) {
        const d = await r.json();
        setWheelSlots(d.slots || []);
        setWheelTotalWeight(d.totalWeight || 0);
      }
    } catch {}
  }, [hdr]);
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
    if (tab === 'pigeons') {
      fetchPigeons();
      fetchSpecies();
    }
    if (tab === 'species') fetchSpecies();
    if (tab === 'expeditions') fetchCities();
    if (tab === 'wheel') fetchWheel();
    if (tab === 'messages') fetchMsgs();
  }, [tab, authed]);

  const refresh = async () => {
    setSpinning(true);
    if (tab === 'overview' || tab === 'activity') await fetchStats();
    if (tab === 'users') await fetchUsers();
    if (tab === 'pigeons') {
      await fetchPigeons();
      await fetchSpecies();
    }
    if (tab === 'species') await fetchSpecies();
    if (tab === 'expeditions') await fetchCities();
    if (tab === 'wheel') await fetchWheel();
    if (tab === 'messages') await fetchMsgs();
    setTimeout(() => setSpinning(false), 500);
  };

  // Client-side Canvas Image Compression to Base64
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'avatarBase64' | 'flyingBase64') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isFlying = field === 'flyingBase64';
    const maxWidth = isFlying ? 160 : 400;
    const maxHeight = isFlying ? 160 : 400;
    const format = isFlying ? 'image/png' : 'image/jpeg';
    const quality = 0.85;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL(format, quality);
        setSpeciesForm((prev) => ({ ...prev, [field]: dataUrl }));
        toast$(`✓ ${isFlying ? 'Repülő kép' : 'Profilkép'} betöltve & tömörítve (${Math.round(dataUrl.length / 1024)} KB)`);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const openAddSpecies = () => {
    setEditingSpecies(null);
    setSpeciesForm({
      speciesId: '',
      name: '',
      subtitle: '',
      speedKmH: 80,
      priceGold: 0,
      minLevel: 1,
      requirementText: '',
      avatarBase64: '',
      flyingBase64: '',
      sizeRank: 1,
      isActive: true,
    });
    setSpeciesModal('add');
  };

  const openEditSpecies = (spec: any) => {
    setEditingSpecies(spec);
    setSpeciesForm({
      speciesId: spec.speciesId,
      name: spec.name,
      subtitle: spec.subtitle || '',
      speedKmH: spec.speedKmH,
      priceGold: spec.priceGold,
      minLevel: spec.minLevel || 1,
      requirementText: spec.requirementText || '',
      avatarBase64: spec.avatarBase64 || '',
      flyingBase64: spec.flyingBase64 || '',
      sizeRank: spec.sizeRank || 1,
      isActive: spec.isActive !== false,
    });
    setSpeciesModal('edit');
  };

  const saveSpecies = async (e: React.FormEvent) => {
    e.preventDefault();
    setSpeciesSaving(true);
    try {
      const isEdit = speciesModal === 'edit';
      const url = '/api/admin/species';
      const method = isEdit ? 'PUT' : 'POST';
      const body = isEdit ? { ...speciesForm, _id: editingSpecies._id } : speciesForm;

      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...hdr() },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (r.ok) {
        toast$(isEdit ? `✓ ${speciesForm.name} módosítva` : `✓ ${speciesForm.name} hozzáadva`);
        setSpeciesModal(null);
        fetchSpecies();
      } else {
        toast$(`✗ ${data.error || 'Mentési hiba'}`);
      }
    } catch {
      toast$('✗ Hálózati hiba');
    } finally {
      setSpeciesSaving(false);
    }
  };

  const toggleSpeciesActive = async (speciesId: string, currentActive: boolean) => {
    const r = await fetch(`/api/admin/species?speciesId=${speciesId}`, { method: 'DELETE', headers: hdr() });
    if (r.ok) {
      toast$(`✓ Fajta ${currentActive ? 'inaktiválva' : 'aktiválva'}`);
      fetchSpecies();
    } else {
      toast$('✗ Módosítás sikertelen');
    }
  };

  const deleteSpeciesPermanent = async (speciesId: string, name: string) => {
    if (!confirm(`Véglegesen törlöd „${name}" fajtát? (Csak akkor törölhető, ha 0 felhasználó birtokolja)`)) return;
    const r = await fetch(`/api/admin/species?speciesId=${speciesId}&permanent=true`, { method: 'DELETE', headers: hdr() });
    const d = await r.json();
    if (r.ok) {
      toast$(`✓ ${name} véglegesen törölve`);
      fetchSpecies();
    } else {
      toast$(`✗ ${d.error || 'Törlés sikertelen'}`);
    }
  };

  const openAddWheelSlot = () => {
    setEditingWheelSlot(null);
    setWheelForm({
      slotId: `slot_${Date.now()}`,
      label: '',
      type: 'gold',
      amount: 50,
      weight: 10,
      color: '#f59e0b',
      rarity: 'common',
      isActive: true,
    });
    setWheelModal('add');
  };

  const openEditWheelSlot = (slot: any) => {
    setEditingWheelSlot(slot);
    setWheelForm({
      slotId: slot.slotId || '',
      label: slot.label || '',
      type: slot.type || 'gold',
      amount: slot.amount ?? 50,
      weight: slot.weight ?? 10,
      color: slot.color || '#f59e0b',
      rarity: slot.rarity || 'common',
      isActive: slot.isActive !== false,
    });
    setWheelModal('edit');
  };

  const saveWheelSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setWheelSaving(true);
    try {
      const payload: any = { ...wheelForm };
      if (editingWheelSlot?._id) payload._id = editingWheelSlot._id;
      const r = await fetch('/api/admin/wheel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...hdr() },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (r.ok) {
        toast$(`✓ ${d.message || 'Szerencsekerék szelet mentve!'}`);
        setWheelModal(null);
        fetchWheel();
      } else {
        toast$(`✗ ${d.error || 'Sikertelen mentés'}`);
      }
    } catch (err: any) {
      toast$(`✗ Hiba: ${err.message}`);
    } finally {
      setWheelSaving(false);
    }
  };

  const deleteWheelSlot = async (id: string, label: string) => {
    if (!confirm(`Biztosan törölni szeretnéd a(z) „${label}" nyereményt a szerencsekerékről?`)) return;
    const r = await fetch(`/api/admin/wheel?id=${id}`, { method: 'DELETE', headers: hdr() });
    const d = await r.json();
    if (r.ok) {
      toast$(`✓ ${label} törölve`);
      fetchWheel();
    } else {
      toast$(`✗ ${d.error || 'Sikertelen törlés'}`);
    }
  };

  const resetWheelDefaults = async () => {
    if (!confirm('Biztosan visszaállítod a szerencsekereket az alapértelmezett nyereményekre és esélyekre?')) return;
    const r = await fetch('/api/admin/wheel', { method: 'PUT', headers: hdr() });
    const d = await r.json();
    if (r.ok) {
      toast$(`✓ ${d.message || 'Alapértelmezett szerencsekerék visszaállítva!'}`);
      fetchWheel();
    } else {
      toast$(`✗ ${d.error || 'Sikertelen visszaállítás'}`);
    }
  };

  // Expedition City CRUD Handlers
  const openAddCity = () => {
    setEditingCity(null);
    setCityForm({
      cityId: '',
      name: '',
      country: '',
      lat: 47.4979,
      lng: 19.0402,
      description: '',
      icon: 'monument',
      minLevel: 1,
      rewardMultiplier: 1.0,
      cageDropChance: 5,
      stamps: [],
      isActive: true,
      order: cities.length + 1,
    });
    setStampInput({ code: '', name: '' });
    setCityModal('add');
  };

  const openEditCity = (c: any) => {
    setEditingCity(c);
    setCityForm({
      cityId: c.cityId || '',
      name: c.name || '',
      country: c.country || '',
      lat: c.lat ?? 47.4979,
      lng: c.lng ?? 19.0402,
      description: c.description || '',
      icon: c.icon || 'monument',
      minLevel: c.minLevel ?? 1,
      rewardMultiplier: c.rewardMultiplier ?? 1.0,
      cageDropChance: c.cageDropChance ?? 5,
      stamps: Array.isArray(c.stamps) ? [...c.stamps] : [],
      isActive: c.isActive !== false,
      order: c.order ?? 0,
    });
    setStampInput({ code: '', name: '' });
    setCityModal('edit');
  };

  const addStampToForm = () => {
    if (!stampInput.code.trim() || !stampInput.name.trim()) {
      toast$('✗ A bélyeg kódja és neve kötelező!');
      return;
    }
    const cleanCode = stampInput.code.trim().toUpperCase();
    const cleanName = stampInput.name.trim();
    const id = `stamp_${cleanCode.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    setCityForm(prev => ({
      ...prev,
      stamps: [...prev.stamps, { id, code: cleanCode, name: cleanName, country: prev.country || 'Ismeretlen' }],
    }));
    setStampInput({ code: '', name: '' });
  };

  const removeStampFromForm = (idx: number) => {
    setCityForm(prev => ({
      ...prev,
      stamps: prev.stamps.filter((_, i) => i !== idx),
    }));
  };

  const saveCity = async (e: React.FormEvent) => {
    e.preventDefault();
    setCitySaving(true);
    try {
      const payload: any = { ...cityForm };
      if (editingCity?._id) payload._id = editingCity._id;
      const r = await fetch('/api/admin/expeditions/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...hdr() },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (r.ok) {
        toast$(`✓ ${d.message || 'Expedíciós város mentve!'}`);
        setCityModal(null);
        fetchCities();
      } else {
        toast$(`✗ ${d.error || 'Sikertelen mentés'}`);
      }
    } catch (err: any) {
      toast$(`✗ Hiba: ${err.message}`);
    } finally {
      setCitySaving(false);
    }
  };

  const deleteCity = async (id: string, name: string) => {
    if (!confirm(`Biztosan törölni szeretnéd a(z) „${name}" várost az expedíciók közül?`)) return;
    const r = await fetch(`/api/admin/expeditions/cities?id=${id}`, { method: 'DELETE', headers: hdr() });
    const d = await r.json();
    if (r.ok) {
      toast$(`✓ ${name} törölve`);
      fetchCities();
    } else {
      toast$(`✗ ${d.error || 'Sikertelen törlés'}`);
    }
  };

  const resetCityDefaults = async () => {
    if (!confirm('Biztosan visszaállítod az expedíciós városokat és bélyegeiket az alapértelmezett világvárosokra?')) return;
    const r = await fetch('/api/admin/expeditions/cities', { method: 'PUT', headers: hdr() });
    const d = await r.json();
    if (r.ok) {
      toast$(`✓ ${d.message || 'Alapértelmezett városok visszaállítva!'}`);
      fetchCities();
    } else {
      toast$(`✗ ${d.error || 'Sikertelen visszaállítás'}`);
    }
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

  const openEditPigeon = (p: any) => {
    setEditingPigeon(p);
    setPigeonForm({
      name: p.name || '',
      level: p.level || 1,
      xp: p.xp || 0,
      speedKmH: p.speedKmH || 80,
      fatigue: p.fatigue || 0,
      status: p.status || 'idle',
      species: p.species || 'pigeon',
    });
  };

  const savePigeon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPigeon) return;
    setPigeonSaving(true);
    try {
      const r = await fetch('/api/admin/pigeons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...hdr() },
        body: JSON.stringify({
          pigeonId: editingPigeon._id,
          ...pigeonForm,
        }),
      });
      const d = await r.json();
      if (r.ok) {
        toast$(`✓ ${d.message || 'Galamb adatai sikeresen elmentve!'}`);
        setEditingPigeon(null);
        fetchPigeons();
        fetchStats();
      } else {
        toast$(`✗ ${d.error || 'Sikertelen mentés'}`);
      }
    } catch (err: any) {
      toast$(`✗ Hiba: ${err.message}`);
    } finally {
      setPigeonSaving(false);
    }
  };

  const deletePigeon = async (pid: string, name: string) => {
    if (!confirm(`Biztosan véglegesen törölni szeretnéd „${name}" galambot?`)) return;
    const r = await fetch(`/api/admin/pigeons?id=${pid}`, { method: 'DELETE', headers: hdr() });
    const d = await r.json();
    if (r.ok) {
      toast$(`✓ ${d.message || name + ' törölve'}`);
      fetchPigeons();
      fetchStats();
    } else {
      toast$(`✗ ${d.error || 'Sikertelen törlés'}`);
    }
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
    let list = pigeons;
    if (pigeonStatusFilter !== 'all') {
      if (pigeonStatusFilter === 'flying') {
        list = list.filter(p => p.status === 'flying' || p.status === 'returning');
      } else {
        list = list.filter(p => p.status === pigeonStatusFilter);
      }
    }
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.identifier?.toLowerCase().includes(q) ||
      p.species?.toLowerCase().includes(q) ||
      p.ownerId?.username?.toLowerCase().includes(q) ||
      p.ownerId?.email?.toLowerCase().includes(q)
    );
  }, [pigeons, search, pigeonStatusFilter]);

  const filteredSpecies = useMemo(() => {
    if (!search) return speciesList;
    const q = search.toLowerCase();
    return speciesList.filter(s => s.name?.toLowerCase().includes(q) || s.speciesId?.toLowerCase().includes(q) || s.subtitle?.toLowerCase().includes(q));
  }, [speciesList, search]);

  const sortToggle = (col: string) => { if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortBy(col); setSortDir('desc'); } };
  const SortI = ({ col }: { col: string }) => sortBy !== col ? <span style={{ color: '#374151', marginLeft: 3 }}>⇅</span> : <span style={{ color: C.purple, marginLeft: 3 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
  const toggleRow = (id: string) => { const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); setSelected(n); };

  const navItems: { id: Tab; label: string; Icon: () => React.ReactNode; badge?: number }[] = [
    { id: 'overview',  label: 'Áttekintés',     Icon: I.Chart,    badge: undefined },
    { id: 'users',     label: 'Felhasználók',   Icon: I.Users,    badge: stats?.stats?.activeUsers },
    { id: 'pigeons',   label: 'Galambok',       Icon: I.Pigeon,   badge: stats?.stats?.flyingPigeons },
    { id: 'species',     label: 'Madárfajták',    Icon: I.Feather,  badge: speciesList.length },
    { id: 'expeditions', label: 'Expedíciók',     Icon: I.Compass,  badge: cities.length },
    { id: 'wheel',       label: 'Szerencsekerék', Icon: I.Zap,      badge: wheelSlots.length },
    { id: 'messages',  label: 'Üzenetek',       Icon: I.Mail,     badge: msgs?.stats?.flyingMessages },
    { id: 'activity',  label: 'Aktivitás',      Icon: I.Activity, badge: undefined },
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
            {(tab === 'users' || tab === 'pigeons' || tab === 'species' || tab === 'expeditions' || tab === 'wheel') && (
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }}><I.Search /></div>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Keresés..."
                  style={{ padding: '7px 12px 7px 32px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, color: '#e2e8f0', fontSize: 13, outline: 'none', width: 210 }} />
              </div>
            )}
            {tab === 'species' && (
              <button onClick={openAddSpecies} style={{ ...btn('primary'), padding: '7px 14px', fontSize: 13, fontWeight: 700, marginLeft: 4 }}>
                <I.Plus />Új madárfajta
              </button>
            )}
            {tab === 'expeditions' && (
              <div style={{ display: 'flex', gap: 8, marginLeft: 4 }}>
                <button onClick={openAddCity} style={{ ...btn('primary'), padding: '7px 14px', fontSize: 13, fontWeight: 700 }}>
                  <I.Plus />Új Város
                </button>
                <button onClick={resetCityDefaults} style={{ ...btn('ghost'), padding: '7px 12px', fontSize: 12 }}>
                  <I.Refresh />Alapértelmezett Városok
                </button>
              </div>
            )}
            {tab === 'wheel' && (
              <div style={{ display: 'flex', gap: 8, marginLeft: 4 }}>
                <button onClick={openAddWheelSlot} style={{ ...btn('primary'), padding: '7px 14px', fontSize: 13, fontWeight: 700 }}>
                  <I.Plus />Új nyeremény
                </button>
                <button onClick={resetWheelDefaults} style={{ ...btn('ghost'), padding: '7px 12px', fontSize: 12 }}>
                  <I.Refresh />Alapértelmezett
                </button>
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
              <StatCard title="Összes madár" value={pigeons.length} Icon={I.Pigeon} color={C.purple} />
              <StatCard title="Repülés / Visszatérés" value={pigeons.filter(p => p.status === 'flying' || p.status === 'returning').length} Icon={I.Flight} color={C.blue} />
              <StatCard title="Pihenő dúcban" value={pigeons.filter(p => p.status === 'idle').length} Icon={I.Home} color={C.green} />
              <StatCard title="Elhullott" value={pigeons.filter(p => p.status === 'dead').length} Icon={I.Skull} color={C.red} />
            </div>

            <div style={{ background: 'rgba(15,21,36,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8' }}>🕊️ Postamadarak ({filteredPigeons.length} / {pigeons.length})</span>
                </div>
                {/* Status Filter Chips */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                  {[
                    { id: 'all', label: 'Mind' },
                    { id: 'flying', label: '✈️ Repül / Visszatér' },
                    { id: 'idle', label: '🏠 Dúcban' },
                    { id: 'resting', label: '⚡ Regenerál' },
                    { id: 'dead', label: '💀 Elhullott' },
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setPigeonStatusFilter(f.id as any)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 7,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: pigeonStatusFilter === f.id ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.04)',
                        color: pigeonStatusFilter === f.id ? '#818cf8' : '#94a3b8',
                        border: `1px solid ${pigeonStatusFilter === f.id ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'}`,
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 }}>
                  <thead>
                    <tr>
                      {['Madár & Szint', 'Azonosító', 'Tulajdonos', 'Állapot', 'Fáradtság', 'Sebesség', 'Faj', 'Műveletek'].map(h => <th key={h} style={th}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPigeons.map((p: any) => {
                      const canRecall = p.status === 'flying' || p.status === 'returning' || (p.fatigue && p.fatigue > 0);
                      return (
                        <tr key={p._id}>
                          <td style={td}>
                            <div>
                              <div style={{ fontWeight: 700, color: '#e2e8f0' }}>{p.name}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                                <span style={{ fontSize: 10, background: 'rgba(245,158,11,0.15)', color: '#fbbf24', padding: '1px 5px', borderRadius: 4, fontWeight: 700, border: '1px solid rgba(245,158,11,0.3)' }}>
                                  ⭐ {p.level || 1}. Szint
                                </span>
                                <span style={{ fontSize: 10, color: '#94a3b8' }}>
                                  {p.xp || 0} XP
                                </span>
                              </div>
                            </div>
                          </td>
                          <td style={{ ...td, fontFamily: 'monospace', fontSize: 11, color: '#94a3b8' }}>{p.identifier ?? '—'}</td>
                          <td style={td}>
                            {p.ownerId ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Avatar name={p.ownerId.username ?? '?'} />
                                <div>
                                  <div style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1' }}>{p.ownerId.username}</div>
                                  <div style={{ fontSize: 10, color: '#64748b' }}>{p.ownerId.email}</div>
                                </div>
                              </div>
                            ) : <span style={{ color: '#64748b' }}>Rendszer / Nincs</span>}
                          </td>
                          <td style={td}><StatusBadge status={p.status} /></td>
                          <td style={{ ...td, minWidth: 120 }}>
                            <ProgressBar value={p.fatigue ?? 0} color={p.fatigue > 70 ? C.red : p.fatigue > 40 ? C.yellow : C.green} />
                          </td>
                          <td style={{ ...td, fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>
                            ⚡ {p.speedKmH || 80} km/h
                          </td>
                          <td style={{ ...td, fontSize: 11, color: '#94a3b8' }}>
                            {p.species ?? 'pigeon'}
                          </td>
                          <td style={td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' as const }}>
                              {canRecall && (
                                <button
                                  style={{ ...btn('primary'), padding: '4px 9px', fontSize: 11 }}
                                  onClick={() => recallPigeon(p._id, p.name)}
                                  title="Azonnali hazahívás a dúcba és kipihentetés"
                                >
                                  <I.Home /> Hazahív
                                </button>
                              )}
                              <button
                                style={{ ...btn('ghost'), padding: '4px 9px', fontSize: 11 }}
                                onClick={() => openEditPigeon(p)}
                                title="Galamb adatainak szerkesztése"
                              >
                                <I.Edit /> Szerkeszt
                              </button>
                              <button
                                style={{ ...btn('danger'), padding: '4px 8px', fontSize: 11 }}
                                onClick={() => deletePigeon(p._id, p.name)}
                                title="Galamb végleges törlése"
                              >
                                <I.Trash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredPigeons.length === 0 && (
                      <tr>
                        <td colSpan={8} style={{ ...td, textAlign: 'center', color: '#64748b', padding: '36px 16px' }}>
                          {search ? `Nincs találat: "${search}"` : 'Nincsenek madarak'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>)}

          {/* ══ SPECIES ════════════════════════════════════════════════════ */}
          {tab === 'species' && (<>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 18 }}>
              <StatCard title="Összes madárfaj" value={speciesList.length} Icon={I.Feather} color={C.purple} />
              <StatCard title="Aktív fajták" value={speciesList.filter(s => s.isActive !== false).length} Icon={I.Check} color={C.green} />
              <StatCard title="Leggyorsabb" value={speciesList.length ? Math.max(...speciesList.map(s => s.speedKmH || 0)) + ' km/h' : '—'} Icon={I.Flight} color={C.blue} />
              <StatCard title="Legértékesebb" value={speciesList.length ? Math.max(...speciesList.map(s => s.priceGold || 0)).toLocaleString() + ' arany' : '—'} Icon={I.Gold} color={C.yellow} />
            </div>

            <div style={{ background: 'rgba(15,21,36,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8' }}>🪶 Elérhető madárfajták ({filteredSpecies.length})</span>
                <button onClick={openAddSpecies} style={{ ...btn('primary'), padding: '6px 14px', fontSize: 12, fontWeight: 700 }}>
                  <I.Plus />Új madárfajta hozzáadása
                </button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 }}>
                  <thead>
                    <tr>{['Képek','Fajta / Név','Sebesség','Ár (arany)','Követelmény','Raj Rang','Birtoklók','Állapot','Műveletek'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {filteredSpecies.map((s: any) => (
                      <tr key={s.speciesId} style={{ opacity: s.isActive === false ? 0.6 : 1 }}>
                        <td style={td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 38, height: 38, borderRadius: 10, background: '#1e293b', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                              {s.avatarBase64 ? (
                                <img src={s.avatarBase64} alt={s.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <span style={{ fontSize: 16 }}>🐦</span>
                              )}
                            </div>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(99,102,241,0.15)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(99,102,241,0.3)' }} title="Térkép repülő ikon">
                              {s.flyingBase64 ? (
                                <img src={s.flyingBase64} alt="fly" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                              ) : (
                                <span style={{ fontSize: 12, color: C.purple }}>✈️</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={td}>
                          <div style={{ fontWeight: 700, color: '#f1f5f9' }}>{s.name}</div>
                          <div style={{ fontSize: 11, fontFamily: 'monospace', color: C.purple }}>ID: {s.speciesId}</div>
                          {s.subtitle && <div style={{ fontSize: 11, color: '#64748b' }}>{s.subtitle}</div>}
                        </td>
                        <td style={td}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, color: C.blue, background: 'rgba(96,165,250,0.15)' }}>
                            <I.Flight />{s.speedKmH} km/h
                          </span>
                        </td>
                        <td style={td}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 800, color: s.priceGold > 0 ? '#f59e0b' : C.green, background: s.priceGold > 0 ? 'rgba(245,158,11,0.15)' : 'rgba(52,211,153,0.15)' }}>
                            <I.Gold />{s.priceGold > 0 ? `${s.priceGold.toLocaleString()} arany` : 'Ingyenes'}
                          </span>
                        </td>
                        <td style={td}>
                          <div style={{ fontSize: 12, color: '#cbd5e1' }}>{s.requirementText || `${s.minLevel || 1}. szint`}</div>
                          <span style={{ fontSize: 10, color: '#64748b' }}>Min. szint: {s.minLevel || 1}</span>
                        </td>
                        <td style={td}>
                          <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 700, color: '#a78bfa', background: 'rgba(167,139,250,0.15)' }}>
                            Rang {s.sizeRank || 1}
                          </span>
                        </td>
                        <td style={td}>
                          <div style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 600 }}>{s.ownersCount ?? 0} gazda</div>
                          <div style={{ fontSize: 10, color: '#64748b' }}>{s.activeCarriersCount ?? 0} aktív postás</div>
                        </td>
                        <td style={td}>
                          <button
                            onClick={() => toggleSpeciesActive(s.speciesId, s.isActive !== false)}
                            style={{
                              border: 'none',
                              background: s.isActive !== false ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                              color: s.isActive !== false ? C.green : C.red,
                              padding: '4px 10px',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            {s.isActive !== false ? '✓ Aktív' : '✕ Inaktív'}
                          </button>
                        </td>
                        <td style={td}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button style={btn('ghost')} onClick={() => openEditSpecies(s)} title="Szerkesztés">
                              <I.Edit /> Szerkeszt
                            </button>
                            <button
                              style={btn('danger')}
                              onClick={() => deleteSpeciesPermanent(s.speciesId, s.name)}
                              title={s.ownersCount > 0 ? 'Nem törölhető, mert van gazdája' : 'Végleges törlés'}
                              disabled={s.ownersCount > 0}
                            >
                              <I.Trash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredSpecies.length === 0 && (
                      <tr>
                        <td colSpan={9} style={{ ...td, textAlign: 'center', color: '#374151', padding: '36px 16px' }}>
                          {search ? `Nincs találat: "${search}"` : 'Nincs madárfajta feltöltve'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>)}

          {/* ══ EXPEDITIONS (EXPEDÍCIÓS VÁROSOK) ═══════════════════════════ */}
          {tab === 'expeditions' && (<>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 18 }}>
              <StatCard
                title="Aktív célvárosok"
                value={cities.filter(c => c.isActive !== false).length}
                Icon={I.Compass}
                color={C.purple}
                sub={`${cities.length} város elérhető`}
              />
              <StatCard
                title="Legnagyobb szorzó"
                value={cities.length > 0 ? `${Math.max(...cities.map(c => c.rewardMultiplier || 1.0), 1.0).toFixed(1)}x` : '1.0x'}
                Icon={I.Chart}
                color={C.yellow}
                sub="Kiemelt expedíciós zsákmány"
              />
              <StatCard
                title="Gyűjthető bélyegek"
                value={`${cities.reduce((acc, c) => acc + (c.stamps?.length || 0), 0)} db`}
                Icon={I.Stamp}
                color={C.blue}
                sub="1 db sorsolva küldetésenként"
              />
              <StatCard
                title="Max kalitka esély"
                value={cities.length > 0 ? `${Math.max(...cities.map(c => c.cageDropChance || 0), 0)}%` : '0%'}
                Icon={I.Gift}
                color={C.green}
                sub="Dúc kalitka bővítés találása"
              />
            </div>

            <div style={{ background: 'rgba(15,21,36,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8' }}>
                  🌍 Expedíciós Célvárosok & Bélyegek ({cities.length})
                </span>
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  A játékosok valós koordináták alapján kapnak aranyat, magot, XP-t és bélyeget
                </span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 }}>
                  <thead>
                    <tr>
                      {['Város & Ország', 'Koordináták', 'Min. Szint', 'Jutalomszorzó', 'Kalitka Esély', 'Megszerezhető Bélyegek', 'Állapot', 'Műveletek'].map(h => <th key={h} style={th}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {cities
                      .filter(c => !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.country?.toLowerCase().includes(search.toLowerCase()))
                      .map((c: any) => (
                        <tr key={c._id || c.cityId}>
                          <td style={td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 34, height: 34, borderRadius: 9,
                                background: 'rgba(99,102,241,0.15)',
                                border: '1px solid rgba(99,102,241,0.3)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 16,
                              }}>
                                {c.icon === 'castle' ? '🏰' : c.icon === 'oriental' ? '🕌' : c.icon === 'metropolis' ? '🗼' : '🏛️'}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, color: '#f1f5f9' }}>{c.name}</div>
                                <div style={{ fontSize: 11, color: '#64748b' }}>{c.country}</div>
                              </div>
                            </div>
                          </td>
                          <td style={td}>
                            <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#94a3b8' }}>
                              {Number(c.lat).toFixed(4)}, {Number(c.lng).toFixed(4)}
                            </span>
                          </td>
                          <td style={td}>
                            <span style={{
                              display: 'inline-block', padding: '2px 8px', borderRadius: 6,
                              background: 'rgba(99,102,241,0.15)', color: '#818cf8', fontWeight: 700, fontSize: 11,
                            }}>
                              Szint {c.minLevel || 1}+
                            </span>
                          </td>
                          <td style={td}>
                            <span style={{
                              display: 'inline-block', padding: '3px 8px', borderRadius: 6,
                              background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)',
                              color: '#fbbf24', fontWeight: 800, fontSize: 12,
                            }}>
                              {(c.rewardMultiplier || 1.0).toFixed(1)}x
                            </span>
                          </td>
                          <td style={td}>
                            <span style={{
                              display: 'inline-block', padding: '3px 8px', borderRadius: 6,
                              background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)',
                              color: '#34d399', fontWeight: 700, fontSize: 11,
                            }}>
                              🎁 {c.cageDropChance || 0}%
                            </span>
                          </td>
                          <td style={{ ...td, maxWidth: 280 }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {Array.isArray(c.stamps) && c.stamps.length > 0 ? (
                                c.stamps.map((st: any, idx: number) => (
                                  <span
                                    key={st.id || idx}
                                    title={st.name}
                                    style={{
                                      display: 'inline-flex', alignItems: 'center', gap: 4,
                                      padding: '2px 6px', borderRadius: 5,
                                      background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.25)',
                                      color: '#38bdf8', fontSize: 10, fontWeight: 600,
                                    }}
                                  >
                                    📮 {st.code} ({st.name})
                                  </span>
                                ))
                              ) : (
                                <span style={{ fontSize: 11, color: '#475569', fontStyle: 'italic' }}>Nincs bélyeg</span>
                              )}
                            </div>
                          </td>
                          <td style={td}>
                            <span style={{
                              display: 'inline-block', padding: '3px 8px', borderRadius: 6,
                              background: c.isActive !== false ? 'rgba(52,211,153,0.15)' : 'rgba(148,163,184,0.15)',
                              color: c.isActive !== false ? '#34d399' : '#94a3b8',
                              fontWeight: 700, fontSize: 11,
                            }}>
                              {c.isActive !== false ? 'Aktív' : 'Inaktív'}
                            </span>
                          </td>
                          <td style={td}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                style={btn('ghost')}
                                onClick={() => openEditCity(c)}
                                title="Város és bélyegek szerkesztése"
                              >
                                <I.Edit /> Szerkeszt
                              </button>
                              <button
                                style={btn('danger')}
                                onClick={() => deleteCity(c._id, c.name)}
                                title="Város törlése"
                              >
                                <I.Trash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    {cities.length === 0 && (
                      <tr>
                        <td colSpan={8} style={{ ...td, textAlign: 'center', color: '#64748b', padding: '36px 16px' }}>
                          Nincsenek expedíciós városok. Kattints a „+ Új Város" vagy „Alapértelmezett Városok" gombra!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>)}

          {/* ══ LUCKY WHEEL (SZERENCSEKERÉK) ═══════════════════════════ */}
          {tab === 'wheel' && (<>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 18 }}>
              <StatCard
                title="Aktív nyeremények"
                value={wheelSlots.filter(s => s.isActive !== false).length}
                Icon={I.Zap}
                color={C.purple}
                sub={`${wheelSlots.length} szelet összesen`}
              />
              <StatCard
                title="Összes esélysúly"
                value={wheelTotalWeight}
                Icon={I.Chart}
                color={C.blue}
                sub="100% eloszlás alapján"
              />
              <StatCard
                title="Max arany fődíj"
                value={Math.max(...wheelSlots.filter(s => s.type === 'gold').map(s => s.amount), 0).toLocaleString() + ' 🪙'}
                Icon={I.Gold}
                color={C.yellow}
                sub="Királyi kincs"
              />
              <StatCard
                title="Különleges tételek"
                value={wheelSlots.filter(s => ['epic', 'legendary', 'mythic'].includes(s.rarity)).length}
                Icon={I.Gift}
                color={C.green}
                sub="Epic / Legendás / Mythic"
              />
            </div>

            <div style={{ background: 'rgba(15,21,36,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8' }}>
                  🎡 Napi Pörgetőskerék Szeletei & Esélyei ({wheelSlots.length})
                </span>
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  A játékosok az appban ezt a kereket látják forogni és lelassulni
                </span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 }}>
                  <thead>
                    <tr>
                      {['Szelet & Szín', 'Típus', 'Jutalom Mennyiség', 'Ritkaság', 'Esélysúly', 'Nyerési Esély %', 'Állapot', 'Műveletek'].map(h => <th key={h} style={th}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {wheelSlots.map((slot: any) => {
                      const typeLabel = slot.type === 'gold' ? 'Arany' : slot.type === 'seeds' ? 'Madármag' : slot.type === 'cages' ? 'Kalitka' : 'Dúcmester XP';
                      const typeIcon = slot.type === 'gold' ? '🪙' : slot.type === 'seeds' ? '🌾' : slot.type === 'cages' ? '🎁' : '⭐';
                      const rarityColor = ({
                        common: '#94a3b8',
                        uncommon: '#10b981',
                        rare: '#38bdf8',
                        epic: '#a855f7',
                        legendary: '#f59e0b',
                        mythic: '#fbbf24',
                      } as any)[slot.rarity] || '#94a3b8';

                      return (
                        <tr key={slot._id || slot.slotId}>
                          <td style={td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 20, height: 20, borderRadius: 6,
                                background: slot.color || '#f59e0b',
                                border: '1.5px solid rgba(255,255,255,0.2)',
                                flexShrink: 0,
                              }} />
                              <div>
                                <div style={{ fontWeight: 700, color: '#f1f5f9' }}>{slot.label}</div>
                                <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>{slot.slotId}</div>
                              </div>
                            </div>
                          </td>
                          <td style={td}>
                            <span style={{ fontSize: 12, color: '#cbd5e1' }}>
                              {typeIcon} {typeLabel}
                            </span>
                          </td>
                          <td style={{ ...td, fontWeight: 700, color: slot.type === 'gold' ? C.yellow : C.green }}>
                            +{slot.amount}
                          </td>
                          <td style={td}>
                            <span style={{
                              display: 'inline-flex', padding: '2px 8px', borderRadius: 5,
                              fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                              color: rarityColor, background: `${rarityColor}1a`, border: `1px solid ${rarityColor}33`,
                            }}>
                              {slot.rarity}
                            </span>
                          </td>
                          <td style={{ ...td, fontWeight: 600, color: '#cbd5e1' }}>
                            {slot.weight} súly
                          </td>
                          <td style={{ ...td, minWidth: 140 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{
                                  height: '100%',
                                  width: `${Math.min(100, (slot.chancePercent || 0) * 2)}%`,
                                  background: slot.color || '#6366f1',
                                  borderRadius: 3,
                                }} />
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#f1f5f9', minWidth: 42 }}>
                                {slot.chancePercent ?? 0}%
                              </span>
                            </div>
                          </td>
                          <td style={td}>
                            <span style={{
                              display: 'inline-flex', padding: '2px 8px', borderRadius: 5,
                              fontSize: 10, fontWeight: 700,
                              color: slot.isActive !== false ? C.green : '#64748b',
                              background: slot.isActive !== false ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.05)',
                            }}>
                              {slot.isActive !== false ? 'Aktív' : 'Inaktív'}
                            </span>
                          </td>
                          <td style={td}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                style={{ ...btn('ghost'), padding: '4px 9px', fontSize: 11 }}
                                onClick={() => openEditWheelSlot(slot)}
                                title="Szelet szerkesztése"
                              >
                                <I.Edit /> Szerkeszt
                              </button>
                              <button
                                style={{ ...btn('danger'), padding: '4px 8px', fontSize: 11 }}
                                onClick={() => deleteWheelSlot(slot._id, slot.label)}
                                title="Szelet törlése"
                              >
                                <I.Trash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {wheelSlots.length === 0 && (
                      <tr>
                        <td colSpan={8} style={{ ...td, textAlign: 'center', color: '#64748b', padding: '36px 16px' }}>
                          Nincsenek beállított nyeremények. Kattints az „Alapértelmezett" gombra a visszaállításhoz!
                        </td>
                      </tr>
                    )}
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

      {/* ══ SPECIES ADD / EDIT MODAL ══════════════════════════════════ */}
      {speciesModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#0d1322', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', padding: 26, boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.2)', color: C.purple, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><I.Feather /></div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#f1f5f9' }}>
                  {speciesModal === 'edit' ? `Madárfajta szerkesztése: ${editingSpecies?.name}` : 'Új madárfajta hozzáadása'}
                </h3>
              </div>
              <button onClick={() => setSpeciesModal(null)} style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={saveSpecies}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.8px' }}>
                    Azonosító (speciesId) *
                  </label>
                  <input
                    required
                    disabled={speciesModal === 'edit'}
                    value={speciesForm.speciesId}
                    onChange={(e) => setSpeciesForm({ ...speciesForm, speciesId: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                    placeholder="pl. snowy_owl"
                    style={{ width: '100%', padding: '10px 12px', background: speciesModal === 'edit' ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, color: '#e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }}
                  />
                  <span style={{ fontSize: 10, color: '#475569' }}>Kisbetűk és aláhúzás, pl: raven, eagle</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.8px' }}>
                    Megjelenített név *
                  </label>
                  <input
                    required
                    value={speciesForm.name}
                    onChange={(e) => setSpeciesForm({ ...speciesForm, name: e.target.value })}
                    placeholder="pl. Hóbagoly"
                    style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, color: '#e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.8px' }}>
                  Alcím / Leírás
                </label>
                <input
                  value={speciesForm.subtitle}
                  onChange={(e) => setSpeciesForm({ ...speciesForm, subtitle: e.target.value })}
                  placeholder="pl. Északi sarkvidéki vadász és hírnök"
                  style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, color: '#e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.8px' }}>
                    Sebesség (km/h) *
                  </label>
                  <input
                    type="number"
                    required
                    min={10}
                    max={1000}
                    value={speciesForm.speedKmH}
                    onChange={(e) => setSpeciesForm({ ...speciesForm, speedKmH: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, color: '#e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.8px' }}>
                    Ár (Arany) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={speciesForm.priceGold}
                    onChange={(e) => setSpeciesForm({ ...speciesForm, priceGold: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, color: '#e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.8px' }}>
                    Min. Szint
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={speciesForm.minLevel}
                    onChange={(e) => setSpeciesForm({ ...speciesForm, minLevel: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, color: '#e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.8px' }}>
                    Feltétel leírás szöveg
                  </label>
                  <input
                    value={speciesForm.requirementText}
                    onChange={(e) => setSpeciesForm({ ...speciesForm, requirementText: e.target.value })}
                    placeholder="pl. 2,500 arany · 2. szint"
                    style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, color: '#e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.8px' }}>
                    Raj-Rang (1-10)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={speciesForm.sizeRank}
                    onChange={(e) => setSpeciesForm({ ...speciesForm, sizeRank: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, color: '#e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }}
                  />
                </div>
              </div>

              {/* IMAGE UPLOAD SECTION */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 16, marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#cbd5e1', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <I.Upload /> Képek feltöltése (Kliensoldali Base64 tömörítéssel)
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {/* Avatar Upload */}
                  <div style={{ border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 12, padding: 14, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>PROFILKÉP (AVATAR)</div>
                    <div style={{ width: 80, height: 80, borderRadius: 16, background: '#161924', margin: '0 auto 10px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {speciesForm.avatarBase64 ? (
                        <img src={speciesForm.avatarBase64} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: 28 }}>🐦</span>
                      )}
                    </div>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(99,102,241,0.15)', color: C.purple, borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                      Fájl kiválasztása
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'avatarBase64')} style={{ display: 'none' }} />
                    </label>
                    {speciesForm.avatarBase64 && (
                      <button type="button" onClick={() => setSpeciesForm({ ...speciesForm, avatarBase64: '' })} style={{ display: 'block', margin: '6px auto 0', background: 'none', border: 'none', color: C.red, fontSize: 11, cursor: 'pointer' }}>
                        Törlés
                      </button>
                    )}
                  </div>

                  {/* Flying Upload */}
                  <div style={{ border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 12, padding: 14, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>REPÜLŐ KÉP (TÉRKÉP IKON)</div>
                    <div style={{ width: 80, height: 80, borderRadius: 16, background: 'rgba(99,102,241,0.1)', margin: '0 auto 10px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(99,102,241,0.3)' }}>
                      {speciesForm.flyingBase64 ? (
                        <img src={speciesForm.flyingBase64} alt="Flying" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <span style={{ fontSize: 24, color: C.purple }}>✈️</span>
                      )}
                    </div>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(99,102,241,0.15)', color: C.purple, borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                      Fájl kiválasztása
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'flyingBase64')} style={{ display: 'none' }} />
                    </label>
                    {speciesForm.flyingBase64 && (
                      <button type="button" onClick={() => setSpeciesForm({ ...speciesForm, flyingBase64: '' })} style={{ display: 'block', margin: '6px auto 0', background: 'none', border: 'none', color: C.red, fontSize: 11, cursor: 'pointer' }}>
                        Törlés
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#cbd5e1' }}>
                  <input
                    type="checkbox"
                    checked={speciesForm.isActive}
                    onChange={(e) => setSpeciesForm({ ...speciesForm, isActive: e.target.checked })}
                  />
                  Azonnal aktív és elérhető a dúcban
                </label>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" onClick={() => setSpeciesModal(null)} style={{ ...btn('ghost'), padding: '9px 16px', fontSize: 13 }}>
                    Mégse
                  </button>
                  <button type="submit" disabled={speciesSaving} style={{ ...btn('primary'), padding: '9px 20px', fontSize: 13, fontWeight: 700 }}>
                    {speciesSaving ? 'Mentés...' : 'Fajta mentése'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ PIGEON EDIT MODAL ══════════════════════════════════════════ */}
      {editingPigeon && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)',
          backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 9999, padding: 20,
        }}>
          <div style={{
            background: '#0e1322', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '90vh',
            overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.85)',
          }}>
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#f8fafc' }}>
                  🕊️ Madár adatainak szerkesztése
                </h3>
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  {editingPigeon.identifier} · Tulajdonos: {editingPigeon.ownerId?.username || '—'} ({editingPigeon.ownerId?.email || '—'})
                </span>
              </div>
              <button
                onClick={() => setEditingPigeon(null)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: 20, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={savePigeon} style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 5 }}>
                    Madár Neve
                  </label>
                  <input
                    type="text"
                    required
                    value={pigeonForm.name}
                    onChange={e => setPigeonForm(prev => ({ ...prev, name: e.target.value }))}
                    style={{
                      width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                      color: '#f1f5f9', fontSize: 13, outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 5 }}>
                    Szint (Level)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={pigeonForm.level}
                    onChange={e => setPigeonForm(prev => ({ ...prev, level: +e.target.value }))}
                    style={{
                      width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                      color: '#f1f5f9', fontSize: 13, outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 5 }}>
                    Tapasztalat (XP)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={pigeonForm.xp}
                    onChange={e => setPigeonForm(prev => ({ ...prev, xp: +e.target.value }))}
                    style={{
                      width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                      color: '#f1f5f9', fontSize: 13, outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 5 }}>
                    Sebesség (km/h)
                  </label>
                  <input
                    type="number"
                    min={10}
                    value={pigeonForm.speedKmH}
                    onChange={e => setPigeonForm(prev => ({ ...prev, speedKmH: +e.target.value }))}
                    style={{
                      width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                      color: '#f1f5f9', fontSize: 13, outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 5 }}>
                    Fáradtság (%: 0=kipihent)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={pigeonForm.fatigue}
                    onChange={e => setPigeonForm(prev => ({ ...prev, fatigue: +e.target.value }))}
                    style={{
                      width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                      color: '#f1f5f9', fontSize: 13, outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 5 }}>
                    Állapot (Status)
                  </label>
                  <select
                    value={pigeonForm.status}
                    onChange={e => setPigeonForm(prev => ({ ...prev, status: e.target.value }))}
                    style={{
                      width: '100%', padding: '9px 12px', background: '#161d30',
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                      color: '#f1f5f9', fontSize: 13, outline: 'none', boxSizing: 'border-box',
                    }}
                  >
                    <option value="idle">🏠 Pihen a dúcban (idle)</option>
                    <option value="flying">✈️ Repül levéllel (flying)</option>
                    <option value="returning">↩️ Hazafelé siet (returning)</option>
                    <option value="resting">⚡ Regenerálódik (resting)</option>
                    <option value="dead">💀 Elhullott (dead)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 5 }}>
                    Fajta (Species)
                  </label>
                  <select
                    value={pigeonForm.species}
                    onChange={e => setPigeonForm(prev => ({ ...prev, species: e.target.value }))}
                    style={{
                      width: '100%', padding: '9px 12px', background: '#161d30',
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                      color: '#f1f5f9', fontSize: 13, outline: 'none', boxSizing: 'border-box',
                    }}
                  >
                    {speciesList && speciesList.length > 0 ? (
                      speciesList.map((s: any) => (
                        <option key={s.speciesId} value={s.speciesId}>
                          {s.name} ({s.speciesId})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="pigeon">Városi Postagalamb (pigeon)</option>
                        <option value="starling">Seregély (starling)</option>
                        <option value="raven">Holló (raven)</option>
                        <option value="barn_owl">Gyöngybagoly (barn_owl)</option>
                        <option value="golden_eagle">Szirti Sas (golden_eagle)</option>
                        <option value="peregrine">Vándorsólyom (peregrine)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Quick Action in Modal */}
              <div style={{
                marginTop: 16, padding: '12px', background: 'rgba(255,255,255,0.03)',
                borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>
                  Gyorsművelet:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    recallPigeon(editingPigeon._id, editingPigeon.name);
                    setEditingPigeon(null);
                  }}
                  style={{ ...btn('primary'), fontSize: 11, padding: '5px 10px' }}
                >
                  <I.Home /> Azonnali Hazahívás & Kipihentetés
                </button>
              </div>

              <div style={{
                marginTop: 20, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', justifyContent: 'flex-end', gap: 10,
              }}>
                <button
                  type="button"
                  onClick={() => setEditingPigeon(null)}
                  style={{ ...btn('ghost'), padding: '8px 14px' }}
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  disabled={pigeonSaving}
                  style={{ ...btn('success'), padding: '8px 18px', fontWeight: 700 }}
                >
                  {pigeonSaving ? 'Mentés...' : '✓ Módosítások Mentése'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ WHEEL SLOT ADD / EDIT MODAL ══════════════════════════════════ */}
      {wheelModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)',
          backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 9999, padding: 20,
        }}>
          <div style={{
            background: '#0e1322', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 16, width: '100%', maxWidth: 480, maxHeight: '90vh',
            overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.85)',
          }}>
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#f8fafc' }}>
                  {wheelModal === 'edit' ? '🎡 Szelet szerkesztése' : '🎡 Új nyeremény hozzáadása'}
                </h3>
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  Állítsd be a pörgetőkerék nyereményét, színét és nyerési esélysúlyát
                </span>
              </div>
              <button
                onClick={() => setWheelModal(null)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: 20, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={saveWheelSlot} style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 5 }}>
                    Megjelenő Név / Címke (pl. 100 Arany)
                  </label>
                  <input
                    type="text"
                    required
                    value={wheelForm.label}
                    onChange={e => setWheelForm(prev => ({ ...prev, label: e.target.value }))}
                    style={{
                      width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                      color: '#f1f5f9', fontSize: 13, outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 5 }}>
                    Jutalom Típusa
                  </label>
                  <select
                    value={wheelForm.type}
                    onChange={e => setWheelForm(prev => ({ ...prev, type: e.target.value as any }))}
                    style={{
                      width: '100%', padding: '9px 12px', background: '#161d30',
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                      color: '#f1f5f9', fontSize: 13, outline: 'none', boxSizing: 'border-box',
                    }}
                  >
                    <option value="gold">🪙 Arany</option>
                    <option value="seeds">🌾 Madármag</option>
                    <option value="cages">🎁 Kalitka</option>
                    <option value="xp">⭐ Dúcmester XP</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 5 }}>
                    Mennyiség
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={wheelForm.amount}
                    onChange={e => setWheelForm(prev => ({ ...prev, amount: +e.target.value }))}
                    style={{
                      width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                      color: '#f1f5f9', fontSize: 13, outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 5 }}>
                    Esélysúly (Weight)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min={0.1}
                    required
                    value={wheelForm.weight}
                    onChange={e => setWheelForm(prev => ({ ...prev, weight: +e.target.value }))}
                    style={{
                      width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                      color: '#f1f5f9', fontSize: 13, outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                  <span style={{ fontSize: 10, color: '#64748b' }}>Nagyobb súly = gyakoribb esély</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 5 }}>
                    Ritkaság
                  </label>
                  <select
                    value={wheelForm.rarity}
                    onChange={e => setWheelForm(prev => ({ ...prev, rarity: e.target.value as any }))}
                    style={{
                      width: '100%', padding: '9px 12px', background: '#161d30',
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                      color: '#f1f5f9', fontSize: 13, outline: 'none', boxSizing: 'border-box',
                    }}
                  >
                    <option value="common">Common (Gyakori)</option>
                    <option value="uncommon">Uncommon (Nem mindennapi)</option>
                    <option value="rare">Rare (Ritka)</option>
                    <option value="epic">Epic (Epikus)</option>
                    <option value="legendary">Legendary (Legendás)</option>
                    <option value="mythic">Mythic (Mitikus / Fődíj)</option>
                  </select>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 5 }}>
                    Szelet Színe a Keréken
                  </label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="color"
                      value={wheelForm.color}
                      onChange={e => setWheelForm(prev => ({ ...prev, color: e.target.value }))}
                      style={{
                        width: 44, height: 38, padding: 0, border: 'none', borderRadius: 8,
                        background: 'transparent', cursor: 'pointer',
                      }}
                    />
                    <input
                      type="text"
                      value={wheelForm.color}
                      onChange={e => setWheelForm(prev => ({ ...prev, color: e.target.value }))}
                      style={{
                        flex: 1, padding: '9px 12px', background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                        color: '#f1f5f9', fontSize: 13, outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#cbd5e1' }}>
                    <input
                      type="checkbox"
                      checked={wheelForm.isActive}
                      onChange={e => setWheelForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    />
                    Aktív tétel a szerencsekeréken
                  </label>
                </div>
              </div>

              <div style={{
                marginTop: 20, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', justifyContent: 'flex-end', gap: 10,
              }}>
                <button
                  type="button"
                  onClick={() => setWheelModal(null)}
                  style={{ ...btn('ghost'), padding: '8px 14px' }}
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  disabled={wheelSaving}
                  style={{ ...btn('primary'), padding: '8px 18px', fontWeight: 700 }}
                >
                  {wheelSaving ? 'Mentés...' : 'Nyeremény mentése'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ EXPEDITION CITY ADD / EDIT MODAL ══════════════════════ */}
      {cityModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20,
        }}>
          <div style={{
            background: '#0e1320', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16,
            width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          }}>
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>
                {cityModal === 'add' ? '🌍 Új Expedíciós Város Létrehozása' : `🌍 Város Szerkesztése: ${cityForm.name}`}
              </h3>
              <button
                type="button"
                onClick={() => setCityModal(null)}
                style={{ ...btn('ghost'), padding: '4px 8px', fontSize: 16 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={saveCity} style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 5 }}>
                    Város Neve *
                  </label>
                  <input
                    type="text"
                    required
                    value={cityForm.name}
                    onChange={e => setCityForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="pl. Róma"
                    style={{
                      width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                      color: '#f1f5f9', fontSize: 13, outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 5 }}>
                    Ország *
                  </label>
                  <input
                    type="text"
                    required
                    value={cityForm.country}
                    onChange={e => setCityForm(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="pl. Olaszország"
                    style={{
                      width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                      color: '#f1f5f9', fontSize: 13, outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 5 }}>
                    Szélességi fok (Latitude) *
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={cityForm.lat}
                    onChange={e => setCityForm(prev => ({ ...prev, lat: parseFloat(e.target.value) || 0 }))}
                    placeholder="41.9028"
                    style={{
                      width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                      color: '#f1f5f9', fontSize: 13, outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 5 }}>
                    Hosszúsági fok (Longitude) *
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={cityForm.lng}
                    onChange={e => setCityForm(prev => ({ ...prev, lng: parseFloat(e.target.value) || 0 }))}
                    placeholder="12.4964"
                    style={{
                      width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                      color: '#f1f5f9', fontSize: 13, outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 5 }}>
                    Hangulatos Leírás
                  </label>
                  <textarea
                    rows={2}
                    value={cityForm.description}
                    onChange={e => setCityForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Rövid hangulatos leírás a városról az expedíciós kártyán..."
                    style={{
                      width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                      color: '#f1f5f9', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 5 }}>
                    Jutalomszorzó (Multiplier)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="10"
                    value={cityForm.rewardMultiplier}
                    onChange={e => setCityForm(prev => ({ ...prev, rewardMultiplier: parseFloat(e.target.value) || 1.0 }))}
                    style={{
                      width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                      color: '#fbbf24', fontWeight: 700, fontSize: 13, outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                  <span style={{ fontSize: 10, color: '#64748b' }}>Pl. 1.5x = +50% arany és XP</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 5 }}>
                    Kalitka (Dúcbővítés) Esély %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={cityForm.cageDropChance}
                    onChange={e => setCityForm(prev => ({ ...prev, cageDropChance: parseInt(e.target.value, 10) || 0 }))}
                    style={{
                      width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                      color: '#34d399', fontWeight: 700, fontSize: 13, outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                  <span style={{ fontSize: 10, color: '#64748b' }}>0 - 100% esély kalitka találására</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 5 }}>
                    Szükséges Dúcmester Szint
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={cityForm.minLevel}
                    onChange={e => setCityForm(prev => ({ ...prev, minLevel: parseInt(e.target.value, 10) || 1 }))}
                    style={{
                      width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                      color: '#818cf8', fontWeight: 700, fontSize: 13, outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 5 }}>
                    Ikon / Téma
                  </label>
                  <select
                    value={cityForm.icon}
                    onChange={e => setCityForm(prev => ({ ...prev, icon: e.target.value }))}
                    style={{
                      width: '100%', padding: '9px 12px', background: '#161d30',
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                      color: '#f1f5f9', fontSize: 13, outline: 'none', boxSizing: 'border-box',
                    }}
                  >
                    <option value="monument">🏛️ Emlékmű / Dóm</option>
                    <option value="castle">🏰 Várkastély</option>
                    <option value="metropolis">🗼 Világváros / Torony</option>
                    <option value="oriental">🕌 Keleti Palota</option>
                    <option value="coast">🌊 Tengerparti Kikötő</option>
                    <option value="mountain">🏔️ Hegyvidék</option>
                  </select>
                </div>

                {/* STAMPS SECTION */}
                <div style={{
                  gridColumn: 'span 2', background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: 14,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <I.Stamp /> Megszerezhető Bélyegek ebben a városban ({cityForm.stamps.length} db)
                  </div>
                  <p style={{ margin: '0 0 10px', fontSize: 11, color: '#64748b' }}>
                    Több bélyeg is beállítható. A madár minden sikeres expedíció után 1 db-ot sorsol és hoz haza a játékosnak!
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    {cityForm.stamps.map((st, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px',
                          background: 'rgba(56,189,248,0.14)', border: '1px solid rgba(56,189,248,0.3)',
                          borderRadius: 8, fontSize: 12, color: '#f1f5f9',
                        }}
                      >
                        <span style={{ fontWeight: 800, color: '#38bdf8' }}>{st.code}</span>
                        <span>{st.name}</span>
                        <button
                          type="button"
                          onClick={() => removeStampFromForm(idx)}
                          style={{
                            background: 'transparent', border: 'none', color: '#f87171',
                            cursor: 'pointer', padding: 0, fontWeight: 800, fontSize: 14,
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {cityForm.stamps.length === 0 && (
                      <span style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>
                        Még nincs bélyeg felvéve. Adj hozzá legalább egyet!
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      placeholder="Kód (pl. IT-ROM03)"
                      value={stampInput.code}
                      onChange={e => setStampInput(prev => ({ ...prev, code: e.target.value }))}
                      style={{
                        width: 140, padding: '7px 10px', background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7,
                        color: '#f1f5f9', fontSize: 12, outline: 'none',
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Bélyeg Neve (pl. Trevi-kút Bélyeg)"
                      value={stampInput.name}
                      onChange={e => setStampInput(prev => ({ ...prev, name: e.target.value }))}
                      style={{
                        flex: 1, padding: '7px 10px', background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7,
                        color: '#f1f5f9', fontSize: 12, outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={addStampToForm}
                      style={{ ...btn('primary'), padding: '7px 14px', fontSize: 12, fontWeight: 700 }}
                    >
                      + Hozzáadás
                    </button>
                  </div>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#cbd5e1' }}>
                    <input
                      type="checkbox"
                      checked={cityForm.isActive}
                      onChange={e => setCityForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    />
                    Aktív expedíciós célváros a játékosok számára
                  </label>
                </div>
              </div>

              <div style={{
                marginTop: 20, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', justifyContent: 'flex-end', gap: 10,
              }}>
                <button
                  type="button"
                  onClick={() => setCityModal(null)}
                  style={{ ...btn('ghost'), padding: '8px 14px' }}
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  disabled={citySaving}
                  style={{ ...btn('primary'), padding: '8px 18px', fontWeight: 700 }}
                >
                  {citySaving ? 'Mentés...' : 'Város mentése'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

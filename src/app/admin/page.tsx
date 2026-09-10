"use client";

import { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [secret, setSecret] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentTab, setCurrentTab] = useState('overview'); // overview, users, flights
  
  const [statsData, setStatsData] = useState<any>(null);
  const [usersData, setUsersData] = useState<any[]>([]);
  const [flightsData, setFlightsData] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${secret}` }
      });

      if (!res.ok) throw new Error('Invalid secret');
      
      const result = await res.json();
      setStatsData(result);
      setIsAuthenticated(true);
    } catch (err) {
      setError('Authentication failed. Check your secret.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${secret}` }});
    if (res.ok) setUsersData(await res.json());
  };

  const fetchFlights = async () => {
    const res = await fetch('/api/admin/flights', { headers: { 'Authorization': `Bearer ${secret}` }});
    if (res.ok) setFlightsData(await res.json());
  };

  useEffect(() => {
    if (isAuthenticated) {
      if (currentTab === 'users') fetchUsers();
      if (currentTab === 'flights') fetchFlights();
      // Overview stats are fetched on login, could add refresh here
    }
  }, [currentTab, isAuthenticated]);

  const handleGiveSeeds = async (userId: string) => {
    const amount = prompt('How many seeds to give?');
    if (!amount || isNaN(Number(amount))) return;
    
    await fetch('/api/admin/users/seeds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${secret}` },
      body: JSON.stringify({ userId, amount: Number(amount) })
    });
    fetchUsers();
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to soft-delete this user?')) return;
    await fetch(`/api/admin/users?id=${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${secret}` }
    });
    fetchUsers();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f4ebd8] flex items-center justify-center font-sans text-[#2c241b]">
        <div className="w-full max-w-md bg-[#fdfbf7] p-8 rounded-2xl shadow-xl border border-[#e3d5b8]">
          <h1 className="text-3xl font-serif mb-6 text-center tracking-widest">PigeonPost Admin</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Admin Secret</label>
              <input 
                type="password" 
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                className="w-full px-4 py-2 border border-[#e3d5b8] rounded bg-[#f4ebd8] focus:outline-none focus:ring-2 focus:ring-[#9b2c2c]"
                placeholder="Enter secret..."
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="w-full py-2 bg-[#9b2c2c] text-white rounded font-medium hover:bg-[#742a2a] transition-colors">
              {loading ? 'Authenticating...' : 'Enter Dashboard'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans text-[#2c241b] flex bg-[#f4ebd8]">
      {/* Sidebar */}
      <div className="w-64 bg-[#2c241b] text-[#fdfbf7] flex flex-col shadow-2xl relative z-10">
        <div className="p-6 border-b border-[#4a3f32]">
          <h1 className="font-serif text-2xl tracking-wider text-center">PigeonPost</h1>
          <p className="text-xs text-center text-[#e3d5b8] mt-1">Admin Panel</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setCurrentTab('overview')} 
            className={`w-full text-left py-3 px-4 rounded-lg font-medium transition-colors ${currentTab === 'overview' ? 'bg-[#9b2c2c] text-white' : 'hover:bg-[#4a3f32] text-[#e3d5b8]'}`}
          >Overview</button>
          <button 
            onClick={() => setCurrentTab('users')} 
            className={`w-full text-left py-3 px-4 rounded-lg font-medium transition-colors ${currentTab === 'users' ? 'bg-[#9b2c2c] text-white' : 'hover:bg-[#4a3f32] text-[#e3d5b8]'}`}
          >Users</button>
          <button 
            onClick={() => setCurrentTab('flights')} 
            className={`w-full text-left py-3 px-4 rounded-lg font-medium transition-colors ${currentTab === 'flights' ? 'bg-[#9b2c2c] text-white' : 'hover:bg-[#4a3f32] text-[#e3d5b8]'}`}
          >Active Flights</button>
        </nav>
        <div className="p-4 border-t border-[#4a3f32]">
          <button onClick={() => setIsAuthenticated(false)} className="w-full py-2 border border-[#e3d5b8] rounded text-sm hover:bg-[#4a3f32] transition-colors">Log Out</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-[#fdfbf7] border-b border-[#e3d5b8] flex items-center justify-between px-8">
          <h2 className="font-serif text-xl font-bold">
            {currentTab === 'overview' && 'Realm Overview'}
            {currentTab === 'users' && 'Manage Users'}
            {currentTab === 'flights' && 'Monitor Active Flights'}
          </h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium">Server Time: <span className="font-mono bg-[#f4ebd8] px-2 py-1 rounded border border-[#e3d5b8]">{statsData?.serverTime}</span></span>
            <div className="w-8 h-8 bg-[#9b2c2c] rounded-full flex items-center justify-center text-white text-xs font-bold">A</div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-[#f4ebd8]/30">
          
          {currentTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Active Users" value={statsData?.stats.activeUsers.toLocaleString()} icon="👥" />
                <StatCard title="Flying Pigeons" value={statsData?.stats.flyingPigeons.toLocaleString()} icon="🕊️" />
                <StatCard title="Dead Pigeons (24h)" value={statsData?.stats.deadPigeons.toLocaleString()} icon="☠️" textColor="text-red-700" />
                <StatCard title="Seed Economy" value={statsData?.stats.seedEconomy.toLocaleString()} icon="🌾" />
              </div>
              <div className="bg-[#fdfbf7] rounded-xl border border-[#e3d5b8] shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-[#e3d5b8] bg-[#f4ebd8]">
                  <h3 className="font-serif font-bold text-lg">Recent System Logs</h3>
                </div>
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#e3d5b8]/50">
                    <tr>
                      <th className="px-6 py-3 font-medium text-[#4a3f32]">Timestamp</th>
                      <th className="px-6 py-3 font-medium text-[#4a3f32]">Level</th>
                      <th className="px-6 py-3 font-medium text-[#4a3f32]">Message</th>
                      <th className="px-6 py-3 font-medium text-[#4a3f32]">Context</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e3d5b8]">
                    {statsData?.logs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-[#f4ebd8]/50">
                        <td className="px-6 py-4 font-mono text-xs">{log.timestamp}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${log.level === 'error' ? 'bg-red-100 text-red-800' : log.level === 'warn' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>{log.level.toUpperCase()}</span>
                        </td>
                        <td className="px-6 py-4">{log.message}</td>
                        <td className="px-6 py-4 text-[#4a3f32] font-mono text-xs">{log.context}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {currentTab === 'users' && (
            <div className="bg-[#fdfbf7] rounded-xl border border-[#e3d5b8] shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#e3d5b8]/50">
                  <tr>
                    <th className="px-6 py-3 font-medium text-[#4a3f32]">Username</th>
                    <th className="px-6 py-3 font-medium text-[#4a3f32]">Email</th>
                    <th className="px-6 py-3 font-medium text-[#4a3f32]">Lvl</th>
                    <th className="px-6 py-3 font-medium text-[#4a3f32]">Seeds</th>
                    <th className="px-6 py-3 font-medium text-[#4a3f32]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e3d5b8]">
                  {usersData.map((user: any) => (
                    <tr key={user._id} className="hover:bg-[#f4ebd8]/50">
                      <td className="px-6 py-4 font-bold">{user.username}</td>
                      <td className="px-6 py-4 text-gray-500">{user.email}</td>
                      <td className="px-6 py-4">{user.level}</td>
                      <td className="px-6 py-4">{user.inventory.seeds}</td>
                      <td className="px-6 py-4 space-x-2">
                        <button onClick={() => handleGiveSeeds(user._id)} className="px-3 py-1 bg-green-100 text-green-800 rounded font-medium text-xs">Give Seeds</button>
                        <button onClick={() => handleDeleteUser(user._id)} className="px-3 py-1 bg-red-100 text-red-800 rounded font-medium text-xs">Ban</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {currentTab === 'flights' && (
            <div className="bg-[#fdfbf7] rounded-xl border border-[#e3d5b8] shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#e3d5b8]/50">
                  <tr>
                    <th className="px-6 py-3 font-medium text-[#4a3f32]">Pigeon</th>
                    <th className="px-6 py-3 font-medium text-[#4a3f32]">Owner</th>
                    <th className="px-6 py-3 font-medium text-[#4a3f32]">Fatigue</th>
                    <th className="px-6 py-3 font-medium text-[#4a3f32]">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e3d5b8]">
                  {flightsData.map((flight: any) => (
                    <tr key={flight._id} className="hover:bg-[#f4ebd8]/50">
                      <td className="px-6 py-4 font-bold">{flight.name} <span className="text-gray-500 text-xs">{flight.identifier}</span></td>
                      <td className="px-6 py-4">{flight.ownerId?.username || 'Unknown'}</td>
                      <td className="px-6 py-4">{flight.fatigue}%</td>
                      <td className="px-6 py-4 text-xs font-mono">{new Date(flight.updatedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, textColor = "text-[#2c241b]" }: { title: string, value: string | number, icon: string, textColor?: string }) {
  return (
    <div className="bg-[#fdfbf7] p-6 rounded-xl border border-[#e3d5b8] shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[#4a3f32] uppercase tracking-wider">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className={`text-3xl font-serif font-bold ${textColor}`}>{value}</div>
    </div>
  );
}

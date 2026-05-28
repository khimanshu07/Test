import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import type { DataSource } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  Radio, 
  ToggleLeft, 
  ToggleRight, 
  Users, 
  UserCheck, 
  ShieldAlert, 
  UserX,
  RefreshCw,
  Clock,
  CheckCircle2,
  Crown,
  Database,
  ChevronDown
} from 'lucide-react';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  organization_name?: string;
}

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  ADMIN:       { label: 'Admin',       color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20' },
  ANALYST:     { label: 'Analyst',     color: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/20' },
  CLIENT_USER: { label: 'Client User', color: 'text-sky-400',     bg: 'bg-sky-500/10',     border: 'border-sky-500/20' },
};

function UserAvatar({ email, isActive }: { email: string; isActive: boolean }) {
  const initials = email.slice(0, 2).toUpperCase();
  return (
    <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm flex-shrink-0 ${
      isActive ? 'bg-gradient-to-br from-brand-600 to-brand-700 text-white' : 'bg-slate-800 text-slate-400'
    }`}>
      {initials}
      <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
        isActive ? 'bg-emerald-400' : 'bg-slate-600'
      }`} />
    </div>
  );
}

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const [sources, setSources] = useState<DataSource[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingSources, setLoadingSources] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchSources = () => {
    setLoadingSources(true);
    api.get<DataSource[]>('/sources/')
      .then(res => { setSources(res); setLoadingSources(false); })
      .catch(() => setLoadingSources(false));
  };

  const fetchUsers = () => {
    setLoadingUsers(true);
    api.get<UserProfile[]>('/users/')
      .then(res => { setUsers(res); setLoadingUsers(false); })
      .catch(() => { setError('Could not retrieve user directory.'); setLoadingUsers(false); });
  };

  useEffect(() => { fetchSources(); fetchUsers(); }, []);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleApprove = async (userId: string, currentRole: string) => {
    setActionLoading(userId); setError(null);
    try {
      await api.post(`/users/${userId}/approve/`, { role: currentRole });
      showSuccess('User approved and activated successfully.');
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to approve user.');
    } finally { setActionLoading(null); }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setActionLoading(userId); setError(null);
    try {
      await api.patch(`/users/${userId}/`, { role: newRole });
      showSuccess('User role updated.');
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to update user role.');
    } finally { setActionLoading(null); }
  };

  const handleDeactivate = async (userId: string) => {
    setActionLoading(userId); setError(null);
    try {
      await api.patch(`/users/${userId}/`, { is_active: false });
      showSuccess('User deactivated.');
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to deactivate user.');
    } finally { setActionLoading(null); }
  };

  const activeUsers   = users.filter(u => u.is_active);
  const pendingUsers  = users.filter(u => !u.is_active);

  return (
    <div className="p-6 space-y-6 animate-fade-in text-left bg-slate-950 min-h-screen">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">Admin Console</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage users, ingestion channels, and organization settings.</p>
        </div>
        <button
          onClick={() => { fetchSources(); fetchUsers(); }}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition text-xs font-medium"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* ── Toast Banners ── */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs px-4 py-3 rounded-xl flex items-center gap-2 animate-fade-in">
          <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs px-4 py-3 rounded-xl flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /> {success}
        </div>
      )}

      {/* ── Stats Bar ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Users',    value: users.length,         icon: Users,        color: 'text-brand-400',  bg: 'bg-brand-500/10' },
          { label: 'Active',         value: activeUsers.length,   icon: CheckCircle2, color: 'text-emerald-400',bg: 'bg-emerald-500/10' },
          { label: 'Pending Review', value: pendingUsers.length,  icon: Clock,        color: 'text-amber-400',  bg: 'bg-amber-500/10' },
        ].map(s => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${s.bg}`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div>
              <div className="text-xl font-extrabold text-white leading-tight">{s.value}</div>
              <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Left Column ── */}
        <div className="space-y-5">

          {/* Tenant Profile */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="p-2.5 bg-brand-600/10 text-brand-400 rounded-xl">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-200 text-sm">Tenant Profile</h3>
                <p className="text-[10px] text-slate-500">Organization scope boundary</p>
              </div>
            </div>
            {user && (
              <div className="space-y-3.5">
                {[
                  { label: 'Company Name',    value: user.organization_name,  mono: false },
                  { label: 'Tenant ID',       value: user.organization,       mono: true  },
                ].map(row => (
                  <div key={row.label}>
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest block mb-0.5">{row.label}</span>
                    <span className={`text-xs font-semibold text-slate-200 ${row.mono ? 'font-mono text-[10px]' : ''}`}>{row.value}</span>
                  </div>
                ))}
                <div>
                  <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest block mb-1">Session Role</span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold ${ROLE_CONFIG[user.role]?.bg} ${ROLE_CONFIG[user.role]?.color} border ${ROLE_CONFIG[user.role]?.border}`}>
                    <Crown className="w-3 h-3" /> {ROLE_CONFIG[user.role]?.label || user.role}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Ingestion Channels */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Radio className="w-4 h-4 text-brand-500 animate-pulse" />
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Ingestion Channels</h2>
            </div>
            <div className="space-y-2.5">
              {loadingSources ? (
                <div className="space-y-2">
                  {[1,2,3].map(i => <div key={i} className="h-14 bg-slate-800/50 rounded-xl animate-pulse" />)}
                </div>
              ) : sources.length > 0 ? sources.map(src => (
                <div key={src.id} className="p-3.5 bg-slate-950/60 border border-slate-800/60 rounded-xl flex items-center justify-between gap-3 hover:border-slate-700 transition group">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 bg-slate-800 rounded-lg text-brand-500 flex-shrink-0">
                      <Database className="w-3 h-3" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-200 text-xs truncate">{src.name}</span>
                        <span className="px-1 py-0.5 text-[7px] font-black uppercase bg-slate-800 text-slate-400 rounded flex-shrink-0 border border-slate-700">{src.source_type}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {src.is_active ? (
                      <div className="flex items-center gap-1 text-emerald-400">
                        <ToggleRight className="w-5 h-5" />
                        <span className="text-[9px] font-bold uppercase tracking-wide hidden group-hover:block">Active</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-slate-600">
                        <ToggleLeft className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                </div>
              )) : (
                <p className="text-slate-600 text-xs text-center py-4">No channels configured.</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Right Column: User Directory ── */}
        <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-500" />
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest">User Directory & Approvals</h2>
            </div>
            {pendingUsers.length > 0 && (
              <span className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold px-2.5 py-1 rounded-full">
                <Clock className="w-3 h-3" /> {pendingUsers.length} Pending
              </span>
            )}
          </div>

          <div className="flex-1 space-y-2.5">
            {loadingUsers ? (
              <div className="space-y-2.5">
                {[1,2,3,4].map(i => <div key={i} className="h-16 bg-slate-800/40 rounded-xl animate-pulse" />)}
              </div>
            ) : users.length > 0 ? (
              /* Pending first, then active */
              [...pendingUsers, ...activeUsers].map(u => {
                const roleConf = ROLE_CONFIG[u.role] || ROLE_CONFIG.CLIENT_USER;
                const isSelf   = u.email === user?.email;
                const isLoading = actionLoading === u.id;

                return (
                  <div
                    key={u.id}
                    className={`p-4 rounded-xl border transition-all duration-200 ${
                      u.is_active
                        ? 'bg-slate-950/30 border-slate-800/70 hover:border-slate-700'
                        : 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/35'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      {/* Left: Avatar + Info */}
                      <div className="flex items-center gap-3">
                        <UserAvatar email={u.email} isActive={u.is_active} />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-100 text-sm">{u.email}</span>
                            {!u.is_active && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-amber-500/15 text-amber-400 border border-amber-500/25 rounded-full">
                                <Clock className="w-2.5 h-2.5" /> Pending Approval
                              </span>
                            )}
                            {u.is_active && isSelf && (
                              <span className="text-[9px] text-slate-500 font-medium">(You)</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold rounded-md ${roleConf.bg} ${roleConf.color} border ${roleConf.border}`}>
                              {roleConf.label}
                            </span>
                            <span className="text-[10px] text-slate-600">•</span>
                            <span className="text-[10px] text-slate-500">{u.organization_name || 'No org'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Controls */}
                      <div className="flex items-center gap-2.5 flex-wrap ml-auto">
                        {/* Role Select */}
                        <div className="relative">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            disabled={isLoading}
                            className="appearance-none bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg pl-3 pr-7 py-1.5 focus:border-brand-500 focus:outline-none transition cursor-pointer hover:border-slate-600 disabled:opacity-50"
                          >
                            <option value="CLIENT_USER">Client User</option>
                            <option value="ANALYST">Analyst</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                          <ChevronDown className="w-3 h-3 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        {/* Action Button */}
                        {u.is_active ? (
                          <button
                            onClick={() => handleDeactivate(u.id)}
                            disabled={isLoading || isSelf}
                            title={isSelf ? 'Cannot deactivate yourself' : 'Deactivate user'}
                            className={`text-[10px] font-bold px-3.5 py-1.5 rounded-lg border transition cursor-pointer flex items-center gap-1.5 ${
                              isSelf
                                ? 'opacity-30 cursor-not-allowed border-slate-800 text-slate-500'
                                : 'border-slate-700 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30'
                            }`}
                          >
                            <UserX className="w-3.5 h-3.5" />
                            {isLoading ? 'Working...' : 'Deactivate'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleApprove(u.id, u.role)}
                            disabled={isLoading}
                            className="bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white font-bold text-[10px] px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-brand-600/20"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            {isLoading ? 'Approving...' : 'Approve'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-16 space-y-3 text-slate-600">
                <Users className="w-10 h-10 opacity-30" />
                <p className="text-sm font-medium">No registered users found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

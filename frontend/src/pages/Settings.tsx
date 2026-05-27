import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import type { DataSource } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Building2, Settings as SettingsIcon, Radio, ToggleLeft, ToggleRight } from 'lucide-react';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const [sources, setSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<DataSource[]>('/sources/')
      .then(res => {
        setSources(res);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load settings', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-4 space-y-4 animate-fade-in text-left">
      <div className="pb-3 border-b border-slate-100">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
          Organization Settings <SettingsIcon className="w-5 h-5 text-slate-400" />
        </h1>
        <p className="text-xs text-slate-400">Manage active ingestion channels and review authorization scopes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left Column: Organization Metadata */}
        <div className="bg-white border border-slate-150 p-4 rounded-xl shadow-sm space-y-3.5">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-xs">Tenant Profile</h3>
              <p className="text-[10px] text-slate-400">Database boundary scopes</p>
            </div>
          </div>
          {user && (
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide block">Company Name</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">{user.organization_name}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide block">Tenant ID</span>
                <span className="font-mono text-[10px] text-slate-500 mt-0.5 block">{user.organization}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide block">Active User Role</span>
                <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-705 text-[9px] font-bold uppercase rounded border border-slate-200 mt-1">
                  {user.role}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Ingestion Channels */}
        <div className="lg:col-span-2 bg-white border border-slate-150 p-4 rounded-xl shadow-sm">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1">
            <Radio className="w-4 h-4 text-brand-600 animate-pulse" /> Active Ingestion Channels
          </h2>
          <div className="space-y-3">
            {loading ? (
              <p className="text-slate-400 text-xs">Querying channels...</p>
            ) : sources.length > 0 ? (
              sources.map(src => (
                <div key={src.id} className="p-3 border border-slate-100 rounded-lg flex items-center justify-between hover:border-slate-200 transition">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1.5">
                      <h4 className="font-bold text-slate-800 text-xs">{src.name}</h4>
                      <span className="px-1.5 py-0.5 text-[8px] font-black uppercase bg-slate-100 text-slate-650 rounded">
                        {src.source_type}
                      </span>
                    </div>
                    <pre className="text-[9px] text-slate-400 font-mono">
                      Config: {JSON.stringify(src.configuration)}
                    </pre>
                  </div>
                  <div className="flex items-center space-x-2">
                    {src.is_active ? (
                      <div className="flex items-center text-emerald-600 font-semibold text-xs space-x-1">
                        <ToggleRight className="w-5 h-5" />
                        <span className="text-[10px]">Active</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-slate-400 font-semibold text-xs space-x-1">
                        <ToggleLeft className="w-5 h-5" />
                        <span className="text-[10px]">Inactive</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-xs">No active configurations.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

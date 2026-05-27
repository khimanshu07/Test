import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import { 
  FileCheck, ShieldAlert, FileClock, CheckCircle, XCircle, Leaf, Sparkles 
} from 'lucide-react';

interface DashboardData {
  kpis: {
    total_rows: number;
    failed_rows: number;
    pending_review: number;
    approved_rows: number;
    rejected_rows: number;
    total_emissions: number;
  };
  scope_analytics: Record<string, number>;
  source_analytics: Record<string, number>;
  monthly_trend: Array<{ period: string; emissions: number }>;
  failed_trend: Array<{ file: string; total: number; failed: number; date: string }>;
}

const COLORS = ['#22c55e', '#6366f1', '#f59e0b', '#3b82f6', '#ec4899', '#ef4444'];

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<DashboardData>('/analytics/')
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Failed to fetch dashboard data.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-6 w-36 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-200 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-64 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-64 bg-slate-200 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-750 text-xs px-3 py-2 rounded-lg">
          Error: {error || 'Could not load data.'}
        </div>
      </div>
    );
  }

  const { kpis, scope_analytics, source_analytics, monthly_trend, failed_trend } = data;

  const scopeChartData = Object.entries(scope_analytics).map(([name, value]) => ({ name, value }));
  const sourceChartData = Object.entries(source_analytics).map(([name, value]) => ({ name, value }));

  return (
    <div className="p-5 space-y-5 animate-fade-in text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
            Audit Analytics Dashboard <Sparkles className="w-5 h-5 text-brand-600 animate-pulse" />
          </h1>
          <p className="text-xs text-slate-400">Live reporting, carbon scopes, and ingestion metrics.</p>
        </div>
        <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-800 py-1 px-3 rounded-lg border border-emerald-200/50 shadow-sm self-start sm:self-auto">
          <Leaf className="w-4 h-4 text-emerald-600" />
          <div>
            <p className="text-[8px] font-bold uppercase tracking-wider text-emerald-700 leading-none">Total footprint</p>
            <p className="text-xs font-black mt-0.5">{kpis.total_emissions.toLocaleString(undefined, {maximumFractionDigits: 1})} t CO₂e</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-150/60 rounded-xl p-3 shadow-sm flex items-center space-x-3 hover-glow-card cursor-pointer">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-650"><FileCheck className="w-4 h-4" /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Rows</p>
            <p className="text-lg font-black text-slate-800 leading-none mt-1">{kpis.total_rows}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-150/60 rounded-xl p-3 shadow-sm flex items-center space-x-3 hover-glow-card cursor-pointer">
          <div className="p-2 rounded-lg bg-red-50 text-red-650"><ShieldAlert className="w-4 h-4 animate-pulse" /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Failed Rows</p>
            <p className="text-lg font-black text-slate-800 leading-none mt-1">{kpis.failed_rows}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-150/60 rounded-xl p-3 shadow-sm flex items-center space-x-3 hover-glow-card cursor-pointer">
          <div className="p-2 rounded-lg bg-amber-50 text-amber-650"><FileClock className="w-4 h-4" /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending</p>
            <p className="text-lg font-black text-slate-800 leading-none mt-1">{kpis.pending_review}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-150/60 rounded-xl p-3 shadow-sm flex items-center space-x-3 hover-glow-card cursor-pointer">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-650"><CheckCircle className="w-4 h-4" /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Approved</p>
            <p className="text-lg font-black text-slate-800 leading-none mt-1">{kpis.approved_rows}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-150/60 rounded-xl p-3 shadow-sm flex items-center space-x-3 hover-glow-card cursor-pointer">
          <div className="p-2 rounded-lg bg-rose-50 text-rose-650"><XCircle className="w-4 h-4" /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rejected</p>
            <p className="text-lg font-black text-slate-800 leading-none mt-1">{kpis.rejected_rows}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-150/60 rounded-xl p-3 shadow-sm flex items-center space-x-3 hover-glow-card cursor-pointer">
          <div className="p-2 rounded-lg bg-emerald-100/60 text-emerald-700"><Leaf className="w-4 h-4" /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Carbon</p>
            <p className="text-lg font-black text-slate-800 leading-none mt-1 truncate">
              {kpis.total_emissions.toLocaleString(undefined, {maximumFractionDigits: 1})}t
            </p>
          </div>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Monthly Emissions Trend */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Emissions Trend</h2>
          <div className="h-60">
            {monthly_trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthly_trend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEmissions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                  <XAxis dataKey="period" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip formatter={(value) => [`${value} t CO2e`, 'Emissions']} />
                  <Area type="monotone" dataKey="emissions" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorEmissions)" isAnimationActive={true} animationDuration={850} animationEasing="ease-out" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data to map</div>
            )}
          </div>
        </div>

        {/* Emissions by Scope */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Emissions by GHG Scope</h2>
          <div className="h-60 flex items-center justify-around">
            <div className="h-full w-[50%]">
              {scopeChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={scopeChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                      isAnimationActive={true}
                      animationDuration={850}
                      animationEasing="ease-out"
                    >
                      {scopeChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-85 transition-opacity duration-200 cursor-pointer" />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${parseFloat(value as string).toFixed(1)} t CO2e`, ' footprint']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data to map</div>
              )}
            </div>
            <div className="flex flex-col space-y-2">
              {scopeChartData.map((item, idx) => (
                <div key={item.name} className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{item.name}</p>
                    <p className="text-xs font-bold text-slate-700">{parseFloat(item.value as any).toFixed(1)} t</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Emissions by Ingestion Source */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Footprint by Source</h2>
          <div className="h-60">
            {sourceChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip formatter={(value) => [`${value} t CO2e`, 'Emissions']} />
                  <Bar dataKey="value" fill="#6366f1" radius={[3, 3, 0, 0]} barSize={30} isAnimationActive={true} animationDuration={850} animationEasing="ease-out">
                    {sourceChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} className="hover:opacity-85 transition-opacity duration-200 cursor-pointer" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data to map</div>
            )}
          </div>
        </div>

        {/* Ingestion Batch Quality History */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Ingestion Quality Trends</h2>
          <div className="h-60">
            {failed_trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={failed_trend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip />
                  <Legend verticalAlign="top" height={24} iconSize={10} style={{ fontSize: '10px' }} />
                  <Bar dataKey="total" name="Successful" stackId="a" fill="#10b981" isAnimationActive={true} animationDuration={850} animationEasing="ease-out" />
                  <Bar dataKey="failed" name="Failed" stackId="a" fill="#f43f5e" isAnimationActive={true} animationDuration={850} animationEasing="ease-out" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data to map</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

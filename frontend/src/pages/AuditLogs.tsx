import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import type { AuditLog } from '../utils/api';
import { History, User } from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<AuditLog[]>('/auditlogs/')
      .then(res => {
        setLogs(res);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load audit logs', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-4 space-y-4 animate-fade-in text-left">
      <div className="pb-3 border-b border-slate-100">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
          Platform Audit Trail <History className="w-5 h-5 text-slate-400" />
        </h1>
        <p className="text-xs text-slate-400">Immutable system records tracking ingestion histories and manual overrides.</p>
      </div>

      <div className="bg-white border border-slate-150 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="py-2.5 px-3 font-bold text-slate-500 uppercase tracking-wider text-[9px]">Timestamp</th>
                <th className="py-2.5 px-3 font-bold text-slate-500 uppercase tracking-wider text-[9px]">Entity</th>
                <th className="py-2.5 px-3 font-bold text-slate-500 uppercase tracking-wider text-[9px]">Action Performed</th>
                <th className="py-2.5 px-3 font-bold text-slate-500 uppercase tracking-wider text-[9px]">Triggered By</th>
                <th className="py-2.5 px-3 font-bold text-slate-500 uppercase tracking-wider text-[9px]">Metadata</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-450">Loading audit trail...</td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50/20">
                    <td className="py-2 px-3 text-slate-400 font-mono text-[10px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2 px-3">
                      <span className="inline-block px-1.5 py-0.5 text-[9px] font-bold bg-slate-100 text-slate-700 rounded">
                        {log.entity_type}
                      </span>
                      <span className="block text-[8px] text-slate-400 font-mono mt-0.5">ID: {log.entity_id.slice(0, 8)}...</span>
                    </td>
                    <td className="py-2 px-3 text-slate-800 font-bold">
                      {log.action}
                    </td>
                    <td className="py-2 px-3 text-slate-650">
                      <span className="flex items-center space-x-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{log.performed_by_username || 'System Engine'}</span>
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <pre className="text-[9px] text-slate-500 font-mono bg-slate-50 p-1.5 rounded max-h-20 overflow-y-auto max-w-xs leading-tight">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    No system log entries recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

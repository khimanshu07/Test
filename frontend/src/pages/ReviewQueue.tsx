import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import type { EmissionRecord } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  CheckCircle, XCircle, Search, AlertTriangle, 
  ChevronDown, ChevronUp, Edit3, MessageSquare, Send, X, RefreshCw 
} from 'lucide-react';

export const ReviewQueue: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<EmissionRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Filters state
  const [scopeFilter, setScopeFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal / Drawer state for Correction
  const [drawerRecord, setDrawerRecord] = useState<EmissionRecord | null>(null);
  const [editQty, setEditQty] = useState('');
  const [editFactor, setEditFactor] = useState('');
  const [editPeriod, setEditPeriod] = useState('');
  const [editRef, setEditRef] = useState('');
  const [commentText, setCommentText] = useState('');
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecords();
  }, [scopeFilter, sourceFilter, statusFilter, searchQuery]);

  const fetchRecords = () => {
    setLoading(true);
    let params = `?review_status=${statusFilter}`;
    if (scopeFilter) params += `&scope=${scopeFilter}`;
    if (sourceFilter) params += `&source_type=${sourceFilter}`;
    if (searchQuery) params += `&search=${searchQuery}`;

    api.get<EmissionRecord[]>(`/records/${params}`)
      .then(res => {
        setRecords(res);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load emission records', err);
        setLoading(false);
      });
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(records.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/records/${id}/approve/`, {});
      fetchRecords();
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    }
  };

  const handleReject = async (id: string) => {
    const comment = prompt('Enter rejection reason:');
    if (comment === null) return; // cancelled
    try {
      await api.post(`/records/${id}/reject/`, { comment });
      fetchRecords();
    } catch (err: any) {
      alert(err.message || 'Rejection failed');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    try {
      await api.post('/records/bulk-approve/', { ids: selectedIds });
      setSelectedIds([]);
      fetchRecords();
    } catch (err: any) {
      alert(err.message || 'Bulk approval failed');
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) return;
    const comment = prompt('Enter rejection reason for bulk action:');
    if (comment === null) return;
    try {
      await api.post('/records/bulk-reject/', { ids: selectedIds, comment });
      setSelectedIds([]);
      fetchRecords();
    } catch (err: any) {
      alert(err.message || 'Bulk rejection failed');
    }
  };

  const openCorrectionDrawer = (record: EmissionRecord) => {
    setDrawerRecord(record);
    setEditQty(record.quantity);
    setEditFactor(record.emission_factor);
    setEditPeriod(record.reporting_period);
    setEditRef(record.source_reference);
    setCommentText('');
  };

  const handleManualCorrection = async (fieldName: string, value: string) => {
    if (!drawerRecord) return;
    try {
      const updated = await api.post<EmissionRecord>(`/records/${drawerRecord.id}/correct/`, {
        field_name: fieldName,
        new_value: value
      });
      setDrawerRecord(updated);
      fetchRecords();
    } catch (err: any) {
      alert(err.message || 'Recalculation correction failed');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!drawerRecord || !commentText.trim()) return;
    try {
      await api.post(`/records/${drawerRecord.id}/reject/`, { comment: commentText });
      setCommentText('');
      const refreshed = await api.get<EmissionRecord>(`/records/${drawerRecord.id}/`);
      setDrawerRecord(refreshed);
      fetchRecords();
    } catch (err: any) {
      alert(err.message || 'Failed to add comment');
    }
  };

  const toggleRowExpansion = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div className="p-4 space-y-4 animate-fade-in min-h-screen text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">ESG Review Queue</h1>
          <p className="text-xs text-slate-400">Validate emissions data and verify transaction pipelines.</p>
        </div>
        {selectedIds.length > 0 && user?.role !== 'CLIENT_USER' && (
          <div className="flex items-center space-x-2 bg-brand-50 border border-brand-200 px-3 py-1.5 rounded-lg">
            <span className="text-[10px] font-bold text-slate-600 uppercase">{selectedIds.length} Checked</span>
            <button
              onClick={handleBulkApprove}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] py-1 px-2.5 rounded shadow cursor-pointer transition"
            >
              Bulk Approve
            </button>
            <button
              onClick={handleBulkReject}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] py-1 px-2.5 rounded shadow cursor-pointer transition"
            >
              Bulk Reject
            </button>
          </div>
        )}
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white border border-slate-150 p-3 rounded-xl shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 py-1 px-2.5 rounded-lg text-[11px] font-bold text-slate-700 outline-none transition"
          >
            <option value="PENDING">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          
          <select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 py-1 px-2.5 rounded-lg text-[11px] font-bold text-slate-700 outline-none transition"
          >
            <option value="">All Scopes</option>
            <option value="1">Scope 1 (Direct)</option>
            <option value="2">Scope 2 (Indirect)</option>
            <option value="3">Scope 3 (Travel)</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 py-1 px-2.5 rounded-lg text-[11px] font-bold text-slate-700 outline-none transition"
          >
            <option value="">All Sources</option>
            <option value="SAP">SAP Procurement</option>
            <option value="UTILITY">Utility Electric</option>
            <option value="TRAVEL">Travel Logs</option>
          </select>
        </div>

        <div className="relative w-full sm:w-60">
          <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </span>
          <input
            type="text"
            placeholder="Search activity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 py-1 pl-8 pr-3 rounded-lg text-[11px] text-slate-800 placeholder-slate-400 outline-none transition focus:border-brand-500"
          />
        </div>
      </div>

      {/* Main Review Table */}
      <div className="bg-white border border-slate-150 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="py-2 px-3 w-8">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={records.length > 0 && selectedIds.length === records.length}
                    className="rounded text-brand-600 focus:ring-brand-500 w-3.5 h-3.5"
                  />
                </th>
                <th className="py-2.5 px-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Source</th>
                <th className="py-2.5 px-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Scope</th>
                <th className="py-2.5 px-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Activity Type</th>
                <th className="py-2.5 px-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Quantity</th>
                <th className="py-2.5 px-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Emissions</th>
                <th className="py-2.5 px-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Confidence</th>
                <th className="py-2.5 px-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Uploaded By</th>
                <th className="py-2.5 px-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Actions</th>
                <th className="py-2.5 px-1 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-slate-400" />
                    <span>Syncing records...</span>
                  </td>
                </tr>
              ) : records.length > 0 ? (
                records.map((r) => {
                  const isExpanded = expandedId === r.id;
                  const warningsCount = r.validation_warnings.length;
                  return (
                    <React.Fragment key={r.id}>
                      <tr className={`border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${
                        warningsCount > 0 ? 'bg-amber-50/15' : ''
                      }`}>
                        <td className="py-2 px-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(r.id)}
                            onChange={() => handleSelectRow(r.id)}
                            className="rounded text-brand-600 focus:ring-brand-500 w-3.5 h-3.5"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 rounded">
                            {r.source_type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-800 font-bold">Scope {r.scope}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-semibold text-slate-800">{r.activity_type}</span>
                            {warningsCount > 0 && (
                              <span className="flex items-center space-x-0.5 bg-amber-100 text-amber-850 text-[9px] font-black px-1.5 rounded-full animate-soft-pulse">
                                <AlertTriangle className="w-2.5 h-2.5 text-amber-600 animate-bounce" style={{ animationDuration: '3s' }} />
                                <span>{warningsCount}</span>
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] text-slate-400 block font-mono mt-0.5">Ref: {r.source_reference || 'N/A'}</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {parseFloat(r.quantity).toLocaleString()} {r.normalized_unit}
                        </td>
                        <td className="py-2.5 px-3 font-black text-slate-900">
                          {parseFloat(r.calculated_emissions).toFixed(3)} t CO₂e
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center space-x-1">
                            <div className="w-10 bg-slate-100 rounded-full h-1 overflow-hidden">
                              <div 
                                className={`h-full ${
                                  parseFloat(r.confidence_score) >= 0.8 
                                    ? 'bg-emerald-500' 
                                    : parseFloat(r.confidence_score) >= 0.5 
                                      ? 'bg-amber-500' 
                                      : 'bg-rose-500'
                                }`}
                                style={{ width: `${parseFloat(r.confidence_score) * 100}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-slate-700">{Math.round(parseFloat(r.confidence_score) * 100)}%</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {r.uploaded_by}
                          <span className="block text-[9px] text-slate-400 mt-0.5">{new Date(r.created_at).toLocaleDateString()}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          {user?.role !== 'CLIENT_USER' && r.review_status === 'PENDING' ? (
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleApprove(r.id)}
                                title="Approve"
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReject(r.id)}
                                title="Reject"
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded transition"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openCorrectionDrawer(r)}
                                title="Edit & Recalculate"
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className={`inline-block px-1.5 py-0.5 text-[10px] font-bold rounded ${
                              r.review_status === 'APPROVED' 
                                ? 'bg-emerald-50 text-emerald-700' 
                                : 'bg-rose-50 text-rose-700'
                            }`}>
                              {r.review_status}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-1">
                          <button
                            onClick={() => toggleRowExpansion(r.id)}
                            className="p-0.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition"
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Section */}
                      {isExpanded && (
                        <tr className="bg-slate-50/30">
                          <td colSpan={10} className="p-4 border-b border-slate-150">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <div className="space-y-3">
                                <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Metadata Comparison</h4>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="bg-white border border-slate-150 p-3 rounded-lg shadow-sm">
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Raw Payload</span>
                                    <pre className="text-[10px] text-slate-500 font-mono overflow-auto max-h-36 leading-tight">
                                      {JSON.stringify(r.raw_payload, null, 2)}
                                    </pre>
                                  </div>
                                  <div className="bg-white border border-slate-150 p-3 rounded-lg shadow-sm space-y-1.5">
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Normalized Result</span>
                                    <div className="text-[11px] text-slate-600 space-y-1">
                                      <p><strong className="text-slate-700">Category:</strong> {r.category}</p>
                                      <p><strong className="text-slate-700">Period:</strong> {r.reporting_period}</p>
                                      <p><strong className="text-slate-700">Scope:</strong> Scope {r.scope}</p>
                                      <p><strong className="text-slate-700">Factor:</strong> {r.emission_factor} kg CO2e</p>
                                      {r.comment && <p className="mt-1 text-rose-700 italic"><strong className="text-slate-700">Reject:</strong> {r.comment}</p>}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider text-left">Validation & Audit</h4>
                                <div className="space-y-2">
                                  {r.validation_warnings.length > 0 && (
                                    <div className="bg-amber-50 border border-amber-200 text-amber-800 p-2.5 rounded-lg text-[11px] space-y-0.5 text-left">
                                      <span className="font-bold flex items-center gap-1">
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Anomalies tagged
                                      </span>
                                      <ul className="list-disc pl-3.5 space-y-0.5">
                                        {r.validation_warnings.map((w, idx) => <li key={idx}>{w}</li>)}
                                      </ul>
                                    </div>
                                  )}

                                  <div className="bg-white border border-slate-150 p-3 rounded-lg shadow-sm text-[11px]">
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide block mb-1 text-left">History Logs</span>
                                    <div className="space-y-2.5 max-h-32 overflow-y-auto pr-1">
                                      {r.review_actions && r.review_actions.length > 0 ? (
                                        r.review_actions.map((act) => (
                                          <div key={act.id} className="border-l border-slate-200 pl-2.5 py-0.5 relative text-left">
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 absolute left-[-3.5px] top-1" />
                                            <p className="font-semibold text-slate-700 leading-tight">
                                              {act.action_type === 'APPROVE' && <span className="text-emerald-600">Approved</span>}
                                              {act.action_type === 'REJECT' && <span className="text-rose-600">Rejected</span>}
                                              {act.action_type === 'COMMENT' && <span className="text-slate-650">Comment</span>}
                                              {act.action_type === 'CORRECT' && <span className="text-blue-600">Edit: {act.field_name}</span>}
                                              <span className="text-slate-450 font-normal"> by {act.reviewer_username}</span>
                                            </p>
                                            {act.old_value && act.new_value && (
                                              <p className="text-[10px] text-slate-500">{act.old_value} &rarr; {act.new_value}</p>
                                            )}
                                            {act.action_type === 'COMMENT' && (
                                              <p className="text-[10px] text-slate-550 bg-slate-50 p-1 rounded border border-slate-100 italic">"{act.new_value}"</p>
                                            )}
                                            <span className="text-[8px] text-slate-400 block">{new Date(act.timestamp).toLocaleString()}</span>
                                          </div>
                                        ))
                                      ) : (
                                        <p className="text-slate-400 italic">No historical actions logged.</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-6 text-center text-slate-400">
                    No records found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Correction Sidebar Drawer */}
      {drawerRecord && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex justify-end animate-fade-in-plain">
          <div className="w-full max-w-xs bg-white h-full shadow-2xl flex flex-col p-5 relative animate-slide-in">
            <button 
              onClick={() => setDrawerRecord(null)}
              className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4 text-left">
              <span className="inline-block px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase rounded mb-1">
                {drawerRecord.source_type} (Scope {drawerRecord.scope})
              </span>
              <h2 className="text-sm font-bold text-slate-800">{drawerRecord.activity_type}</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">Recalculate fields on override submission.</p>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-4">
              <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1 text-left">Live Footprint</span>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-slate-500">Emissions</p>
                  <p className="text-base font-black text-slate-900 leading-none mt-0.5">
                    {(parseFloat(editQty || '0') * parseFloat(editFactor || '0') / 1000).toFixed(3)} t CO₂e
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-left">
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Quantity
                </label>
                <div className="flex space-x-1.5">
                  <input
                    type="number"
                    value={editQty}
                    onChange={(e) => setEditQty(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 py-1.5 px-2.5 rounded-lg text-xs outline-none transition focus:border-brand-500"
                  />
                  <button 
                    onClick={() => handleManualCorrection('quantity', editQty)}
                    className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-[10px] px-2.5 rounded-lg transition cursor-pointer"
                  >
                    Recalc
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Emission Factor
                </label>
                <div className="flex space-x-1.5">
                  <input
                    type="number"
                    step="0.0001"
                    value={editFactor}
                    onChange={(e) => setEditFactor(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 py-1.5 px-2.5 rounded-lg text-xs outline-none transition focus:border-brand-500"
                  />
                  <button 
                    onClick={() => handleManualCorrection('emission_factor', editFactor)}
                    className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-[10px] px-2.5 rounded-lg transition cursor-pointer"
                  >
                    Recalc
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Period
                </label>
                <div className="flex space-x-1.5">
                  <input
                    type="text"
                    placeholder="YYYY-MM"
                    value={editPeriod}
                    onChange={(e) => setEditPeriod(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 py-1.5 px-2.5 rounded-lg text-xs outline-none transition focus:border-brand-500"
                  />
                  <button 
                    onClick={() => handleManualCorrection('reporting_period', editPeriod)}
                    className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-[10px] px-2.5 rounded-lg transition cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Reference
                </label>
                <div className="flex space-x-1.5">
                  <input
                    type="text"
                    value={editRef}
                    onChange={(e) => setEditRef(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 py-1.5 px-2.5 rounded-lg text-xs outline-none transition focus:border-brand-500"
                  />
                  <button 
                    onClick={() => handleManualCorrection('source_reference', editRef)}
                    className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-[10px] px-2.5 rounded-lg transition cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400" /> Analyst Feed
                </h3>
                <form onSubmit={handleAddComment} className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="Add comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 py-1 px-2.5 rounded-lg text-xs outline-none focus:border-brand-500"
                  />
                  <button 
                    type="submit"
                    className="bg-slate-800 text-white hover:bg-slate-900 px-2 rounded-lg flex items-center justify-center transition cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

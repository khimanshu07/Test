import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import type { DataSource, UploadBatch } from '../utils/api';
import { Upload, FileText, CheckCircle, XCircle, Loader2, Sparkles, Download } from 'lucide-react';

export const UploadCenter: React.FC = () => {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [history, setHistory] = useState<UploadBatch[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    api.get<DataSource[]>('/sources/')
      .then(res => {
        setSources(res);
        if (res.length > 0) {
          setSelectedSourceId(res[0].id);
        }
      })
      .catch(err => console.error('Failed to load sources', err));

    fetchHistory();
  }, []);

  const fetchHistory = () => {
    api.get<UploadBatch[]>('/batches/')
      .then(res => setHistory(res))
      .catch(err => console.error('Failed to load batch history', err));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setupFilePreview(files[0]);
    }
  };

  const setupFilePreview = (selectedFile: File) => {
    setFile(selectedFile);
    setMessage(null);

    if (selectedFile.name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').map(line => line.split(','));
        if (lines.length > 0) {
          setPreviewHeaders(lines[0]);
          setPreviewRows(lines.slice(1, 6).filter(row => row.some(cell => cell.trim() !== '')));
        }
      };
      reader.readAsText(selectedFile);
    } else {
      setPreviewHeaders([]);
      setPreviewRows([]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedSourceId) return;

    setUploading(true);
    setUploadProgress(20);
    setMessage(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('source', selectedSourceId);

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 15, 90));
    }, 155);

    try {
      await api.post('/batches/', formData, true);
      clearInterval(progressInterval);
      setUploadProgress(100);
      setMessage({ type: 'success', text: `Successfully processed file: ${file.name}` });
      setFile(null);
      setPreviewHeaders([]);
      setPreviewRows([]);
      fetchHistory();
    } catch (err: any) {
      clearInterval(progressInterval);
      setMessage({ type: 'error', text: err.message || 'File ingestion failed.' });
      fetchHistory();
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = (type: 'SAP' | 'UTILITY' | 'TRAVEL') => {
    let headers = '';
    let rows = '';
    let fileName = '';

    if (type === 'SAP') {
      headers = 'MATNR,WERKS,EKGRP,Fuel_Type,Menge,Einheit,Buchungsdatum,Lieferant\n';
      rows = 'MAT-8812,1000,G01,Diesel,14500,L,2026-05-10,Bavarian Fuels\n' +
             'MAT-4412,2000,G02,Gasoline,3205,L,2026-05-14,Standard Oil\n' +
             'MAT-9901,5000,G01,Diesel,80,GAL,12.05.2026,Unknown Vendor\n' +
             'MAT-2210,1000,G01,Diesel,-250,L,2026-05-18,Bavarian Fuels\n';
      fileName = 'SAP_Procurement_Sample.csv';
    } else if (type === 'UTILITY') {
      headers = 'meter_number,billing_period_start,billing_period_end,usage_kwh,tariff_type,cost,utility_provider\n';
      rows = 'METER-99120,2026-04-01,2026-04-30,42000,Commercial,8400,Duke Energy\n' +
             'METER-99120,2026-05-01,2026-05-31,180000,Commercial,36000,Duke Energy\n' +
             'METER-99120,2026-05-15,2026-06-15,-500,Commercial,-100,Duke Energy\n';
      fileName = 'Utility_Electricity_Sample.csv';
    } else {
      headers = 'traveler_name,booking_type,origin_airport,destination_airport,distance_km,cabin_class,hotel_nights,taxi_distance\n';
      rows = 'Alice Vance,Flight,JFK,LHR,,First,,20\n' +
             'Bob Miller,Hotel,,,Economy,4,\n' +
             'Charlie Vance,Ground,,,,,25\n';
      fileName = 'Corporate_Travel_Sample.csv';
    }

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 space-y-4 animate-fade-in text-left">
      <div className="pb-3 border-b border-slate-100">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
          ESG Upload Center <Sparkles className="w-5 h-5 text-brand-600 animate-pulse" />
        </h1>
        <p className="text-xs text-slate-400">Upload records in CSV/Excel and monitor parser jobs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Upload Form Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-150 p-4 rounded-xl shadow-sm">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Ingestion Wizard</h2>

            {message && (
              <div className={`mb-4 p-3 rounded-lg border flex items-start space-x-2 text-xs ${
                message.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Select Data Ingestion Channel
                </label>
                <select
                  value={selectedSourceId}
                  onChange={(e) => setSelectedSourceId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded-lg text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition"
                >
                  {sources.map(src => (
                    <option key={src.id} value={src.id}>{src.name} ({src.source_type})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Attach Raw ESG Data Document (CSV / XLSX)
                </label>
                <div 
                  className={`border-2 border-dashed rounded-lg p-5 flex flex-col items-center justify-center cursor-pointer transition ${
                    file ? 'border-brand-500 bg-brand-50/5' : 'border-slate-350 hover:border-slate-400'
                  }`}
                  onClick={() => document.getElementById('file-picker')?.click()}
                >
                  <input
                    id="file-picker"
                    type="file"
                    accept=".csv, .xlsx, .xls"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <Upload className={`w-8 h-8 mb-2 ${file ? 'text-brand-500' : 'text-slate-400'}`} />
                  {file ? (
                    <div className="text-center">
                      <p className="text-xs font-bold text-slate-800">{file.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-xs font-bold text-slate-805">Drag & drop your file here, or click to browse</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Supports CSV, XLSX up to 10MB</p>
                    </div>
                  )}
                </div>
              </div>

              {previewRows.length > 0 && (
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 space-y-2">
                  <div className="flex items-center space-x-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    <FileText className="w-3.5 h-3.5" />
                    <span>CSV Preview</span>
                  </div>
                  <div className="overflow-x-auto max-h-36 border border-slate-150 rounded">
                    <table className="w-full text-[10px] text-left border-collapse bg-white">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200">
                          {previewHeaders.map((h, i) => (
                            <th key={i} className="py-1 px-2.5 font-bold text-slate-600 whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.map((row, rIdx) => (
                          <tr key={rIdx} className="border-b border-slate-100 hover:bg-slate-50/50">
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="py-1 px-2.5 text-slate-700 max-w-xs truncate">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {uploading && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                    <span>Ingesting records...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                    <div className="bg-brand-600 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!file || uploading}
                className="w-full bg-brand-600 hover:bg-brand-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-2 rounded-lg text-xs shadow flex items-center justify-center space-x-1.5 transition cursor-pointer"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Ingestion...</span>
                  </>
                ) : (
                  <span>Launch Ingestion Pipeline</span>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-150 p-4 rounded-xl shadow-sm">
            <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-2 flex items-center gap-1">
              Sample Templates <Download className="w-3.5 h-3.5 text-slate-400" />
            </h3>
            <p className="text-[11px] text-slate-555 leading-relaxed mb-4">
              Download these preconfigured mock files containing realistic structures to test parsing filters.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => downloadTemplate('SAP')}
                className="w-full flex items-center justify-between text-left px-3 py-2 rounded-lg border border-slate-200 hover:border-brand-500 hover:bg-brand-50/10 text-xs font-semibold text-slate-700 transition cursor-pointer"
              >
                <span>SAP Fuel Procurement</span>
                <span className="text-[9px] text-brand-600 font-bold uppercase tracking-wider">CSV</span>
              </button>
              <button
                onClick={() => downloadTemplate('UTILITY')}
                className="w-full flex items-center justify-between text-left px-3 py-2 rounded-lg border border-slate-200 hover:border-brand-500 hover:bg-brand-50/10 text-xs font-semibold text-slate-700 transition cursor-pointer"
              >
                <span>Utility Electric bills</span>
                <span className="text-[9px] text-brand-600 font-bold uppercase tracking-wider">CSV</span>
              </button>
              <button
                onClick={() => downloadTemplate('TRAVEL')}
                className="w-full flex items-center justify-between text-left px-3 py-2 rounded-lg border border-slate-200 hover:border-brand-500 hover:bg-brand-50/10 text-xs font-semibold text-slate-700 transition cursor-pointer"
              >
                <span>Corporate Travel Logs</span>
                <span className="text-[9px] text-brand-600 font-bold uppercase tracking-wider">CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white border border-slate-150 rounded-xl p-4 shadow-sm">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Ingestion Execution History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="py-2 px-3 font-bold text-slate-500 uppercase tracking-wider text-[9px]">File Name</th>
                <th className="py-2 px-3 font-bold text-slate-500 uppercase tracking-wider text-[9px]">Source Channel</th>
                <th className="py-2 px-3 font-bold text-slate-500 uppercase tracking-wider text-[9px]">Status</th>
                <th className="py-2 px-3 font-bold text-slate-500 uppercase tracking-wider text-[9px]">Successful</th>
                <th className="py-2 px-3 font-bold text-slate-500 uppercase tracking-wider text-[9px]">Failed</th>
                <th className="py-2 px-3 font-bold text-slate-500 uppercase tracking-wider text-[9px]">Uploaded By</th>
                <th className="py-2 px-3 font-bold text-slate-500 uppercase tracking-wider text-[9px]">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? (
                history.map((h) => (
                  <tr key={h.id} className="border-b border-slate-100 hover:bg-slate-50/30">
                    <td className="py-2 px-3 font-semibold text-slate-800">{h.file_name.split(/[\\/]/).pop()}</td>
                    <td className="py-2 px-3 text-slate-600">
                      <span className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold text-[10px]">
                        {h.source_name} ({h.source_type})
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded ${
                        h.processing_status === 'COMPLETED' 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : h.processing_status === 'FAILED' 
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-700'
                      }`}>
                        {h.processing_status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-emerald-650 font-bold">{h.processed_rows} rows</td>
                    <td className="py-2 px-3 text-rose-650 font-bold">{h.failed_rows} rows</td>
                    <td className="py-2 px-3 text-slate-500">{h.uploaded_by_username}</td>
                    <td className="py-2 px-3 text-slate-400 text-[10px]">
                      {new Date(h.upload_timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    No ingestion execution logs found.
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

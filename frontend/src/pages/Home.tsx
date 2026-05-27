import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Activity, Leaf, ShieldAlert, Sparkles } from 'lucide-react';

export const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none animate-float-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none animate-float-slower" />


      {/* Header */}
      <header className="max-w-7xl w-full mx-auto px-6 py-4 flex justify-between items-center z-10 border-b border-slate-900/60">
        <div className="flex items-center space-x-2.5">
          <div className="bg-brand-600 p-1.5 rounded-lg text-white shadow-md">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-base tracking-wider text-slate-100">ESG Trust</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link 
            to="/login" 
            className="text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            Sign In
          </Link>
          <Link 
            to="/login?tab=signup" 
            className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold py-1.5 px-4 rounded-lg shadow-lg shadow-brand-600/10 transition active:scale-[0.98]"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12 flex flex-col justify-center text-center z-10 space-y-8">
        <div className="space-y-4 animate-fade-in">
          <span className="inline-flex items-center space-x-1 bg-brand-500/10 text-brand-400 text-[10px] font-extrabold tracking-widest uppercase py-1 px-3 rounded-full border border-brand-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Automated ESG Accounting</span>
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-none max-w-3xl mx-auto">
            Audit-Ready Carbon Normalization Engine
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Ingest messy SAP fuel exports, utility bills, and travel spreadsheets. Normalize units, flag anomalies, and review auditable trails in a single unified pipeline.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link 
            to="/login" 
            className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs py-2.5 px-6 rounded-lg shadow-lg shadow-brand-600/25 flex items-center justify-center space-x-1.5 transition active:scale-[0.98]"
          >
            <span>Access Platform Console</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a 
            href="#features" 
            className="w-full sm:w-auto border border-slate-800 hover:border-slate-700 hover:bg-slate-900/30 text-slate-300 font-semibold text-xs py-2.5 px-6 rounded-lg transition"
          >
            Explore Workflows
          </a>
        </div>

        {/* Feature Cards Grid */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-8 border-t border-slate-900/50">
          <div className="bg-slate-900/50 border border-slate-800/60 p-5 rounded-xl text-left space-y-3 hover:border-slate-700/80 transition duration-200">
            <div className="bg-brand-500/10 text-brand-400 p-2.5 rounded-lg w-10 h-10 flex items-center justify-center">
              <Leaf className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-100">1. Raw Ingestion</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload SAP procurement files, electricity invoices, and travel logs. Handles German header translation and inconsistent metrics.
            </p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/60 p-5 rounded-xl text-left space-y-3 hover:border-slate-700/80 transition duration-200">
            <div className="bg-emerald-500/10 text-emerald-400 p-2.5 rounded-lg w-10 h-10 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-100">2. Normalization & Recalc</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automatic units matching (Gallons to Liters, IATA airport coordinate calculations). Recalculates emissions on the fly during reviewer overrides.
            </p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/60 p-5 rounded-xl text-left space-y-3 hover:border-slate-700/80 transition duration-200">
            <div className="bg-indigo-500/10 text-indigo-400 p-2.5 rounded-lg w-10 h-10 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-100">3. Immutable Audit Log</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every manual change, comment, and status transition is tracked permanently, providing complete trust for third-party carbon validation.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-900/60 text-center text-[10px] text-slate-600 z-10">
        &copy; 2026 ESG Trust Inc. All Rights Reserved. Standards-compliant with GHG Protocols.
      </footer>
    </div>
  );
};

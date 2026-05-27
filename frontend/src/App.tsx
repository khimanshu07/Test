import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ReviewQueue } from './pages/ReviewQueue';
import { UploadCenter } from './pages/UploadCenter';
import { AuditLogs } from './pages/AuditLogs';
import { Settings } from './pages/Settings';
import { Menu, ShieldCheck } from 'lucide-react';

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 text-xs font-semibold animate-pulse">Loading ESG Portal...</div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row relative">
      {/* Mobile Top Nav bar */}
      <header className="lg:hidden bg-slate-900 text-slate-100 flex items-center justify-between px-4 py-2.5 z-20 border-b border-slate-800 shadow">
        <div className="flex items-center space-x-2">
          <div className="bg-brand-600 p-1.5 rounded text-white">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-sm tracking-wider text-slate-100">ESG Trust</span>
        </div>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Sidebar - fixed on large screens, sliding drawer on mobile */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Backdrop for mobile drawer */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-950/45 backdrop-blur-sm z-30 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className={`flex-1 min-h-screen overflow-y-auto w-full transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-56'
      }`}>
        {children}
      </main>
    </div>
  );
};

const AppRoutes: React.FC = () => {
  const { token } = useAuth();
  return (
    <Routes>
      <Route path="/" element={token ? <Navigate to="/dashboard" replace /> : <Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/review" element={<ProtectedLayout><ReviewQueue /></ProtectedLayout>} />
      <Route path="/upload" element={<ProtectedLayout><UploadCenter /></ProtectedLayout>} />
      <Route path="/audit" element={<ProtectedLayout><AuditLogs /></ProtectedLayout>} />
      <Route path="/settings" element={<ProtectedLayout><Settings /></ProtectedLayout>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;

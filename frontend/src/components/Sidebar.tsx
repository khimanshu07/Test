import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  FileSpreadsheet, 
  Upload, 
  History, 
  Settings, 
  LogOut, 
  ShieldCheck,
  Building2,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isCollapsed = false, onToggleCollapse }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'ANALYST', 'CLIENT_USER'] },
    { name: 'Review Queue', path: '/review', icon: FileSpreadsheet, roles: ['ADMIN', 'ANALYST', 'CLIENT_USER'] },
    { name: 'Upload Center', path: '/upload', icon: Upload, roles: ['ADMIN', 'ANALYST', 'CLIENT_USER'] },
    { name: 'Audit Logs', path: '/audit', icon: History, roles: ['ADMIN', 'ANALYST'] },
    { name: 'Settings', path: '/settings', icon: Settings, roles: ['ADMIN'] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <aside className={`bg-slate-900 text-slate-100 flex flex-col h-screen fixed left-0 top-0 bottom-0 z-40 border-r border-slate-800 shadow-2xl transition-all duration-300 lg:translate-x-0 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    } ${isCollapsed ? 'w-16' : 'w-56'}`}>
      {/* Brand Header */}
      <div className={`p-4 border-b border-slate-800 flex items-center justify-between`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'space-x-2'}`}>
          <div className="bg-brand-600 p-1.5 rounded-lg text-white shadow-md hover:rotate-12 transition-transform duration-300 flex-shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className={`transition-all duration-300 origin-left ${isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
            <h1 className="font-extrabold text-sm tracking-wider text-slate-100 leading-tight whitespace-nowrap">ESG Trust</h1>
            <span className="text-[9px] text-brand-500 font-bold tracking-widest uppercase block whitespace-nowrap">Console</span>
          </div>
        </div>
        {/* Mobile Close Button */}
        <button 
          onClick={onClose} 
          className="lg:hidden p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Organization Indicator */}
      {user && (
        <div className={`px-4 py-2 border-b border-slate-800 bg-slate-950/40 flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2'}`}>
          <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <div className={`truncate transition-all duration-300 origin-left ${isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
            <p className="text-[9px] text-slate-400 font-medium whitespace-nowrap">Tenant</p>
            <p className="text-xs font-bold text-slate-200 truncate">{user.organization_name}</p>
          </div>
        </div>
      )}

      {/* Nav Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={onClose}
              className={`flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 group ${
                isCollapsed ? 'justify-center' : 'space-x-2.5'
              } ${
                isActive
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/10'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className={`transition-all duration-300 origin-left whitespace-nowrap ${
                isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100 group-hover:translate-x-1'
              }`}>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Desktop Collapse Toggle */}
      {onToggleCollapse && (
        <div className="hidden lg:block p-3 border-t border-slate-800 bg-slate-950/10">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      )}

      {/* User Info & Logout */}
      {user && (
        <div className="p-3 border-t border-slate-800 bg-slate-950/20">
          <div className={`flex items-center justify-between ${isCollapsed ? 'flex-col space-y-3' : ''}`}>
            <div className={`truncate pr-1 transition-all duration-300 origin-left ${isCollapsed ? 'w-0 opacity-0 overflow-hidden h-0' : 'w-auto opacity-100'}`}>
              <p className="text-xs font-bold text-slate-200 truncate">{user.username}</p>
              <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-slate-800 text-brand-500 border border-slate-700">
                {user.role}
              </span>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800/85 transition-colors flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};

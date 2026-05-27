import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, UserPlus } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('tab') === 'signup') {
      setActiveTab('signup');
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (activeTab === 'signin') {
      try {
        const res = await fetch('http://localhost:8000/api/auth/login/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        if (!res.ok) {
          throw new Error('Invalid login credentials. Please try again.');
        }

        const data = await res.json();
        login(data.access, data.user);
        window.location.href = '/dashboard';
      } catch (err: any) {
        setError(err.message || 'Server error. Make sure backend is running.');
      } finally {
        setLoading(false);
      }
    } else {
      setTimeout(() => {
        setSuccess('Account requested successfully! Please contact admin to activate your credentials.');
        setLoading(false);
        // Clear fields
        setUsername('');
        setPassword('');
        setEmail('');
        setCompanyName('');
        setFirstName('');
        setLastName('');
      }, 800);
    }
  };


  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none animate-float-slow" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none animate-float-slower" />

      <div className="w-full max-w-sm relative text-left">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-white tracking-tight leading-tight">
            {activeTab === 'signup' ? 'Create an account' : 'Log in'}
          </h2>
          {activeTab === 'signup' ? (
            <p className="text-slate-400 text-xs mt-2 font-medium">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setActiveTab('signin'); setError(null); setSuccess(null); }}
                className="text-brand-500 hover:text-brand-600 underline font-bold cursor-pointer"
              >
                Log in
              </button>
            </p>
          ) : (
            <p className="text-slate-400 text-xs mt-2 font-medium">
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => { setActiveTab('signup'); setError(null); setSuccess(null); }}
                className="text-brand-500 hover:text-brand-600 underline font-bold cursor-pointer"
              >
                Sign up
              </button>
            </p>
          )}
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-200 text-xs px-3 py-2.5 rounded-lg flex items-start space-x-2 mb-4 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs px-3 py-2.5 rounded-lg flex items-start space-x-2 mb-4 animate-fade-in">
            <UserPlus className="w-4 h-4 text-emerald-450 flex-shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'signup' && (
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className="w-full bg-slate-900 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-lg py-2.5 px-3.5 text-white placeholder-slate-500 text-xs outline-none transition duration-200"
              />
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className="w-full bg-slate-900 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-lg py-2.5 px-3.5 text-white placeholder-slate-500 text-xs outline-none transition duration-200"
              />
            </div>
          )}

          {activeTab === 'signin' ? (
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full bg-slate-900 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-lg py-2.5 px-3.5 text-white placeholder-slate-500 text-xs outline-none transition duration-200"
            />
          ) : (
            <>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full bg-slate-900 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-lg py-2.5 px-3.5 text-white placeholder-slate-500 text-xs outline-none transition duration-200"
              />
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Company / Organization Name"
                className="w-full bg-slate-900 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-lg py-2.5 px-3.5 text-white placeholder-slate-500 text-xs outline-none transition duration-200"
              />
            </>
          )}

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={activeTab === 'signup' ? 'Enter your password' : 'Password'}
              className="w-full bg-slate-900 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-lg py-2.5 px-3.5 pr-10 text-white placeholder-slate-500 text-xs outline-none transition duration-200"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {activeTab === 'signup' && (
            <div className="flex items-center space-x-2.5 pt-1">
              <input
                type="checkbox"
                id="terms"
                required
                className="rounded border-slate-850 bg-slate-900 text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="terms" className="text-slate-300 text-[11px] cursor-pointer selection:bg-transparent">
                I agree to the <span className="underline text-brand-400 hover:text-brand-500">Terms & Conditions</span>
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:bg-brand-850 text-white font-bold py-2.5 rounded-lg text-xs transition duration-200 cursor-pointer shadow-lg shadow-brand-600/10 flex items-center justify-center space-x-1.5"
          >
            <span>{activeTab === 'signin' ? 'Log in' : 'Create account'}</span>
          </button>
        </form>

      </div>
    </div>
  );
};

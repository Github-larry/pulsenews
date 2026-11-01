'use client';
import { useState } from 'react';
import { X, Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { storeAuth } from '@/store/authStore';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const COUNTRIES = ['Kenya','Nigeria','Ghana','South Africa','Uganda','Tanzania',
  'Ethiopia','Rwanda','Cameroon','Senegal','United States','United Kingdom','Canada','Australia','Other'];

interface Props { onClose: () => void; defaultTab?: 'login'|'register'; }

export function AuthModal({ onClose, defaultTab = 'login' }: Props) {
  const [tab, setTab]           = useState<'login'|'register'>(defaultTab);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState<Record<string,string>>({});

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass,  setLoginPass]  = useState('');
  const [regName,    setRegName]    = useState('');
  const [regEmail,   setRegEmail]   = useState('');
  const [regPass,    setRegPass]    = useState('');
  const [regCountry, setRegCountry] = useState('');

  function validateReg() {
    const e: Record<string,string> = {};
    if (!regName.trim() || regName.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (!regEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) e.email = 'Enter a valid email address';
    if (!regPass || regPass.length < 8)          e.password = 'Password must be at least 8 characters';
    else if (!/[A-Z]/.test(regPass))             e.password = 'Must contain at least one uppercase letter';
    else if (!/[0-9]/.test(regPass))             e.password = 'Must contain at least one number';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!loginEmail || !loginPass) { toast.error('Fill in all fields'); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${API}/auth/login`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim().toLowerCase(), password: loginPass }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message || 'Login failed'); return; }
      storeAuth(data.data.user, data.data.accessToken);
      toast.success(`Welcome back, ${data.data.user.name.split(' ')[0]}! 👋`);
      onClose();
    } catch { toast.error('Cannot reach server. Is the backend running?'); }
    finally { setLoading(false); }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!validateReg()) return;
    setLoading(true);
    try {
      const res  = await fetch(`${API}/auth/register`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(), email: regEmail.trim().toLowerCase(),
          password: regPass, ...(regCountry && { country: regCountry }),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) {
          const e: Record<string,string> = {};
          data.errors.forEach((err: {field:string;message:string}) => { e[err.field] = err.message; });
          setErrors(e); toast.error('Please fix the errors');
        } else { toast.error(data.message || 'Registration failed'); }
        return;
      }
      storeAuth(data.data.user, data.data.accessToken);
      toast.success(`Welcome, ${data.data.user.name.split(' ')[0]}! 🎉`);
      onClose();
    } catch { toast.error('Cannot reach server. Is the backend running?'); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background:'rgba(0,0,0,0.6)', backdropFilter:'blur(6px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full sm:max-w-md bg-white sm:rounded-3xl rounded-t-3xl overflow-hidden animate-modal-in"
        style={{ maxHeight:'95vh', overflowY:'auto', boxShadow:'0 25px 80px rgba(0,0,0,0.25)' }}>

        {/* Header */}
        <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-5"
          style={{ borderBottom:'1.5px solid #e8e4dc', zIndex:10 }}>
          <div>
            <div className="font-display text-2xl font-bold">
              {tab==='login' ? 'Welcome back' : 'Join the community'}
            </div>
            <div className="text-sm mt-0.5" style={{ color:'#737373' }}>
              {tab==='login' ? 'Sign in to Tales with Sylvia Wakhisi' : 'Create your free account'}
            </div>
          </div>
          <button onClick={onClose} className="btn-icon"><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div className="flex" style={{ borderBottom:'1.5px solid #e8e4dc' }}>
          {(['login','register'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setErrors({}); }}
              className="flex-1 py-3.5 text-sm font-semibold transition-all"
              style={{
                color: tab===t ? '#b85c38' : '#737373',
                borderBottom: `2px solid ${tab===t ? '#b85c38' : 'transparent'}`,
                marginBottom: '-1px',
              }}>
              {t==='login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === 'login' ? (
            <form onSubmit={handleLogin} noValidate className="space-y-4">
              <div>
                <label className="form-label">Email Address</label>
                <input type="email" value={loginEmail} onChange={e=>setLoginEmail(e.target.value)}
                  placeholder="your@email.com" className="form-input" autoComplete="email" autoFocus />
              </div>
              <div>
                <label className="form-label">Password</label>
                <div className="relative">
                  <input type={showPass?'text':'password'} value={loginPass}
                    onChange={e=>setLoginPass(e.target.value)}
                    placeholder="Enter your password" className="form-input" style={{ paddingRight:'2.75rem' }}
                    autoComplete="current-password" />
                  <button type="button" onClick={()=>setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color:'#737373' }}>
                    {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="btn btn-primary w-full" style={{ padding:'0.875rem', fontSize:'1rem', marginTop:'0.5rem' }}>
                {loading ? <Loader2 size={18} className="animate-spin"/> : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} noValidate className="space-y-4">
              {[
                { label:'Full Name', key:'name', type:'text', val:regName, set:setRegName, ph:'Sylvia Wakhisi', ac:'name' },
                { label:'Email Address', key:'email', type:'email', val:regEmail, set:setRegEmail, ph:'your@email.com', ac:'email' },
              ].map(f => (
                <div key={f.key}>
                  <label className="form-label">{f.label} <span style={{ color:'#b85c38' }}>*</span></label>
                  <input type={f.type} value={f.val}
                    onChange={e=>{ f.set(e.target.value); setErrors(p=>({...p,[f.key]:''})); }}
                    placeholder={f.ph} className="form-input"
                    style={errors[f.key]?{borderColor:'#b85c38'}:{}}
                    autoComplete={f.ac} />
                  {errors[f.key] && <p className="text-xs mt-1" style={{ color:'#b85c38' }}>{errors[f.key]}</p>}
                </div>
              ))}
              <div>
                <label className="form-label">Password <span style={{ color:'#b85c38' }}>*</span></label>
                <div className="relative">
                  <input type={showPass?'text':'password'} value={regPass}
                    onChange={e=>{ setRegPass(e.target.value); setErrors(p=>({...p,password:''})); }}
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
                    className="form-input" style={{ paddingRight:'2.75rem', ...(errors.password?{borderColor:'#b85c38'}:{}) }}
                    autoComplete="new-password" />
                  <button type="button" onClick={()=>setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color:'#737373' }}>
                    {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
                {errors.password && <p className="text-xs mt-1" style={{ color:'#b85c38' }}>{errors.password}</p>}
                {regPass && (
                  <div className="flex gap-1 mt-2">
                    {[regPass.length>=8, /[A-Z]/.test(regPass), /[0-9]/.test(regPass), regPass.length>=12].map((ok,i)=>(
                      <div key={i} className="h-1 flex-1 rounded-full transition-colors"
                        style={{ background: ok ? '#2d6a4f' : '#e8e4dc' }} />
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="form-label">Country <span className="normal-case font-normal text-xs" style={{ color:'#737373' }}>(optional)</span></label>
                <select value={regCountry} onChange={e=>setRegCountry(e.target.value)} className="form-input">
                  <option value="">Select your country</option>
                  {COUNTRIES.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button type="submit" disabled={loading}
                className="btn btn-primary w-full" style={{ padding:'0.875rem', fontSize:'1rem', marginTop:'0.5rem' }}>
                {loading ? <Loader2 size={18} className="animate-spin"/> : 'Create My Account'}
              </button>
              <p className="text-center text-xs" style={{ color:'#737373' }}>
                By joining you agree to our{' '}
                <span className="cursor-pointer hover:underline" style={{ color:'#b85c38' }}>Terms of Service</span>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

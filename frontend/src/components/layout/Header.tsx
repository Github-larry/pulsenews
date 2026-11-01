'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Search, PenLine, Menu, X, ChevronDown, User, FileText, ShieldCheck, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { getStoredUser, getStoredToken, clearAuth, AuthUser } from '@/store/authStore';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const CATS = [
  { label: 'All Stories',  href: '/' },
  { label: 'Politics',     href: '/?category=Politics' },
  { label: 'Business',     href: '/?category=Business' },
  { label: 'Technology',   href: '/?category=Technology' },
  { label: 'Health',       href: '/?category=Health' },
  { label: 'Sports',       href: '/?category=Sports' },
  { label: 'Culture',      href: '/?category=Culture' },
  { label: 'Environment',  href: '/?category=Environment' },
];

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

interface Props { onAuthClick?: () => void }

export function Header({ onAuthClick }: Props) {
  const router   = useRouter();
  const pathname = usePathname();
  const [user, setUser]           = useState<AuthUser | null>(null);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [ddOpen, setDdOpen]       = useState(false);
  const [searchQ, setSearchQ]     = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled]   = useState(false);
  const ddRef    = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Sync user from localStorage
  useEffect(() => {
    setUser(getStoredUser());
    const handler = () => setUser(getStoredUser());
    window.addEventListener('tws-auth-change', handler);
    return () => window.removeEventListener('tws-auth-change', handler);
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (ddRef.current && !ddRef.current.contains(e.target as Node)) setDdOpen(false);
    }
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 80);
  }, [searchOpen]);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); setDdOpen(false); }, [pathname]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQ.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQ.trim())}`);
      setSearchQ(''); setSearchOpen(false); setMenuOpen(false);
    }
  }

  async function handleLogout() {
    try {
      const token = getStoredToken();
      await fetch(`${API}/auth/logout`, {
        method: 'POST', credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {}
    clearAuth();
    setDdOpen(false); setMenuOpen(false);
    toast.success('See you next time! 👋');
    router.push('/');
  }

  return (
    <>
      {/* Breaking ticker */}
      <div className="bg-accent overflow-hidden" style={{ background: '#b85c38' }}>
        <div className="container-main flex items-center gap-3 py-2">
          <span className="shrink-0 text-white text-[10px] font-bold uppercase tracking-widest
            bg-white/20 px-2.5 py-1 rounded-full">🔴 Live</span>
          <div className="overflow-hidden flex-1">
            <div className="flex gap-16 animate-ticker whitespace-nowrap text-xs font-medium text-white/90">
              {['Real stories from real communities','Share your voice and be heard',
                'Community journalism that matters','Pulse Media',
                'Real stories from real communities','Share your voice and be heard',
                'Community journalism that matters','Pulse Media',
              ].map((t, i) => <span key={i} className={i%2===1?'opacity-30':''}>{i%2===1?'·':t}</span>)}
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header className={`sticky top-0 z-40 border-b transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-xl shadow-sm' : 'bg-white'
      }`} style={{ borderColor: '#e8e4dc' }}>
        <div className="container-main h-16 flex items-center gap-3">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md
                group-hover:scale-105 transition-transform"
                style={{ background: '#b85c38' }}>
                <span className="font-display font-black text-white text-lg leading-none">S</span>
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
                style={{ background: '#c9963a' }} />
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="font-display font-bold text-base sm:text-lg leading-none"
                style={{ color: '#1a1a1a' }}>
                Tales <span style={{ color: '#b85c38' }}>with Pulsemedia</span>
              </div>
              <div className="text-[10px] font-medium tracking-wider uppercase mt-0.5"
                style={{ color: '#737373' }}>
                pulsemedia · Community Stories
              </div>
            </div>
          </Link>

          {/* Desktop search */}
          <div className="flex-1 max-w-sm hidden md:block">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: '#9ca3af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input type="search" value={searchQ} onChange={e => setSearchQ(e.target.value)}
                  placeholder="Search stories, topics, places..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={{ background:'#f5f3ee', border:'1.5px solid #e8e4dc', color:'#1a1a1a' }}
                  onFocus={e => { e.target.style.borderColor='#b85c38'; e.target.style.background='white'; }}
                  onBlur={e  => { e.target.style.borderColor='#e8e4dc'; e.target.style.background='#f5f3ee'; }}
                />
              </div>
            </form>
          </div>

          <div className="flex-1" />

          {/* Desktop actions */}
          <div className="hidden sm:flex items-center gap-2">
            {user ? (
              <>
                <Link href="/submit"
                  className="btn btn-primary btn-sm flex items-center gap-1.5">
                  <PenLine size={13} /> Share Story
                </Link>
                <div ref={ddRef} className="relative">
                  <button onClick={() => setDdOpen(!ddOpen)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl transition-all hover:bg-paper-warm"
                    style={{ border: '1.5px solid transparent' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor='#e8e4dc')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor='transparent')}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold overflow-hidden"
                      style={{ background: '#b85c38' }}>
                      {user.avatarUrl
                        ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                        : initials(user.name)
                      }
                    </div>
                    <span className="text-sm font-medium hidden lg:block max-w-[80px] truncate"
                      style={{ color: '#1a1a1a' }}>
                      {user.name.split(' ')[0]}
                    </span>
                    <ChevronDown size={13} style={{ color:'#737373', transform: ddOpen?'rotate(180deg)':'', transition:'transform 0.2s' }} />
                  </button>

                  {ddOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl z-50 overflow-hidden animate-modal-in"
                      style={{ border:'1.5px solid #e8e4dc', boxShadow:'0 20px 60px rgba(0,0,0,0.15)' }}>
                      <div className="px-4 py-3.5" style={{ background:'#f5f3ee', borderBottom:'1.5px solid #e8e4dc' }}>
                        <p className="text-sm font-bold truncate" style={{ color:'#1a1a1a' }}>{user.name}</p>
                        <p className="text-xs truncate mt-0.5" style={{ color:'#737373' }}>{user.email}</p>
                        {user.role === 'ADMIN' && (
                          <span className="mt-1.5 inline-block text-[10px] font-bold uppercase tracking-widest
                            text-white px-2 py-0.5 rounded-full" style={{ background:'#b85c38' }}>Admin</span>
                        )}
                      </div>
                      <div className="py-1.5">
                        {[
                          { icon: User,         label: 'My Profile',       href: '/profile' },
                          { icon: FileText,     label: 'My Stories',       href: '/my-stories' },
                          ...(user.role==='ADMIN' ? [{ icon: ShieldCheck, label: 'Admin Dashboard', href: '/admin' }] : []),
                        ].map(item => (
                          <Link key={item.href} href={item.href} onClick={() => setDdOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                            style={{ color:'#3d3d3d' }}
                            onMouseEnter={e => (e.currentTarget.style.background='#f5f3ee')}
                            onMouseLeave={e => (e.currentTarget.style.background='')}>
                            <item.icon size={14} style={{ color:'#737373' }} />
                            {item.label}
                          </Link>
                        ))}
                        <div style={{ borderTop:'1px solid #e8e4dc', margin:'4px 0' }} />
                        <button onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left"
                          style={{ color:'#b85c38' }}
                          onMouseEnter={e => (e.currentTarget.style.background='#fdf0eb')}
                          onMouseLeave={e => (e.currentTarget.style.background='')}>
                          <LogOut size={14} /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button onClick={onAuthClick} className="btn btn-ghost btn-sm">Sign In</button>
                <button onClick={onAuthClick} className="btn btn-primary btn-sm">Join Now</button>
              </>
            )}
          </div>

          {/* Mobile actions */}
          <div className="flex items-center gap-1 sm:hidden">
            <button onClick={() => setSearchOpen(!searchOpen)} className="btn-icon">
              {searchOpen ? <X size={18} /> : <Search size={18} />}
            </button>
            <button onClick={() => setMenuOpen(!menuOpen)} className="btn-icon">
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        {searchOpen && (
          <div className="sm:hidden px-4 pb-3" style={{ borderTop:'1px solid #e8e4dc', background:'white' }}>
            <form onSubmit={handleSearch} className="pt-3">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color:'#9ca3af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input ref={searchRef} type="search" value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  placeholder="Search stories..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background:'#f5f3ee', border:'1.5px solid #e8e4dc' }}
                />
              </div>
            </form>
          </div>
        )}

        {/* Category nav */}
        <nav style={{ borderTop:'1px solid #e8e4dc', background:'white' }}>
          <div className="container-main flex overflow-x-auto scrollbar-hide">
            {CATS.map(cat => (
              <Link key={cat.label} href={cat.href}
                className="shrink-0 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-all"
                style={{ color:'#737373', borderBottom:'2px solid transparent' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color='#1a1a1a'; (e.currentTarget as HTMLElement).style.borderBottomColor='#b85c38'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color='#737373'; (e.currentTarget as HTMLElement).style.borderBottomColor='transparent'; }}>
                {cat.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white flex flex-col overflow-y-auto"
            style={{ boxShadow:'-20px 0 60px rgba(0,0,0,0.15)' }}>
            <div className="flex items-center justify-between p-5"
              style={{ borderBottom:'1.5px solid #e8e4dc' }}>
              <div>
                <div className="font-display font-bold text-lg">
                  Tales <span style={{ color:'#b85c38' }}>with Sylvia</span>
                </div>
                <div className="text-[10px] tracking-wider uppercase mt-0.5" style={{ color:'#737373' }}>
                  Wakhisi · Community Stories
                </div>
              </div>
              <button onClick={() => setMenuOpen(false)} className="btn-icon"><X size={20} /></button>
            </div>

            <div className="flex-1 p-4 space-y-1">
              {user ? (
                <>
                  <div className="p-4 rounded-2xl mb-3" style={{ background:'#f5f3ee' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                        style={{ background:'#b85c38' }}>{initials(user.name)}</div>
                      <div>
                        <p className="font-semibold text-sm">{user.name}</p>
                        <p className="text-xs" style={{ color:'#737373' }}>{user.email}</p>
                      </div>
                    </div>
                  </div>
                  <Link href="/submit"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-white mb-1"
                    style={{ background:'#b85c38' }}>
                    <PenLine size={16} /> Share a Story
                  </Link>
                  {[
                    { icon: User,        label:'My Profile',       href:'/profile' },
                    { icon: FileText,    label:'My Stories',       href:'/my-stories' },
                    ...(user.role==='ADMIN'?[{ icon:ShieldCheck, label:'Admin Dashboard', href:'/admin' }]:[]),
                  ].map(item => (
                    <Link key={item.href} href={item.href}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                      style={{ color:'#3d3d3d' }}
                      onMouseEnter={e=>(e.currentTarget.style.background='#f5f3ee')}
                      onMouseLeave={e=>(e.currentTarget.style.background='')}>
                      <item.icon size={16} style={{ color:'#737373' }} />{item.label}
                    </Link>
                  ))}
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium mt-1 text-left"
                    style={{ color:'#b85c38' }}
                    onMouseEnter={e=>(e.currentTarget.style.background='#fdf0eb')}
                    onMouseLeave={e=>(e.currentTarget.style.background='')}>
                    <LogOut size={16} /> Sign Out
                  </button>
                </>
              ) : (
                <div className="flex gap-2 mb-3">
                  <button onClick={() => { onAuthClick?.(); setMenuOpen(false); }}
                    className="btn btn-ghost flex-1">Sign In</button>
                  <button onClick={() => { onAuthClick?.(); setMenuOpen(false); }}
                    className="btn btn-primary flex-1">Join Now</button>
                </div>
              )}

              <p className="text-[10px] font-bold uppercase tracking-widest px-2 py-2 mt-2"
                style={{ color:'#737373' }}>Browse Topics</p>
              {CATS.map(cat => (
                <Link key={cat.label} href={cat.href}
                  className="flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                  style={{ color:'#3d3d3d' }}
                  onMouseEnter={e=>(e.currentTarget.style.background='#f5f3ee')}
                  onMouseLeave={e=>(e.currentTarget.style.background='')}>
                  {cat.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

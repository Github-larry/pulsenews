'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { getStoredToken, getStoredUser, AuthUser } from '@/store/authStore';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const CATS = ['Politics','Business','Technology','Health','Sports','Culture','Environment','Crime','Other'];

export default function SubmitPage() {
  const router = useRouter();
  const [user, setUser]         = useState<AuthUser|null>(null);
  const [title, setTitle]       = useState('');
  const [desc, setDesc]         = useState('');
  const [category, setCat]      = useState('Politics');
  const [location, setLoc]      = useState('');
  const [imgFile, setImgFile]   = useState<File|null>(null);
  const [imgPrev, setImgPrev]   = useState<string|null>(null);
  const [dragging, setDrag]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);
  const [errors, setErrors]     = useState<Record<string,string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUser(getStoredUser());
    const fn = () => setUser(getStoredUser());
    window.addEventListener('tws-auth-change', fn);
    return () => window.removeEventListener('tws-auth-change', fn);
  }, []);

  function validate() {
    const e: Record<string,string> = {};
    if (!title.trim() || title.trim().length < 10) e.title = 'Title must be at least 10 characters';
    if (!desc.trim()  || desc.trim().length  < 50) e.desc  = `Description needs ${50-desc.trim().length} more characters`;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleImg(file: File) {
    if (!['image/jpeg','image/jpg','image/png','image/webp'].includes(file.type)) {
      toast.error('Only JPEG, PNG, WebP allowed'); return;
    }
    if (file.size > 10*1024*1024) { toast.error('Image must be under 10MB'); return; }
    setImgFile(file);
    const r = new FileReader();
    r.onload = e => setImgPrev(e.target?.result as string);
    r.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = getStoredToken();
    if (!token || !user) {
      toast.error('Please sign in first');
      router.push('/');
      return;
    }
    if (!validate()) { toast.error('Please fix the errors below'); return; }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('title', title.trim());
      form.append('description', desc.trim());
      form.append('category', category);
      if (location.trim()) form.append('location', location.trim());
      if (imgFile) form.append('image', imgFile);

      const res = await fetch(`${API}/posts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
        body: form,
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          const errs: Record<string,string> = {};
          data.errors.forEach((err: {field:string;message:string}) => { errs[err.field] = err.message; });
          setErrors(errs);
          toast.error('Please fix the errors below');
        } else {
          toast.error(data.message || 'Failed to submit story');
        }
        return;
      }
      setDone(true);
    } catch {
      toast.error('Cannot connect to server. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  }

  // ── Not logged in ──────────────────────────────────────────
  if (user === null && typeof window !== 'undefined' && !getStoredToken()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper p-4">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-5">🔒</div>
          <h2 className="font-display text-2xl font-bold mb-2">Sign in required</h2>
          <p className="text-sm mb-6" style={{ color:'#737373' }}>
            You need to be signed in to submit a story.
          </p>
          <button onClick={() => router.push('/')} className="btn btn-primary">
            Go to Home & Sign In
          </button>
        </div>
      </div>
    );
  }

  // ── Success ────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper p-4">
        <div className="text-center max-w-sm">
          <CheckCircle size={64} className="mx-auto mb-5" style={{ color:'#2d6a4f' }}/>
          <h2 className="font-display text-3xl font-bold mb-3">
            {user?.role === 'ADMIN' ? 'Story Published! 🎉' : 'Story Submitted! ✅'}
          </h2>
          <p className="mb-8" style={{ color:'#737373' }}>
            {user?.role === 'ADMIN'
              ? 'Your story is now live on Tales with Sylvia Wakhisi.'
              : 'Your story is under review and will be published once our team approves it.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => router.push('/')} className="btn btn-primary btn-lg">
              Back to Feed
            </button>
            <button
              onClick={() => {
                setDone(false); setTitle(''); setDesc('');
                setLoc(''); setImgFile(null); setImgPrev(null); setCat('Politics');
              }}
              className="btn btn-ghost btn-lg">
              Submit Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-paper">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white flex items-center gap-3 px-4 py-4"
        style={{ borderBottom:'1.5px solid #e8e4dc', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
        <button onClick={() => router.push('/')}
          className="btn-icon" aria-label="Back">
          <ArrowLeft size={20}/>
        </button>
        <div>
          <h1 className="font-display font-bold text-lg leading-none">Share Your Story</h1>
          <p className="text-xs mt-0.5" style={{ color:'#737373' }}>Tales with Sylvia Wakhisi</p>
        </div>
        {user && (
          <div className="ml-auto flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold"
              style={{ background:'#b85c38' }}>
              {user.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}
            </div>
            <span className="text-sm font-medium hidden sm:block" style={{ color:'#1a1a1a' }}>
              {user.name.split(' ')[0]}
            </span>
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} noValidate className="space-y-6">

          {/* Title */}
          <div>
            <label className="form-label">
              Headline <span style={{ color:'#b85c38' }}>*</span>
            </label>
            <input type="text" value={title}
              onChange={e => { setTitle(e.target.value); setErrors(p=>({...p,title:''})); }}
              placeholder="Write a clear, informative headline..."
              className="form-input"
              style={{ fontSize:'1rem', ...(errors.title ? { borderColor:'#b85c38' } : {}) }}
            />
            <div className="flex justify-between mt-1">
              {errors.title
                ? <p className="text-xs" style={{ color:'#b85c38' }}>{errors.title}</p>
                : <span/>
              }
              <span className="text-xs" style={{ color: title.length < 10 ? '#b85c38' : '#737373' }}>
                {title.length}/255
              </span>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="form-label">Category <span style={{ color:'#b85c38' }}>*</span></label>
            <select value={category} onChange={e=>setCat(e.target.value)} className="form-input">
              {CATS.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="form-label">
              Your Story <span style={{ color:'#b85c38' }}>*</span>
            </label>
            <textarea value={desc}
              onChange={e => { setDesc(e.target.value); setErrors(p=>({...p,desc:''})); }}
              rows={10}
              placeholder="Describe what happened — who, what, where, when, and why it matters. Be as detailed as possible. (Minimum 50 characters)"
              className="form-input"
              style={{ resize:'vertical', ...(errors.desc ? { borderColor:'#b85c38' } : {}) }}
            />
            <div className="flex justify-between mt-1">
              {errors.desc
                ? <p className="text-xs" style={{ color:'#b85c38' }}>{errors.desc}</p>
                : <span/>
              }
              <span className="text-xs" style={{ color: desc.length < 50 ? '#b85c38' : '#737373' }}>
                {desc.length} chars {desc.length >= 50 ? '✓' : `(need ${50-desc.length} more)`}
              </span>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="form-label">
              Location{' '}
              <span className="normal-case font-normal" style={{ color:'#737373', fontSize:'0.7rem' }}>
                (optional)
              </span>
            </label>
            <input type="text" value={location} onChange={e=>setLoc(e.target.value)}
              placeholder="e.g. Nairobi, Kenya" className="form-input"/>
          </div>

          {/* Image */}
          <div>
            <label className="form-label">
              Photo{' '}
              <span className="normal-case font-normal" style={{ color:'#737373', fontSize:'0.7rem' }}>
                (optional — requires Cloudinary setup)
              </span>
            </label>
            {imgPrev ? (
              <div className="relative rounded-2xl overflow-hidden" style={{ border:'1.5px solid #e8e4dc' }}>
                <img src={imgPrev} alt="Preview" className="w-full object-cover" style={{ maxHeight:'240px' }}/>
                <button type="button"
                  onClick={() => { setImgFile(null); setImgPrev(null); if(fileRef.current) fileRef.current.value=''; }}
                  className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full
                    transition-colors text-white"
                  style={{ background:'rgba(0,0,0,0.6)' }}>
                  <X size={16}/>
                </button>
              </div>
            ) : (
              <div
                onDragOver={e=>{e.preventDefault();setDrag(true);}}
                onDragLeave={()=>setDrag(false)}
                onDrop={e=>{e.preventDefault();setDrag(false);const f=e.dataTransfer.files[0];if(f)handleImg(f);}}
                onClick={()=>fileRef.current?.click()}
                className="rounded-2xl p-10 text-center cursor-pointer transition-all"
                style={{
                  border:`2px dashed ${dragging?'#b85c38':'#e8e4dc'}`,
                  background: dragging ? '#fdf0eb' : '#f5f3ee',
                }}>
                <Upload size={28} className="mx-auto mb-3" style={{ color:'#737373' }}/>
                <p className="text-sm font-medium" style={{ color:'#3d3d3d' }}>Click or drag & drop</p>
                <p className="text-xs mt-1" style={{ color:'#737373' }}>JPEG, PNG, WebP — max 10MB</p>
                <input ref={fileRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={e=>{const f=e.target.files?.[0];if(f)handleImg(f);}} className="hidden"/>
              </div>
            )}
          </div>

          {/* Guidelines */}
          <div className="rounded-2xl p-5" style={{ background:'#f5f3ee', border:'1.5px solid #e8e4dc' }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color:'#737373' }}>
              Submission Guidelines
            </p>
            <div className="space-y-1.5 text-xs" style={{ color:'#3d3d3d' }}>
              <p>✅ Only submit factual, verified information</p>
              <p>✅ Be accurate about location and timing</p>
              <p>✅ Include as much detail as possible</p>
              <p>❌ No hate speech, misinformation, or spam</p>
              <p>⏳ All stories are reviewed before publication</p>
            </div>
          </div>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row gap-3 pb-8">
            <button type="submit" disabled={loading}
              className="btn btn-primary btn-lg flex-1 justify-center">
              {loading
                ? <><Loader2 size={18} className="animate-spin"/> Submitting...</>
                : '✏️ Submit Story'
              }
            </button>
            <button type="button" onClick={() => router.push('/')} className="btn btn-ghost btn-lg">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

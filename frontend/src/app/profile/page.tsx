'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Loader2, Save, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { api, getApiError } from '@/lib/api';

const COUNTRIES = ['Kenya','Nigeria','Ghana','South Africa','Uganda','Tanzania',
  'Ethiopia','Rwanda','United States','United Kingdom','Canada','Australia','Other'];

interface Post {
  id: string; title: string; status: string;
  likeCount: number; createdAt: string; category: string;
}

export default function ProfilePage() {
  const router  = useRouter();
  const { user, isAuthenticated, ready, updateUser, token } = useAuthStore();

  const [posts,         setPosts]         = useState<Post[]>([]);
  const [loadingPosts,  setLoadingPosts]  = useState(true);
  const [editMode,      setEditMode]      = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [name,          setName]          = useState('');
  const [bio,           setBio]           = useState('');
  const [country,       setCountry]       = useState('');

  // Wait for auth to hydrate before redirecting
  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) { router.replace('/'); return; }
    setName(user?.name ?? '');
    setBio(user?.bio  ?? '');
    setCountry(user?.country ?? '');
  }, [ready, isAuthenticated, user, router]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    api.get('/posts', { params: { authorId: user.id, includeAll: true, limit: 50 } })
      .then(({ data }) => { if (data.success) setPosts(data.data); })
      .catch(() => {})
      .finally(() => setLoadingPosts(false));
  }, [isAuthenticated, user]);

  async function handleSave() {
    setSaving(true);
    try {
      const { data } = await api.patch('/auth/profile', { name, bio, country });
      if (data.success) {
        updateUser(data.data);
        setEditMode(false);
        toast.success('Profile updated!');
      }
    } catch (err) { toast.error(getApiError(err)); }
    finally { setSaving(false); }
  }

  function initials(n: string) { return n.split(' ').map(c=>c[0]).join('').toUpperCase().slice(0,2); }
  function ago(d: string) {
    const diff = Date.now() - new Date(d).getTime();
    const days = Math.floor(diff/86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 30)  return `${days} days ago`;
    return new Date(d).toLocaleDateString();
  }

  if (!ready) return <FullPageLoader />;
  if (!isAuthenticated || !user) return null;

  const approved = posts.filter(p => p.status === 'APPROVED');
  const pending  = posts.filter(p => p.status === 'PENDING');
  const totalLikes = approved.reduce((s, p) => s + p.likeCount, 0);

  return (
    <div className="min-h-screen" style={{ background: '#fdfcf9' }}>
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white flex items-center gap-3 px-4 py-4"
        style={{ borderBottom:'1.5px solid #e8e4dc', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
        <button onClick={() => router.push('/')} className="btn-icon"><ArrowLeft size={20}/></button>
        <h1 className="font-display font-bold text-lg">My Profile</h1>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Cover */}
        <div className="relative rounded-2xl h-36 sm:h-48 mb-16 overflow-hidden"
          style={{ background:'linear-gradient(135deg, #b85c38 0%, #8f4429 50%, #1a1a1a 100%)' }}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage:'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize:'24px 24px' }}/>
          {/* Avatar */}
          <div className="absolute -bottom-10 left-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg overflow-hidden flex items-center justify-center text-white text-2xl font-bold"
                style={{ background:'#b85c38' }}>
                {user.avatarUrl
                  ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover"/>
                  : initials(user.name)
                }
              </div>
            </div>
          </div>
          {/* Edit button */}
          <div className="absolute top-4 right-4">
            <button onClick={() => setEditMode(!editMode)}
              className="btn btn-sm" style={{ background:'rgba(255,255,255,0.2)', color:'white', backdropFilter:'blur(8px)' }}>
              {editMode ? 'Cancel' : '✏️ Edit Profile'}
            </button>
          </div>
        </div>

        {/* Name & info */}
        <div className="mb-8">
          <h2 className="font-display text-2xl font-bold">{user.name}</h2>
          <p className="text-sm mt-0.5" style={{ color:'#737373' }}>{user.email}</p>
          {user.country && <p className="text-sm mt-0.5" style={{ color:'#737373' }}>📍 {user.country}</p>}
          {user.bio && <p className="text-sm mt-2 leading-relaxed max-w-lg" style={{ color:'#3d3d3d' }}>{user.bio}</p>}
          {user.role === 'ADMIN' && (
            <span className="mt-2 inline-block text-[10px] font-bold uppercase tracking-widest text-white px-2.5 py-1 rounded-full"
              style={{ background:'#b85c38' }}>Admin</span>
          )}

          {/* Stats */}
          <div className="flex gap-6 mt-4 pb-4" style={{ borderBottom:'1.5px solid #e8e4dc' }}>
            {[
              { num: posts.length,   label: 'Stories' },
              { num: approved.length,label: 'Published' },
              { num: pending.length, label: 'Pending' },
              { num: totalLikes,     label: 'Likes' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="font-display text-2xl font-bold" style={{ color:'#1a1a1a' }}>{s.num}</div>
                <div className="text-[10px] uppercase tracking-wide" style={{ color:'#737373' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Edit form */}
        {editMode && (
          <div className="rounded-2xl p-5 mb-8 space-y-4"
            style={{ background:'#f5f3ee', border:'1.5px solid #e8e4dc' }}>
            <h3 className="font-semibold">Edit Profile</h3>
            <div>
              <label className="form-label">Full Name</label>
              <input type="text" value={name} onChange={e=>setName(e.target.value)} className="form-input"/>
            </div>
            <div>
              <label className="form-label">Bio</label>
              <textarea value={bio} onChange={e=>setBio(e.target.value)} rows={3}
                placeholder="Tell us about yourself..." className="form-input" style={{ resize:'none' }}/>
            </div>
            <div>
              <label className="form-label">Country</label>
              <select value={country} onChange={e=>setCountry(e.target.value)} className="form-input">
                <option value="">Select country</option>
                {COUNTRIES.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button onClick={handleSave} disabled={saving}
              className="btn btn-primary gap-2">
              {saving ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>}
              Save Changes
            </button>
          </div>
        )}

        {/* My stories */}
        <div>
          <h3 className="section-heading mb-5">My Stories</h3>
          {loadingPosts ? (
            <div className="space-y-3">
              {[...Array(3)].map((_,i) => (
                <div key={i} className="skeleton h-20 w-full rounded-2xl"/>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4" style={{ opacity:0.4 }}>✏️</div>
              <p className="font-semibold mb-1" style={{ color:'#3d3d3d' }}>No stories yet</p>
              <p className="text-sm mb-4" style={{ color:'#737373' }}>Share your first story with the community!</p>
              <button onClick={() => router.push('/submit')} className="btn btn-primary">Submit a Story</button>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map(post => (
                <div key={post.id} className="bg-white rounded-2xl p-4 flex items-center justify-between gap-4"
                  style={{ border:'1.5px solid #e8e4dc' }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge ${
                        post.status==='APPROVED'?'badge-approved':
                        post.status==='PENDING' ?'badge-pending':'badge-rejected'
                      }`}>{post.status.toLowerCase()}</span>
                      <span className="badge badge-blue">{post.category}</span>
                    </div>
                    <p className="text-sm font-semibold truncate" style={{ color:'#1a1a1a' }}>{post.title}</p>
                    <p className="text-xs mt-0.5" style={{ color:'#737373' }}>
                      ❤️ {post.likeCount} · {ago(post.createdAt)}
                    </p>
                  </div>
                  {post.status === 'APPROVED' && (
                    <button onClick={() => router.push(`/news/${post.id}`)}
                      className="btn btn-ghost btn-sm shrink-0">View</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:'#fdfcf9' }}>
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-display font-black text-2xl mx-auto mb-4 animate-pulse"
          style={{ background:'#b85c38' }}>S</div>
        <div className="flex gap-1.5 justify-center">
          {[0,1,2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background:'#b85c38', animationDelay:`${i*0.15}s` }}/>
          ))}
        </div>
      </div>
    </div>
  );
}

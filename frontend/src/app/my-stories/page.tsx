'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, PenLine } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

interface Post { id:string; title:string; status:string; category:string; likeCount:number; commentCount:number; createdAt:string; }

export default function MyStoriesPage() {
  const router = useRouter();
  const { user, isAuthenticated, ready } = useAuthStore();
  const [posts,    setPosts]    = useState<Post[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState<'ALL'|'APPROVED'|'PENDING'|'REJECTED'>('ALL');

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) { router.replace('/'); return; }
    api.get('/posts', { params: { authorId: user?.id, includeAll: true, limit: 100 } })
      .then(({ data }) => { if (data.success) setPosts(data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ready, isAuthenticated, user, router]);

  if (!ready) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin"/></div>;

  const filtered = filter === 'ALL' ? posts : posts.filter(p => p.status === filter);
  const counts = {
    ALL: posts.length,
    APPROVED: posts.filter(p=>p.status==='APPROVED').length,
    PENDING:  posts.filter(p=>p.status==='PENDING').length,
    REJECTED: posts.filter(p=>p.status==='REJECTED').length,
  };

  function ago(d:string) {
    const diff = Date.now() - new Date(d).getTime();
    const days = Math.floor(diff/86400000);
    if (days===0) return 'Today'; if(days===1) return 'Yesterday'; if(days<30) return `${days}d ago`;
    return new Date(d).toLocaleDateString();
  }

  return (
    <div className="min-h-screen" style={{ background:'#fdfcf9' }}>
      <div className="sticky top-0 z-10 bg-white flex items-center justify-between px-4 py-4"
        style={{ borderBottom:'1.5px solid #e8e4dc', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center gap-3">
          <button onClick={()=>router.push('/')} className="btn-icon"><ArrowLeft size={20}/></button>
          <h1 className="font-display font-bold text-lg">My Stories</h1>
        </div>
        <Link href="/submit" className="btn btn-primary btn-sm gap-1.5"><PenLine size={13}/>New Story</Link>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Filter tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit" style={{ background:'#f5f3ee', border:'1.5px solid #e8e4dc' }}>
          {(['ALL','APPROVED','PENDING','REJECTED'] as const).map(f => (
            <button key={f} onClick={()=>setFilter(f)}
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{ background:filter===f?'white':'transparent', color:filter===f?'#1a1a1a':'#737373',
                       boxShadow:filter===f?'0 1px 3px rgba(0,0,0,0.08)':'' }}>
              {f.charAt(0)+f.slice(1).toLowerCase()} ({counts[f]})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(5)].map((_,i)=><div key={i} className="skeleton h-20 w-full rounded-2xl"/>)}</div>
        ) : filtered.length===0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4" style={{ opacity:0.4 }}>📭</div>
            <p className="font-semibold mb-4" style={{ color:'#3d3d3d' }}>No {filter.toLowerCase()} stories</p>
            {filter==='ALL' && <Link href="/submit" className="btn btn-primary">Submit Your First Story</Link>}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(post => (
              <div key={post.id} className="bg-white rounded-2xl p-4 flex items-center justify-between gap-4"
                style={{ border:'1.5px solid #e8e4dc' }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`badge ${post.status==='APPROVED'?'badge-approved':post.status==='PENDING'?'badge-pending':'badge-rejected'}`}>
                      {post.status.toLowerCase()}
                    </span>
                    <span className="badge badge-blue">{post.category}</span>
                  </div>
                  <p className="text-sm font-semibold truncate" style={{ color:'#1a1a1a' }}>{post.title}</p>
                  <p className="text-xs mt-0.5" style={{ color:'#737373' }}>❤️ {post.likeCount} · 💬 {post.commentCount} · {ago(post.createdAt)}</p>
                </div>
                {post.status==='APPROVED' && (
                  <Link href={`/news/${post.id}`} className="btn btn-ghost btn-sm shrink-0">View</Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

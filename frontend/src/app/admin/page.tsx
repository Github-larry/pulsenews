'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, Eye, FileText, Users, Clock, Flag } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

type Tab = 'pending' | 'all' | 'users' | 'reports';

interface Post { id:string; title:string; status:string; category:string; location?:string; likeCount:number; commentCount:number; createdAt:string; author:{ name:string }; }
interface User { id:string; name:string; email:string; role:string; status:string; country?:string; createdAt:string; }
interface Report { id:string; reason:string; status:string; createdAt:string; post:{ id:string; title:string }; reportedBy:{ name:string }; }
interface Stats { totalPosts:number; pendingPosts:number; approvedPosts:number; totalUsers:number; openReports:number; totalLikes:number; }

function ago(d:string) {
  const diff = Date.now()-new Date(d).getTime(); const h = Math.floor(diff/3600000);
  if(h<1) return 'Just now'; if(h<24) return `${h}h ago`; return `${Math.floor(h/24)}d ago`;
}

export default function AdminPage() {
  const router  = useRouter();
  const { user, isAuthenticated, ready } = useAuthStore();
  const [tab,     setTab]     = useState<Tab>('pending');
  const [stats,   setStats]   = useState<Stats|null>(null);
  const [posts,   setPosts]   = useState<Post[]>([]);
  const [users,   setUsers]   = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated || user?.role !== 'ADMIN') { router.replace('/'); return; }
    loadAll();
  }, [ready, isAuthenticated, user, router]);

  async function loadAll() {
    setLoading(true);
    try {
      const [statsRes, postsRes, usersRes, reportsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/posts', { params:{ limit:100 } }),
        api.get('/admin/users', { params:{ limit:100 } }),
        api.get('/admin/reports', { params:{ limit:100 } }),
      ]);
      if(statsRes.data.success)   setStats(statsRes.data.data);
      if(postsRes.data.success)   setPosts(postsRes.data.data);
      if(usersRes.data.success)   setUsers(usersRes.data.data);
      if(reportsRes.data.success) setReports(reportsRes.data.data);
    } catch { toast.error('Failed to load dashboard'); }
    finally { setLoading(false); }
  }

  async function moderate(postId:string, status:'approved'|'rejected') {
    try {
      await api.patch(`/admin/posts/${postId}/moderate`, { status: status.toUpperCase() });
      setPosts(prev => prev.map(p => p.id===postId ? {...p, status:status.toUpperCase()} : p));
      if(stats) setStats({...stats,
        pendingPosts:  Math.max(0,stats.pendingPosts-1),
        approvedPosts: status==='approved'?stats.approvedPosts+1:stats.approvedPosts,
      });
      toast.success(status==='approved'?'Post approved!':'Post rejected');
    } catch { toast.error('Failed'); }
  }

  async function toggleBan(userId:string, currentStatus:string) {
    const newStatus = currentStatus==='BANNED'?'ACTIVE':'BANNED';
    try {
      await api.patch(`/admin/users/${userId}/status`, { status:newStatus });
      setUsers(prev => prev.map(u => u.id===userId ? {...u,status:newStatus} : u));
      toast.success(newStatus==='BANNED'?'User banned':'User unbanned');
    } catch { toast.error('Failed'); }
  }

  async function resolveReport(reportId:string) {
    try {
      await api.patch(`/admin/reports/${reportId}/resolve`);
      setReports(prev => prev.map(r => r.id===reportId ? {...r,status:'RESOLVED'} : r));
      toast.success('Report resolved');
    } catch { toast.error('Failed'); }
  }

  if (!ready || loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:'#fdfcf9' }}>
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-display font-black text-2xl mx-auto mb-4" style={{ background:'#b85c38' }}>S</div>
        <div className="flex gap-1.5 justify-center">
          {[0,1,2].map(i=><div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background:'#b85c38',animationDelay:`${i*0.15}s` }}/>)}
        </div>
      </div>
    </div>
  );

  if (!isAuthenticated || user?.role !== 'ADMIN') return null;

  const pending  = posts.filter(p=>p.status==='PENDING');
  const allPosts = [...posts].sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());

  const STAT_CARDS = [
    { label:'Total Posts',   val:stats?.totalPosts??0,    icon:FileText, color:'#fdf0eb', textColor:'#b85c38' },
    { label:'Pending',       val:stats?.pendingPosts??0,   icon:Clock,    color:'#fdf5e4', textColor:'#8a6520' },
    { label:'Users',         val:stats?.totalUsers??0,     icon:Users,    color:'#e8f0fb', textColor:'#1d5fa8' },
    { label:'Open Reports',  val:stats?.openReports??0,    icon:Flag,     color:'#fdf0eb', textColor:'#b85c38' },
  ];

  return (
    <div className="min-h-screen" style={{ background:'#fdfcf9' }}>
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white flex items-center justify-between px-4 py-4"
        style={{ borderBottom:'1.5px solid #e8e4dc', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center gap-3">
          <button onClick={()=>router.push('/')} className="btn-icon"><ArrowLeft size={20}/></button>
          <div>
            <h1 className="font-display font-bold text-lg leading-none">Admin Dashboard</h1>
            <p className="text-xs mt-0.5" style={{ color:'#737373' }}>Tales with Sylvia Wakhisi</p>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {STAT_CARDS.map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 flex items-center gap-3"
              style={{ border:'1.5px solid #e8e4dc' }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background:s.color }}>
                <s.icon size={18} style={{ color:s.textColor }}/>
              </div>
              <div>
                <div className="font-display text-2xl font-bold leading-none" style={{ color:'#1a1a1a' }}>
                  {s.val}
                </div>
                <div className="text-[10px] uppercase tracking-wide mt-0.5" style={{ color:'#737373' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-0 w-fit rounded-xl overflow-hidden mb-6"
          style={{ border:'1.5px solid #e8e4dc' }}>
          {([
            { key:'pending' as Tab, label:`⏳ Pending (${pending.length})` },
            { key:'all'     as Tab, label:'📰 All Posts' },
            { key:'users'   as Tab, label:`👥 Users (${users.length})` },
            { key:'reports' as Tab, label:`🚩 Reports (${reports.filter(r=>r.status==='OPEN').length})` },
          ]).map((t,i) => (
            <button key={t.key} onClick={()=>setTab(t.key)}
              className="px-4 py-2.5 text-xs font-semibold transition-all whitespace-nowrap"
              style={{
                background:tab===t.key?'#b85c38':'white',
                color:tab===t.key?'white':'#737373',
                borderLeft:i>0?'1.5px solid #e8e4dc':'none',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Pending */}
        {tab==='pending' && (
          pending.length===0
            ? <Empty icon="✅" title="All caught up!" msg="No posts pending review."/>
            : <div className="space-y-3">
                {pending.map(p => (
                  <div key={p.id} className="bg-white rounded-2xl p-4"
                    style={{ border:'1.5px solid #e8e4dc' }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="badge badge-pending">{p.category}</span>
                          {p.location && <span className="text-xs" style={{ color:'#737373' }}>📍{p.location}</span>}
                        </div>
                        <p className="text-sm font-semibold" style={{ color:'#1a1a1a' }}>{p.title}</p>
                        <p className="text-xs mt-0.5" style={{ color:'#737373' }}>By {p.author.name} · {ago(p.createdAt)}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Link href={`/news/${p.id}`} className="table-action-btn view"><Eye size={12}/>View</Link>
                        <button onClick={()=>moderate(p.id,'approved')} className="table-action-btn approve"><CheckCircle size={12}/>Approve</button>
                        <button onClick={()=>moderate(p.id,'rejected')} className="table-action-btn reject"><XCircle size={12}/>Reject</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
        )}

        {/* All posts */}
        {tab==='all' && (
          <div className="overflow-x-auto rounded-2xl" style={{ border:'1.5px solid #e8e4dc' }}>
            <table className="data-table">
              <thead><tr><th>Title</th><th>Author</th><th>Category</th><th>Status</th><th>Likes</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                {allPosts.map(p => (
                  <tr key={p.id}>
                    <td style={{ maxWidth:'220px' }}><div style={{ overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'220px' }}>{p.title}</div></td>
                    <td style={{ whiteSpace:'nowrap' }}>{p.author.name}</td>
                    <td>{p.category}</td>
                    <td><span className={`badge ${p.status==='APPROVED'?'badge-approved':p.status==='PENDING'?'badge-pending':'badge-rejected'}`}>{p.status.toLowerCase()}</span></td>
                    <td>{p.likeCount}</td>
                    <td style={{ whiteSpace:'nowrap' }}>{ago(p.createdAt)}</td>
                    <td>
                      <div className="flex gap-1.5">
                        {p.status==='APPROVED' && <Link href={`/news/${p.id}`} className="table-action-btn view"><Eye size={12}/>View</Link>}
                        {p.status!=='APPROVED' && <button onClick={()=>moderate(p.id,'approved')} className="table-action-btn approve"><CheckCircle size={12}/>Approve</button>}
                        {p.status!=='REJECTED' && <button onClick={()=>moderate(p.id,'rejected')} className="table-action-btn reject"><XCircle size={12}/>Reject</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Users */}
        {tab==='users' && (
          <div className="overflow-x-auto rounded-2xl" style={{ border:'1.5px solid #e8e4dc' }}>
            <table className="data-table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Country</th><th>Joined</th><th>Actions</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="font-semibold">{u.name}</td>
                    <td style={{ color:'#737373' }}>{u.email}</td>
                    <td><span className="text-[10px] font-bold uppercase tracking-wider" style={{ color:u.role==='ADMIN'?'#b85c38':'#737373' }}>{u.role}</span></td>
                    <td><span className={`badge ${u.status==='ACTIVE'?'badge-approved':u.status==='BANNED'?'badge-rejected':'badge-pending'}`}>{u.status.toLowerCase()}</span></td>
                    <td style={{ color:'#737373' }}>{u.country??'—'}</td>
                    <td style={{ color:'#737373',whiteSpace:'nowrap' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      {u.id!==user?.id && (
                        <button onClick={()=>toggleBan(u.id,u.status)}
                          className={`table-action-btn ${u.status==='BANNED'?'approve':'reject'}`}>
                          {u.status==='BANNED'?'Unban':'Ban'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Reports */}
        {tab==='reports' && (
          reports.length===0
            ? <Empty icon="🚩" title="No reports" msg="No content has been reported."/>
            : <div className="space-y-3">
                {reports.map(r => (
                  <div key={r.id} className="bg-white rounded-2xl p-4"
                    style={{ border:'1.5px solid #e8e4dc' }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color:'#1a1a1a' }}>{r.post.title}</p>
                        <p className="text-xs mt-0.5" style={{ color:'#737373' }}>
                          Reported by {r.reportedBy.name} · {r.reason.replace('_',' ').toLowerCase()} · {ago(r.createdAt)}
                        </p>
                        <span className={`badge mt-1 ${r.status==='OPEN'?'badge-pending':'badge-approved'}`}>{r.status.toLowerCase()}</span>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Link href={`/news/${r.post.id}`} className="table-action-btn view"><Eye size={12}/>View</Link>
                        {r.status==='OPEN' && (
                          <button onClick={()=>resolveReport(r.id)} className="table-action-btn approve"><CheckCircle size={12}/>Resolve</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
        )}
      </div>
    </div>
  );
}

function Empty({ icon, title, msg }: { icon:string; title:string; msg:string }) {
  return (
    <div className="text-center py-20">
      <div className="text-5xl mb-4" style={{ opacity:0.4 }}>{icon}</div>
      <p className="font-semibold mb-1" style={{ color:'#3d3d3d' }}>{title}</p>
      <p className="text-sm" style={{ color:'#737373' }}>{msg}</p>
    </div>
  );
}

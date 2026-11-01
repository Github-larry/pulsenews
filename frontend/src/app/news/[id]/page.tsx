'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Heart, MessageCircle, Share2, MapPin, Eye, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { api, getApiError } from '@/lib/api';
import { AuthModal } from '@/components/auth/AuthModal';

interface Comment { id:string; content:string; createdAt:string; author:{ name:string; avatarUrl?:string }; }
interface Post {
  id:string; title:string; description:string; category:string;
  imageUrl?:string; location?:string; status:string; featured:boolean;
  viewCount:number; likeCount:number; commentCount:number; isLiked?:boolean;
  createdAt:string; comments:Comment[];
  author:{ id:string; name:string; avatarUrl?:string; country?:string };
}

function initials(n:string) { return n.split(' ').map(c=>c[0]).join('').toUpperCase().slice(0,2); }
function catStyle(cat:string) {
  const m: Record<string,string> = { Politics:'badge-accent',Business:'badge-green',Technology:'badge-blue',
    Health:'badge-green',Sports:'badge-blue',Culture:'badge-gold',Environment:'badge-green',Crime:'badge-accent' };
  return `badge ${m[cat]??'badge-accent'}`;
}

export default function NewsDetailPage() {
  const { id }   = useParams<{ id:string }>();
  const router   = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [post,       setPost]       = useState<Post|null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [authModal,  setAuthModal]  = useState(false);
  const [comment,    setComment]    = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [liking,     setLiking]     = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/posts/${id}`)
      .then(({ data }) => { if (data.success) setPost(data.data); else setError('Post not found'); })
      .catch(() => setError('Failed to load story'))
      .finally(() => setLoading(false));
  }, [id]);

  async function toggleLike() {
    if (!isAuthenticated) { setAuthModal(true); return; }
    if (liking || !post) return;
    setLiking(true);
    const wasLiked = post.isLiked;
    setPost(p => p ? { ...p, isLiked:!p.isLiked, likeCount:p.isLiked?p.likeCount-1:p.likeCount+1 } : p);
    try {
      await api.post(`/posts/${id}/like`);
    } catch {
      setPost(p => p ? { ...p, isLiked:wasLiked, likeCount:wasLiked?p.likeCount+1:p.likeCount-1 } : p);
    } finally { setLiking(false); }
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!isAuthenticated) { setAuthModal(true); return; }
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/posts/${id}/comments`, { content: comment.trim() });
      toast.success('Comment posted!');
      setComment('');
      // Reload post to get updated comments
      const { data } = await api.get(`/posts/${id}`);
      if (data.success) setPost(data.data);
    } catch (err) { toast.error(getApiError(err)); }
    finally { setSubmitting(false); }
  }

  async function handleShare() {
    const pageUrl   = `${window.location.origin}/news/${post?.id}`;
    const shareData = {
      title: post?.title ?? 'Tales with Sylvia Wakhisi',
      text:  post?.description?.slice(0, 120) ?? '',
      url:   pageUrl,
    };
    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(pageUrl);
        toast.success('Link copied to clipboard! 📋');
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      toast.success(`Copy this link: ${pageUrl}`);
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:'#fdfcf9' }}>
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-display font-black text-2xl mx-auto mb-4 animate-pulse" style={{ background:'#b85c38' }}>S</div>
        <div className="flex gap-1.5 justify-center">
          {[0,1,2].map(i=><div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background:'#b85c38',animationDelay:`${i*0.15}s` }}/>)}
        </div>
      </div>
    </div>
  );

  if (error || !post) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background:'#fdfcf9' }}>
      <div className="text-center">
        <div className="text-6xl mb-4" style={{ opacity:0.4 }}>📭</div>
        <h2 className="font-display text-2xl font-bold mb-2">Story Not Found</h2>
        <p className="mb-6" style={{ color:'#737373' }}>{error || 'This story may have been removed.'}</p>
        <button onClick={()=>router.push('/')} className="btn btn-primary">← Back to Feed</button>
      </div>
    </div>
  );

  const ago = formatDistanceToNow(new Date(post.createdAt), { addSuffix:true });

  return (
    <div className="min-h-screen" style={{ background:'#fdfcf9' }}>
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white flex items-center gap-3 px-4 py-4"
        style={{ borderBottom:'1.5px solid #e8e4dc', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
        <button onClick={()=>router.back()} className="btn-icon"><ArrowLeft size={20}/></button>
        <span className={catStyle(post.category)}>{post.category}</span>
        <div className="flex-1"/>
        <button onClick={handleShare} className="btn-icon"><Share2 size={18}/></button>
      </div>

      <article className="max-w-3xl mx-auto px-4 py-8">
        {/* Title */}
        <h1 className="font-display font-bold leading-tight mb-5"
          style={{ fontSize:'clamp(1.5rem,4vw,2.5rem)', color:'#1a1a1a' }}>
          {post.title}
        </h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 py-4 mb-6"
          style={{ borderTop:'1.5px solid #e8e4dc', borderBottom:'1.5px solid #e8e4dc' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold overflow-hidden"
              style={{ background:'#b85c38' }}>
              {post.author.avatarUrl ? <img src={post.author.avatarUrl} alt={post.author.name} className="w-full h-full object-cover"/> : initials(post.author.name)}
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color:'#1a1a1a' }}>{post.author.name}</p>
              <p className="text-xs" style={{ color:'#737373' }}>{ago}</p>
            </div>
          </div>
          {post.location && (
            <span className="flex items-center gap-1.5 text-sm" style={{ color:'#737373' }}>
              <MapPin size={14}/>{post.location}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-sm" style={{ color:'#737373' }}>
            <Eye size={14}/>{post.viewCount.toLocaleString()} views
          </span>
        </div>

        {/* Image */}
        {post.imageUrl && (
          <div className="relative rounded-2xl overflow-hidden mb-8" style={{ aspectRatio:'16/9' }}>
            <Image src={post.imageUrl} alt={post.title} fill className="object-cover" priority sizes="(max-width:768px)100vw,768px"/>
          </div>
        )}

        {/* Body */}
        <div className="mb-8">
          {post.description.split('\n\n').map((para,i) => (
            <p key={i} className="mb-5 leading-relaxed" style={{ fontSize:'1.0625rem', color:'#3d3d3d' }}>
              {para}
            </p>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 py-4 mb-8"
          style={{ borderTop:'1.5px solid #e8e4dc', borderBottom:'1.5px solid #e8e4dc' }}>
          <button onClick={toggleLike} disabled={liking}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: post.isLiked ? '#b85c38' : '#f5f3ee',
              color: post.isLiked ? 'white' : '#3d3d3d',
              border: '1.5px solid',
              borderColor: post.isLiked ? '#b85c38' : '#e8e4dc',
            }}>
            <Heart size={15} fill={post.isLiked?'currentColor':'none'}/>
            {post.likeCount} {post.likeCount===1?'Like':'Likes'}
          </button>
          <button
            onClick={() => document.getElementById('comments')?.scrollIntoView({behavior:'smooth'})}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background:'#f5f3ee', color:'#3d3d3d', border:'1.5px solid #e8e4dc' }}>
            <MessageCircle size={15}/>{post.commentCount} Comments
          </button>
          <button onClick={handleShare}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background:'#f5f3ee', color:'#3d3d3d', border:'1.5px solid #e8e4dc' }}>
            <Share2 size={15}/>Share
          </button>
        </div>

        {/* Comments */}
        <section id="comments">
          <h3 className="section-heading mb-6">
            Comments ({post.comments?.length ?? 0})
          </h3>

          {/* Comment input */}
          <form onSubmit={submitComment} className="flex gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ background:'#b85c38' }}>
              {isAuthenticated && user ? initials(user.name) : '?'}
            </div>
            <div className="flex-1">
              <textarea value={comment} onChange={e=>setComment(e.target.value)}
                placeholder={isAuthenticated?'Share your thoughts...':'Sign in to join the conversation'}
                disabled={!isAuthenticated} rows={3}
                className="form-input mb-2"
                style={{ resize:'none' }}/>
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color:'#737373' }}>{comment.length}/1000</span>
                {isAuthenticated ? (
                  <button type="submit" disabled={!comment.trim()||submitting} className="btn btn-primary btn-sm">
                    {submitting?<Loader2 size={13} className="animate-spin"/>:null} Post Comment
                  </button>
                ) : (
                  <button type="button" onClick={()=>setAuthModal(true)} className="btn btn-ghost btn-sm">
                    Sign in to comment
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* Comment list */}
          {!post.comments?.length ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3" style={{ opacity:0.4 }}>💬</div>
              <p className="text-sm" style={{ color:'#737373' }}>No comments yet. Be the first!</p>
            </div>
          ) : (
            <div className="space-y-0" style={{ borderTop:'1.5px solid #e8e4dc' }}>
              {post.comments.map(c => (
                <div key={c.id} className="flex gap-3 py-4" style={{ borderBottom:'1.5px solid #e8e4dc' }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                    style={{ background:'#b85c38' }}>{initials(c.author.name)}</div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm font-semibold" style={{ color:'#1a1a1a' }}>{c.author.name}</span>
                      <span className="text-xs" style={{ color:'#737373' }}>
                        {formatDistanceToNow(new Date(c.createdAt),{addSuffix:true})}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color:'#3d3d3d' }}>{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </article>

      {authModal && <AuthModal onClose={()=>setAuthModal(false)}/>}
    </div>
  );
}

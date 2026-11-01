'use client';
// app/page.tsx — Home feed
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, Flame, BarChart2, Tag } from 'lucide-react';
import Link from 'next/link';
import { Header }       from '@/components/layout/Header';
import { Footer }       from '@/components/layout/Footer';
import { HeroPost }     from '@/components/news/HeroPost';
import { NewsCard }     from '@/components/news/NewsCard';
import { AuthModal }    from '@/components/auth/AuthModal';
import { HeroSkeleton, NewsCardSkeleton, EmptyState } from '@/components/ui';
import { usePosts }     from '@/hooks/usePosts';
import { useAuthStore } from '@/store/authStore';
import { api }          from '@/lib/api';
import { timeAgo, formatCount } from '@/lib/utils';
import { Post }         from '@/types';

interface Stats { totalPosts:number; totalUsers:number; totalLikes:number; totalComments:number; }

const CATEGORIES = [
  { label:'All',         href:'/' },
  { label:'Politics',    href:'/?category=Politics' },
  { label:'Business',    href:'/?category=Business' },
  { label:'Technology',  href:'/?category=Technology' },
  { label:'Health',      href:'/?category=Health' },
  { label:'Sports',      href:'/?category=Sports' },
  { label:'Culture',     href:'/?category=Culture' },
  { label:'Environment', href:'/?category=Environment' },
];

export default function HomePage() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const category     = searchParams.get('category') ?? undefined;
  const search       = searchParams.get('search')   ?? undefined;

  const { isAuthenticated } = useAuthStore();
  const [authModal, setAuthModal] = useState(false);
  const [view,      setView]      = useState<'grid'|'list'>('grid');
  const [trending,  setTrending]  = useState<Post[]>([]);
  const [stats,     setStats]     = useState<Stats|null>(null);

  const { posts, meta, isLoading, isFetchingMore, error, loadMore, toggleLike } = usePosts({
    category, search,
  });

  useEffect(() => {
    api.get('/posts', { params:{ limit:5, sort:'trending' } })
      .then(({ data }) => { if(data.success) setTrending(data.data); }).catch(()=>{});
    api.get('/posts/stats')
      .then(({ data }) => { if(data.success) setStats(data.data); }).catch(()=>{});
  }, []);

  const hero = posts[0];
  const rest = posts.slice(1);
  const feedTitle = search ? `Search: "${search}"` : category ? `${category} Stories` : 'Latest Stories';

  function handleLike(postId: string) {
    toggleLike(postId, () => setAuthModal(true));
  }

  return (
    <>
      <Header onAuthClick={() => setAuthModal(true)} />

      <main style={{ maxWidth:1280, margin:'0 auto', padding:'24px 16px' }}
        className="sm:px-6 lg:px-8">

        {/* Hero */}
        <div style={{ marginBottom:32 }}>
          {isLoading
            ? <HeroSkeleton />
            : hero ? <HeroPost post={hero} onLike={handleLike} /> : null
          }
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 xl:gap-10 items-start">

          {/* ── Feed ─────────────────────────────────────────── */}
          <section>
            {/* Feed header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
              marginBottom:20, paddingBottom:16, borderBottom:'2px solid #1a1a1a' }}>
              <h2 style={{ fontFamily:'Playfair Display,Georgia,serif', fontSize:'clamp(1.1rem,2.5vw,1.5rem)',
                fontWeight:700, color:'#1a1a1a', display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ display:'block', width:4, height:24, background:'#b85c38', borderRadius:99, flexShrink:0 }}/>
                {feedTitle}
              </h2>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <div className="hidden sm:flex rounded-xl overflow-hidden"
                  style={{ border:'1.5px solid #e8e4dc' }}>
                  {(['grid','list'] as const).map(v => (
                    <button key={v} onClick={() => setView(v)}
                      style={{ padding:'6px 12px', fontSize:12, fontWeight:600, transition:'all 0.15s',
                        background:view===v?'#1a1a1a':'white', color:view===v?'white':'#737373',
                        border:'none', cursor:'pointer' }}>
                      {v==='grid'?'⊞ Grid':'☰ List'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ background:'#fdf0eb', border:'1.5px solid #b85c38', borderRadius:12,
                padding:'12px 16px', fontSize:14, color:'#b85c38', marginBottom:20 }}>
                ⚠️ {error}
              </div>
            )}

            {/* Grid */}
            {isLoading ? (
              <div className={view==='grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5'
                : 'flex flex-col gap-4'}>
                {[...Array(6)].map((_,i) => <NewsCardSkeleton key={i} />)}
              </div>
            ) : rest.length === 0 && !hero ? (
              <EmptyState
                icon="📰"
                title="No stories found"
                message={search
                  ? `No results for "${search}"`
                  : category ? `No ${category} stories yet` : 'No stories published yet'
                }
                action={(search || category)
                  ? { label:'View All Stories', onClick:()=>router.push('/') }
                  : { label:'Submit a Story', onClick:()=>router.push('/submit') }
                }
              />
            ) : (
              <div className={view==='grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5'
                : 'flex flex-col gap-4'}>
                {rest.map(post => (
                  <NewsCard key={post.id} post={post} view={view} onLike={handleLike} />
                ))}
              </div>
            )}

            {/* Load more */}
            {meta?.hasNext && !isLoading && (
              <div style={{ textAlign:'center', marginTop:40 }}>
                <button onClick={loadMore} disabled={isFetchingMore} className="btn btn-ghost"
                  style={{ padding:'12px 32px' }}>
                  {isFetchingMore
                    ? <><Loader2 size={16} style={{ animation:'spin 0.7s linear infinite' }} /> Loading...</>
                    : 'Load More Stories'
                  }
                </button>
              </div>
            )}
            {!meta?.hasNext && posts.length > 0 && !isLoading && (
              <p style={{ textAlign:'center', fontSize:12, color:'#737373', marginTop:40, paddingBottom:16 }}>
                You have read all {meta?.total} stories · Thank you 🙏
              </p>
            )}
          </section>

          {/* ── Sidebar ───────────────────────────────────────── */}
          <aside className="hidden lg:block sticky top-24 space-y-5">

            {/* CTA */}
            {!isAuthenticated && (
              <div style={{ background:'linear-gradient(135deg,#b85c38,#8f4429)',
                borderRadius:16, padding:20, color:'white' }}>
                <div style={{ fontFamily:'Playfair Display,Georgia,serif', fontSize:18,
                  fontWeight:700, marginBottom:6 }}>Tales with Sylvia Wakhisi</div>
                <p style={{ fontSize:13, color:'rgba(255,255,255,0.8)', lineHeight:1.6, marginBottom:16 }}>
                  Real stories from real communities. Share your voice and be heard.
                </p>
                <Link href="/submit" style={{ display:'block', textAlign:'center',
                  background:'white', color:'#b85c38', padding:'10px', borderRadius:10,
                  fontWeight:700, fontSize:13, textDecoration:'none' }}>
                  ✏️ Share Your Story
                </Link>
              </div>
            )}

            {/* Trending */}
            <div className="sidebar-card">
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'14px 16px',
                borderBottom:'1.5px solid #e8e4dc' }}>
                <Flame size={14} style={{ color:'#b85c38' }} />
                <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em' }}>
                  Trending Stories
                </span>
              </div>
              {trending.length === 0 ? (
                <p style={{ padding:16, fontSize:12, color:'#737373', textAlign:'center' }}>
                  No trending stories yet
                </p>
              ) : (
                <div>
                  {trending.map((p, i) => (
                    <Link key={p.id} href={`/news/${p.id}`}
                      style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'12px 16px',
                        borderBottom: i<4 ? '1px solid #e8e4dc' : 'none', textDecoration:'none' }}
                      onMouseEnter={e=>(e.currentTarget.style.background='#f5f3ee')}
                      onMouseLeave={e=>(e.currentTarget.style.background='')}>
                      <span style={{ fontFamily:'Playfair Display,Georgia,serif', fontSize:20,
                        fontWeight:900, lineHeight:1, marginTop:2, minWidth:28, flexShrink:0,
                        color: i<3 ? '#b85c38' : '#cdc8be' }}>
                        {String(i+1).padStart(2,'0')}
                      </span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:13, fontWeight:600, color:'#1a1a1a', lineHeight:1.35,
                          marginBottom:4, display:'-webkit-box', WebkitLineClamp:2,
                          WebkitBoxOrient:'vertical', overflow:'hidden' }}>{p.title}</p>
                        <p style={{ fontSize:11, color:'#737373' }}>❤️ {p.likeCount} · {timeAgo(p.createdAt)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Stats */}
            {stats && (
              <div className="sidebar-card">
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'14px 16px',
                  borderBottom:'1.5px solid #e8e4dc' }}>
                  <BarChart2 size={14} style={{ color:'#b85c38' }} />
                  <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em' }}>
                    Community Stats
                  </span>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr' }}>
                  {[
                    { num:stats.totalPosts,    label:'Stories' },
                    { num:stats.totalUsers,    label:'Reporters' },
                    { num:stats.totalLikes,    label:'Reactions' },
                    { num:stats.totalComments, label:'Comments' },
                  ].map((s,i) => (
                    <div key={s.label} style={{ padding:'14px 16px',
                      borderRight:  i%2===0?'1.5px solid #e8e4dc':'none',
                      borderBottom: i<2?'1.5px solid #e8e4dc':'none' }}>
                      <div style={{ fontFamily:'Playfair Display,Georgia,serif', fontSize:24,
                        fontWeight:700, lineHeight:1, color:'#1a1a1a' }}>{formatCount(s.num)}</div>
                      <div style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.06em',
                        color:'#737373', marginTop:4 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Categories */}
            <div className="sidebar-card">
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'14px 16px',
                borderBottom:'1.5px solid #e8e4dc' }}>
                <Tag size={14} style={{ color:'#b85c38' }} />
                <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em' }}>
                  Browse Topics
                </span>
              </div>
              <div style={{ padding:12, display:'flex', flexWrap:'wrap', gap:8 }}>
                {CATEGORIES.map(cat => {
                  const active = (cat.label==='All' && !category) || cat.label===category;
                  return (
                    <Link key={cat.label} href={cat.href}
                      style={{ display:'inline-flex', alignItems:'center', padding:'6px 12px',
                        borderRadius:99, fontSize:12, fontWeight:600, textDecoration:'none',
                        border:'1.5px solid', transition:'all 0.15s',
                        background: active ? '#b85c38' : '#f5f3ee',
                        color:      active ? 'white'   : '#3d3d3d',
                        borderColor:active ? '#b85c38' : '#e8e4dc' }}>
                      {cat.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
      {authModal && <AuthModal onClose={() => setAuthModal(false)} />}
    </>
  );
}

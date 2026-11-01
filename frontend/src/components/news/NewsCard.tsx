// components/news/NewsCard.tsx — News card for grid and list views
'use client';
import Link  from 'next/link';
import Image from 'next/image';
import { Heart, MessageCircle, MapPin, Eye } from 'lucide-react';
import { Post } from '@/types';
import { getCategoryClass, getInitials, timeAgo } from '@/lib/utils';
import { Avatar } from '@/components/ui';

interface Props {
  post:    Post;
  view?:   'grid' | 'list';
  onLike?: (postId: string) => void;
}

export function NewsCard({ post, view = 'grid', onLike }: Props) {
  const ago       = timeAgo(post.createdAt);
  const catClass  = getCategoryClass(post.category);

  // ── Footer shared between grid and list ──────────────────────
  const footer = (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
        <Avatar name={post.author.name} src={post.author.avatarUrl} size={28} radius={8} />
        <div style={{ minWidth:0 }}>
          <p style={{ fontSize:12, fontWeight:600, color:'#3d3d3d',
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {post.author.name}
          </p>
          <p style={{ fontSize:11, color:'#737373' }}>{ago}</p>
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        <button
          onClick={e => { e.preventDefault(); onLike?.(post.id); }}
          style={{
            display:'flex', alignItems:'center', gap:4, fontSize:12,
            padding:'4px 8px', borderRadius:8, transition:'all 0.15s',
            color: post.isLiked ? '#b85c38' : '#737373',
            background: post.isLiked ? '#fdf0eb' : 'transparent',
            border: 'none', cursor: 'pointer',
          }}
          aria-label="Like">
          <Heart size={12} fill={post.isLiked ? 'currentColor' : 'none'} />
          {post.likeCount}
        </button>
        <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'#737373' }}>
          <MessageCircle size={12} />{post.commentCount}
        </span>
      </div>
    </div>
  );

  // ── List view ─────────────────────────────────────────────────
  if (view === 'list') {
    return (
      <article className="news-card" style={{ display:'flex', flexDirection:'row' }}>
        <Link href={`/news/${post.id}`} style={{ flexShrink:0, width:140 }}>
          {post.imageUrl ? (
            <div style={{ position:'relative', height:'100%', minHeight:110 }}>
              <Image src={post.imageUrl} alt={post.title} fill
                style={{ objectFit:'cover' }} sizes="140px" />
            </div>
          ) : (
            <div style={{ height:'100%', minHeight:110, background:'#f5f3ee',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:32 }}>📰</div>
          )}
        </Link>
        <div style={{ flex:1, padding:'14px 16px', display:'flex', flexDirection:'column', minWidth:0 }}>
          <span className={catClass} style={{ marginBottom:6, alignSelf:'flex-start' }}>{post.category}</span>
          <Link href={`/news/${post.id}`}>
            <h3 style={{ fontFamily:'Playfair Display,Georgia,serif', fontWeight:700,
              fontSize:'0.9375rem', lineHeight:1.35, color:'#1a1a1a', marginBottom:6,
              display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
              {post.title}
            </h3>
          </Link>
          <p style={{ fontSize:13, color:'#737373', lineHeight:1.5, flex:1, marginBottom:10,
            display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
            {post.description}
          </p>
          {footer}
        </div>
      </article>
    );
  }

  // ── Grid view ─────────────────────────────────────────────────
  return (
    <article className="news-card" style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <Link href={`/news/${post.id}`}
        style={{ display:'block', position:'relative', aspectRatio:'16/9', background:'#f5f3ee', overflow:'hidden' }}>
        {post.imageUrl ? (
          <Image src={post.imageUrl} alt={post.title} fill
            style={{ objectFit:'cover', transition:'transform 0.5s' }}
            sizes="(max-width:640px)100vw,(max-width:1024px)50vw,33vw"
            onMouseEnter={e => (e.currentTarget.style.transform='scale(1.05)')}
            onMouseLeave={e => (e.currentTarget.style.transform='scale(1)')} />
        ) : (
          <div style={{ height:'100%', display:'flex', alignItems:'center',
            justifyContent:'center', fontSize:48, opacity:0.4 }}>📰</div>
        )}
      </Link>

      <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', flex:1 }}>
        {/* Category + location */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, flexWrap:'wrap' }}>
          <span className={catClass}>{post.category}</span>
          {post.location && (
            <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11,
              color:'#737373', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:120 }}>
              <MapPin size={9} style={{ flexShrink:0 }} />{post.location}
            </span>
          )}
        </div>

        {/* Title + excerpt */}
        <Link href={`/news/${post.id}`} style={{ flex:1, display:'block', marginBottom:12 }}>
          <h3 style={{ fontFamily:'Playfair Display,Georgia,serif', fontWeight:700,
            fontSize:'0.9375rem', lineHeight:1.35, color:'#1a1a1a', marginBottom:8,
            display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
            {post.title}
          </h3>
          <p style={{ fontSize:13, color:'#737373', lineHeight:1.55,
            display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
            {post.description}
          </p>
        </Link>

        {/* Footer */}
        <div style={{ paddingTop:12, borderTop:'1.5px solid #e8e4dc' }}>{footer}</div>
      </div>
    </article>
  );
}

// components/news/HeroPost.tsx — Featured hero banner
'use client';
import Link  from 'next/link';
import Image from 'next/image';
import { Heart, MapPin, Eye, MessageCircle } from 'lucide-react';
import { Post } from '@/types';
import { getCategoryClass, getInitials, timeAgo } from '@/lib/utils';

interface Props {
  post:   Post;
  onLike: (postId: string) => void;
}

export function HeroPost({ post, onLike }: Props) {
  const ago      = timeAgo(post.createdAt);
  const catClass = getCategoryClass(post.category);

  return (
    <div style={{ position:'relative', borderRadius:16, overflow:'hidden',
      aspectRatio:'16/7', minHeight:200, background:'#1a1a1a' }}
      className="group">

      {/* Background image */}
      {post.imageUrl && (
        <Image src={post.imageUrl} alt={post.title} fill priority
          style={{ objectFit:'cover', opacity:0.75, transition:'all 0.7s' }}
          sizes="100vw"
          className="group-hover:opacity-60 group-hover:scale-105" />
      )}

      {/* Gradient overlay */}
      <div style={{
        position:'absolute', inset:0,
        background:'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
      }} />

      {/* Content */}
      <div style={{
        position:'absolute', inset:0, display:'flex', flexDirection:'column',
        justifyContent:'flex-end', padding:'clamp(16px, 4vw, 48px)',
      }}>
        <div style={{ maxWidth:700 }}>
          <span className={catClass} style={{ marginBottom:12, display:'inline-flex' }}>
            {post.category}
          </span>

          <Link href={`/news/${post.id}`}>
            <h1 style={{
              fontFamily:'Playfair Display,Georgia,serif', fontWeight:700, color:'white',
              fontSize:'clamp(1.25rem, 3vw, 2.5rem)', lineHeight:1.2, marginBottom:12,
              display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical', overflow:'hidden',
            }}>
              {post.title}
            </h1>
          </Link>

          {/* Meta row */}
          <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center',
            gap:12, color:'rgba(255,255,255,0.75)', fontSize:'clamp(11px,1.5vw,14px)', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:24, height:24, borderRadius:8, background:'rgba(255,255,255,0.2)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'white' }}>
                {getInitials(post.author.name)}
              </div>
              <span>{post.author.name}</span>
            </div>
            <span style={{ opacity:0.4 }}>·</span>
            <span>{ago}</span>
            {post.location && (
              <>
                <span style={{ opacity:0.4 }}>·</span>
                <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <MapPin size={11} />{post.location}
                </span>
              </>
            )}
          </div>

          {/* Actions */}
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Link href={`/news/${post.id}`}
              style={{ display:'inline-flex', alignItems:'center', gap:6,
                background:'#b85c38', color:'white', padding:'10px 20px',
                borderRadius:10, fontWeight:600, fontSize:13, textDecoration:'none',
                transition:'all 0.2s' }}>
              Read Story →
            </Link>
            <button onClick={() => onLike(post.id)}
              style={{
                display:'flex', alignItems:'center', gap:6, padding:'10px 16px',
                borderRadius:10, border:'none', cursor:'pointer', fontSize:13, fontWeight:600,
                background: post.isLiked ? '#b85c38' : 'rgba(255,255,255,0.2)',
                color:'white', backdropFilter:'blur(8px)', transition:'all 0.2s',
              }}>
              <Heart size={13} fill={post.isLiked ? 'currentColor' : 'none'} />
              {post.likeCount}
            </button>
            <span style={{ display:'flex', alignItems:'center', gap:6, color:'rgba(255,255,255,0.7)', fontSize:13 }}>
              <MessageCircle size={13} />{post.commentCount}
            </span>
            <span style={{ display:'flex', alignItems:'center', gap:6, color:'rgba(255,255,255,0.7)', fontSize:13 }}>
              <Eye size={13} />{post.viewCount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

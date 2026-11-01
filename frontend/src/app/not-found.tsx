import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center"
      style={{ background:'#fdfcf9' }}>
      <div style={{ fontFamily:'Playfair Display,Georgia,serif', fontSize:'120px', fontWeight:900,
        lineHeight:1, color:'#e8e4dc', userSelect:'none', marginBottom:'16px' }}>
        404
      </div>
      <h1 style={{ fontFamily:'Playfair Display,Georgia,serif', fontSize:'1.875rem', fontWeight:700,
        color:'#1a1a1a', marginBottom:'12px' }}>Page not found</h1>
      <p style={{ color:'#737373', fontSize:'1.0625rem', maxWidth:'360px',
        lineHeight:1.6, marginBottom:'32px' }}>
        The page you are looking for does not exist or has been moved.
      </p>
      <Link href="/"
        style={{ display:'inline-flex', alignItems:'center', gap:'8px',
          background:'#b85c38', color:'white', padding:'12px 28px',
          borderRadius:'12px', fontWeight:600, fontSize:'0.9375rem',
          textDecoration:'none', transition:'all 0.2s' }}>
        ← Back to Feed
      </Link>
    </div>
  );
}

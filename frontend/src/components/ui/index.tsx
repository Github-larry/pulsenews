// components/ui/index.tsx — Reusable UI components
import { getInitials } from '@/lib/utils';

// ── Skeleton loader ───────────────────────────────────────────
export function Skeleton({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`skeleton ${className}`} style={style} />;
}

// ── Page loader ───────────────────────────────────────────────
export function PageLoader() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#fdfcf9',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14, background: '#b85c38',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px', fontSize: 28, fontWeight: 900, color: 'white',
          fontFamily: 'Playfair Display, Georgia, serif',
          animation: 'pulse 1.5s ease-in-out infinite',
          boxShadow: '0 8px 32px rgba(184,92,56,0.3)',
        }}>S</div>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em',
          textTransform: 'uppercase' as const, color: '#737373', marginBottom: 12 }}>
          Tales with Sylvia Wakhisi
        </p>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%', background: '#b85c38',
              animation: 'bounce 1s ease-in-out infinite',
              animationDelay: `${i * 0.15}s`,
            }} />
          ))}
        </div>
        <style>{`
          @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.8;transform:scale(0.96)} }
          @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        `}</style>
      </div>
    </div>
  );
}

// ── Inline spinner ────────────────────────────────────────────
export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid rgba(255,255,255,0.3)`,
      borderTopColor: 'white',
      animation: 'spin 0.7s linear infinite',
      display: 'inline-block',
    }}>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────
interface EmptyStateProps {
  icon?:   string;
  title:   string;
  message?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon = '📭', title, message, action }: EmptyStateProps) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 16px' }}>
      <div style={{ fontSize: 56, marginBottom: 16, opacity: 0.4 }}>{icon}</div>
      <h3 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.25rem',
        fontWeight: 700, color: '#3d3d3d', marginBottom: 8 }}>{title}</h3>
      {message && <p style={{ fontSize: '0.875rem', color: '#737373', maxWidth: 300,
        margin: '0 auto 24px', lineHeight: 1.6 }}>{message}</p>}
      {action && (
        <button onClick={action.onClick} className="btn btn-primary">{action.label}</button>
      )}
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  APPROVED:  'badge badge-approved',
  PENDING:   'badge badge-pending',
  REJECTED:  'badge badge-rejected',
  ACTIVE:    'badge badge-approved',
  BANNED:    'badge badge-rejected',
  SUSPENDED: 'badge badge-pending',
  OPEN:      'badge badge-pending',
  RESOLVED:  'badge badge-approved',
  DISMISSED: 'badge',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={STATUS_STYLES[status] ?? 'badge'}>
      {status.toLowerCase()}
    </span>
  );
}

// ── Avatar ────────────────────────────────────────────────────
interface AvatarProps {
  name: string;
  src?:  string | null;
  size?: number;
  radius?: number;
}

export function Avatar({ name, src, size = 36, radius = 10 }: AvatarProps) {
  return (
    <div style={{
      width: size, height: size, borderRadius: radius,
      background: '#b85c38', color: 'white', fontWeight: 700,
      fontSize: size * 0.33, display: 'flex', alignItems: 'center',
      justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
    }}>
      {src
        ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : getInitials(name)
      }
    </div>
  );
}

// ── Card skeleton for news ────────────────────────────────────
export function NewsCardSkeleton() {
  return (
    <div style={{ background: 'white', border: '1.5px solid #e8e4dc', borderRadius: 16, overflow: 'hidden' }}>
      <Skeleton style={{ aspectRatio: '16/9', width: '100%', borderRadius: 0 }} />
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Skeleton style={{ height: 14, width: 80, borderRadius: 99 }} />
        <Skeleton style={{ height: 18, width: '100%' }} />
        <Skeleton style={{ height: 18, width: '75%' }} />
        <Skeleton style={{ height: 13, width: '50%' }} />
        <div style={{ display:'flex', justifyContent:'space-between', paddingTop:10,
          borderTop:'1.5px solid #e8e4dc', marginTop:4 }}>
          <Skeleton style={{ height: 12, width: 100 }} />
          <Skeleton style={{ height: 12, width: 60 }} />
        </div>
      </div>
    </div>
  );
}

// ── Hero skeleton ─────────────────────────────────────────────
export function HeroSkeleton() {
  return <Skeleton style={{ width: '100%', aspectRatio: '16/7', minHeight: 180, borderRadius: 16 }} />;
}

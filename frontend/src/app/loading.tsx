export default function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: '#fdfcf9' }}>
      <div className="text-center">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{
            background: '#b85c38',
            animation: 'pulse 1.5s ease-in-out infinite',
            boxShadow: '0 8px 32px rgba(184,92,56,0.35)',
          }}>
          <span style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontWeight: 900, fontSize: '1.75rem', color: 'white', lineHeight: 1,
          }}>S</span>
        </div>
        <p style={{
          fontFamily: 'Inter, sans-serif', fontSize: '0.75rem',
          fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase',
          color: '#737373',
        }}>Tales with Sylvia Wakhisi</p>
        <div style={{ display:'flex', gap:'6px', justifyContent:'center', marginTop:'12px' }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width:'8px', height:'8px', borderRadius:'50%', background:'#b85c38',
              animation:`bounce 1s ease-in-out infinite`, animationDelay:`${i*0.15}s`,
            }}/>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.8;transform:scale(0.96)} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
      `}</style>
    </div>
  );
}

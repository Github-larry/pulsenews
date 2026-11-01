import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-20" style={{ background:'#1a1a1a', color:'rgba(255,255,255,0.65)' }}>
      <div className="container-main py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background:'#b85c38' }}>
              <span className="font-display font-black text-white text-lg">S</span>
            </div>
            <div>
              <div className="font-display font-bold text-base text-white leading-none">
                Tales <span style={{ color:'#b85c38' }}>with Pulsemedia</span>
              </div>
              <div className="text-[10px] tracking-wider uppercase mt-0.5" style={{ color:'rgba(255,255,255,0.4)' }}>
                Pulsemedia
              </div>
            </div>
          </div>
          <p className="text-sm leading-relaxed max-w-xs">
            Real stories from real communities. A platform for citizen journalism where every voice matters.
          </p>
        </div>
        {[
          { heading:'Platform', links:['Home','Submit Story','Trending','Breaking News'] },
          { heading:'Categories', links:['Politics','Business','Technology','Health','Sports','Culture'] },
          { heading:'Company', links:['About Us','Editorial Policy','Privacy Policy','Terms of Service','Contact'] },
        ].map(col => (
          <div key={col.heading}>
            <h4 className="text-[10px] font-bold uppercase tracking-widest mb-4"
              style={{ color:'rgba(255,255,255,0.35)' }}>{col.heading}</h4>
            {col.links.map(l => (
              <Link key={l} href="/"
                className="block text-sm mb-2.5 transition-colors hover:text-white">{l}</Link>
            ))}
          </div>
        ))}
      </div>
      <div style={{ borderTop:'1px solid rgba(255,255,255,0.08)' }}>
        <div className="container-main py-4 flex flex-wrap items-center justify-between gap-2
          text-xs" style={{ color:'rgba(255,255,255,0.35)' }}>
          <span>© {new Date().getFullYear()} Tales with Pulsemedia. All rights reserved.</span>
          <span>Your community. Your stories. Your lens. 🌍</span>
        </div>
      </div>
    </footer>
  );
}

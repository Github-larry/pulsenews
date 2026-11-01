// src/app/opengraph-image.tsx — Default OG image for social sharing
// Next.js generates /opengraph-image automatically
import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'PulseNews — Real-Time Citizen Journalism';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0f0f0f',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
          padding: '60px 72px',
          position: 'relative',
        }}
      >
        {/* Background grid pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Accent top bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: '#c8392b',
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              background: '#c8392b',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: '900',
              color: 'white',
            }}
          >
            P
          </div>
          <span
            style={{
              fontSize: '32px',
              fontWeight: '700',
              color: 'white',
              letterSpacing: '-1px',
            }}
          >
            PulseNews
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: '64px',
            fontWeight: '800',
            color: 'white',
            lineHeight: 1.1,
            maxWidth: '900px',
            marginBottom: '24px',
            letterSpacing: '-2px',
          }}
        >
          Real-Time Citizen Journalism
        </div>

        {/* Subheadline */}
        <div
          style={{
            fontSize: '24px',
            color: 'rgba(255,255,255,0.6)',
            maxWidth: '700px',
            lineHeight: 1.4,
          }}
        >
          Share breaking news and events from your community with the world
        </div>
      </div>
    ),
    { ...size }
  );
}

import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: 'Tales with Sylvia Wakhisi',
    template: '%s | Tales with Sylvia Wakhisi',
  },
  description: 'Real stories from real communities. Tales with Sylvia Wakhisi — where community voices matter.',
  keywords: ['community news', 'citizen journalism', 'Sylvia Wakhisi', 'stories', 'Africa'],
  openGraph: {
    type: 'website',
    siteName: 'Tales with Sylvia Wakhisi',
    title: 'Tales with Sylvia Wakhisi',
    description: 'Real stories from real communities.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#b85c38',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body style={{ background:'#fdfcf9', color:'#1a1a1a', fontFamily:'Inter,system-ui,sans-serif',
        WebkitFontSmoothing:'antialiased', overflowX:'hidden' }}>
        <Suspense fallback={
          <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#fdfcf9' }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ width:56, height:56, borderRadius:14, background:'#b85c38', display:'flex',
                alignItems:'center', justifyContent:'center', margin:'0 auto 16px',
                fontFamily:'Playfair Display,Georgia,serif', fontWeight:900, fontSize:28, color:'white' }}>
                S
              </div>
              <p style={{ fontSize:11, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:'#737373' }}>
                Loading...
              </p>
            </div>
          </div>
        }>
          {children}
        </Suspense>
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1a1a1a', color: '#fff',
              fontFamily: 'Inter, sans-serif', fontSize: '14px',
              fontWeight: '500', borderRadius: '12px', padding: '14px 20px',
            },
            success: { style: { background: '#2d6a4f' } },
            error:   { style: { background: '#b85c38' } },
          }}
        />
      </body>
    </html>
  );
}

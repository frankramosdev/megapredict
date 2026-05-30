import { ImageResponse } from 'next/og'

export const alt =
  'Mega Predict — One search for every Prediction Market, powered by PMXT'

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Marble texture — layered radial gradients, very low contrast */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: [
              'radial-gradient(ellipse 70% 60% at 15% 25%, rgba(190,200,240,0.16) 0%, transparent 100%)',
              'radial-gradient(ellipse 55% 50% at 85% 75%, rgba(195,205,242,0.14) 0%, transparent 100%)',
              'radial-gradient(ellipse 80% 40% at 50% 10%,  rgba(210,215,245,0.10) 0%, transparent 100%)',
              'radial-gradient(ellipse 40% 70% at 5%  80%,  rgba(185,198,238,0.12) 0%, transparent 100%)',
              'radial-gradient(ellipse 60% 35% at 92% 15%,  rgba(200,212,244,0.11) 0%, transparent 100%)',
              'radial-gradient(ellipse 35% 55% at 60% 90%,  rgba(188,200,240,0.10) 0%, transparent 100%)',
            ].join(', '),
          }}
        />

        {/* Thin vein lines simulated with narrow ellipses */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: [
              'radial-gradient(ellipse 120% 2%  at 30% 40%, rgba(170,185,230,0.09) 0%, transparent 100%)',
              'radial-gradient(ellipse 2%  80% at 70% 60%, rgba(175,188,232,0.08) 0%, transparent 100%)',
              'radial-gradient(ellipse 90% 1.5% at 60% 75%, rgba(168,182,228,0.07) 0%, transparent 100%)',
            ].join(', '),
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0,
            padding: '0 100px',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          {/* Logo mark */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 60,
              height: 60,
              borderRadius: 16,
              backgroundColor: '#4f6fff',
              color: '#ffffff',
              fontSize: 30,
              fontWeight: 800,
              marginBottom: 28,
              letterSpacing: '-1px',
            }}
          >
            m
          </div>

          {/* H1 — Mega Predict */}
          <div
            style={{
              fontSize: 84,
              fontWeight: 800,
              color: '#0c0d1e',
              letterSpacing: '-3.5px',
              lineHeight: 1,
              marginBottom: 20,
            }}
          >
            Mega Predict
          </div>

          {/* H2 — tagline */}
          <div
            style={{
              fontSize: 38,
              fontWeight: 500,
              color: '#232540',
              letterSpacing: '-0.8px',
              lineHeight: 1.25,
              marginBottom: 28,
            }}
          >
            One search for every Prediction Market
          </div>

          {/* Powered by PMXT */}
          <div
            style={{
              fontSize: 32,
              fontWeight: 600,
              color: '#0c0d1e',
              letterSpacing: '0.3px',
            }}
          >
            powered by PMXT
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}

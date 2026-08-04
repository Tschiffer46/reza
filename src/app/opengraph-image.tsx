import { ImageResponse } from 'next/og'

export const alt = 'VadSkaVi — enkla appar för vardagen'
export const size = { width: 1200, height: 630 }
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
          background: '#1a1a18',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 88, fontWeight: 700 }}>VadSkaVi</div>
        <div
          style={{
            display: 'flex',
            fontSize: 38,
            color: '#e7e2da',
            marginTop: 18,
            maxWidth: 880,
            textAlign: 'center',
          }}
        >
          Enkla appar för det du ändå gör varje vecka
        </div>
        {/* Sage — husets accent. Terrakotta hör till Laga och skulle göra
            delningsbilden till en appbild i stället för en varumärkesbild. */}
        <div style={{ marginTop: 30, height: 8, width: 130, background: '#3f7d63', borderRadius: 4 }} />
      </div>
    ),
    { ...size },
  )
}

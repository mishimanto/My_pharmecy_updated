import { DotLottieReact } from '@lottiefiles/dotlottie-react'

const DEFAULT_SRC = 'https://lottie.host/38a0b118-f9f6-4071-9eac-9cbe251c71a5/Sxf1bcXcOU.lottie'

export default function DotLottieLoader({ size = 256, src = DEFAULT_SRC, className = '' }) {
  return (
    <div className={className} style={{ width: size, height: size, backgroundColor: 'transparent' }}>
      <DotLottieReact
        src={src}
        loop
        autoplay
        style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
      />
    </div>
  )
}

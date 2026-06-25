import DotLottieLoader from '../common/DotLottieLoader'

const CUSTOMER_LOADER_SRC = 'https://lottie.host/38a0b118-f9f6-4071-9eac-9cbe251c71a5/Sxf1bcXcOU.lottie'

export default function CustomerLoader({ size = 240, inline = false }) {
  if (inline) {
    return (
      <div className="flex items-center justify-center p-4">
        <DotLottieLoader size={size} src={CUSTOMER_LOADER_SRC} />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <DotLottieLoader size={size} src={CUSTOMER_LOADER_SRC} />
    </div>
  )
}

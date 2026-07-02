import DotLottieLoader from '../common/DotLottieLoader'

const CUSTOMER_LOADER_SRC = 'https://lottie.host/6086c159-3c7d-4686-a90e-6e7cf3644912/ZyIjM9Nvmj.lottie'

export default function CustomerLoader({ size = 120, inline = false, transition = false, leaving = false }) {
  const animationClass = leaving ? 'route-loader-leaving' : transition ? 'route-loader-transition' : 'animate-in'

  if (inline) {
    return (
      <div className={`flex items-center justify-center p-4 ${animationClass}`}>
        <DotLottieLoader size={size} src={CUSTOMER_LOADER_SRC} />
      </div>
    )
  }

  return (
    <div className={`fixed inset-0 z-80 flex items-center justify-center backdrop-blur-lg ${animationClass}`}>
      <DotLottieLoader className="drop-shadow-[0_18px_34px_rgba(15,23,42,0.18)]" size={size} src={CUSTOMER_LOADER_SRC} />
    </div>
  )
}

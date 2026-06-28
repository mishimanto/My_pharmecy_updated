import DotLottieLoader from '../common/DotLottieLoader'

const ADMIN_LOADER_SRC = 'https://lottie.host/e11ddac9-19b8-40d3-aee7-9a3bf013247f/VlVJkNYsRm.lottie'

export default function AdminLoader({ size = 256, inline = false, transition = false }) {
  const animationClass = transition ? 'route-loader-transition' : 'animate-in'

  if (inline) {
    return (
      <div className={`flex items-center justify-center p-4 ${animationClass}`}>
        <DotLottieLoader size={size} src={ADMIN_LOADER_SRC} />
      </div>
    )
  }

  return (
    <div className={`flex min-h-screen flex-col items-center justify-center bg-slate-200 ${animationClass}`}>
      <div className="">
        <DotLottieLoader size={size} src={ADMIN_LOADER_SRC} />
      </div>
      <p className="mt-3 text-sm font-semibold tracking-[0.24em] uppercase text-slate-500 animate-pulse">
        Please wait a while
      </p>
    </div>
  )
}

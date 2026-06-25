import DotLottieLoader from '../common/DotLottieLoader'

export default function AdminLoader({ size = 256, inline = false }) {
  if (inline) {
    return (
      <div className="flex items-center justify-center p-4">
        <DotLottieLoader size={size} />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-200">
      <DotLottieLoader size={size} />
      <p className="text-md font-semibold tracking-[0.24em] uppercase text-slate-500 animate-pulse">
        Please wait a while
      </p>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'
import DotLottieLoader from './DotLottieLoader'

const NOT_FOUND_LOTTIE = 'https://lottie.host/2786d5d5-7b8d-4f84-ad59-7bc83d1271c7/5URXhTtDhz.lottie'

export default function NotFoundPage({
  actionLabel = 'Go back home',
  actionTo = '/',
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7f8fb] px-4 py-10 text-center">
      <DotLottieLoader size={300} src={NOT_FOUND_LOTTIE} />
      
      <Link
        to={actionTo}
        className="mt-2 inline-flex items-center gap-2 border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50"
      >
        <FiArrowLeft className="h-4 w-4" />
        {actionLabel}
      </Link>
    </div>
  )
}

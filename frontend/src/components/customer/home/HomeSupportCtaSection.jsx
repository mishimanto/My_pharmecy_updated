import { FiArrowRight, FiMapPin, FiPhoneCall } from 'react-icons/fi'
import { Link } from 'react-router-dom'

export default function HomeSupportCtaSection({ isBangla }) {
  return (
    <section className="pb-16">
      <div className="overflow-hidden border border-[#9de8e1]/30 bg-[linear-gradient(135deg,#05222a_0%,#0b5d68_54%,#13b8b0_100%)] p-8 text-white shadow-[0_32px_80px_-24px_rgba(8,63,73,0.65)] sm:p-12">
        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal-100">{isBangla ? 'অর্ডারে সহায়তা লাগবে?' : 'Need help ordering?'}</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              {isBangla ? 'প্রেসক্রিপশন, সহায়তা আর ডেলিভারি এক জায়গায়' : 'Prescription, support, and delivery in one place'}
            </h2>
            {/* <p className="mt-4 max-w-xl text-sm leading-8 text-teal-50/90">
              {isBangla
                ? 'ক্যাটালগ থেকে অর্ডার তৈরি করুন, প্রয়োজন হলে প্রেসক্রিপশন জমা দিন, আর পুরো কেনাকাটাজুড়ে সহায়তা হাতের কাছে রাখুন।'
                : 'Build your order from the catalog, submit prescriptions when needed, and keep support visible throughout the shopping journey.'}
            </p> */}
            <div className="mt-6 flex flex-wrap gap-4 text-sm">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#9de8e1]/25 bg-[#083f49]/40 px-4 py-2 backdrop-blur-sm">
                <FiMapPin className="h-4 w-4" />
                {isBangla ? 'ঢাকা ডেলিভারি' : 'Dhaka delivery'}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#9de8e1]/25 bg-[#083f49]/40 px-4 py-2 backdrop-blur-sm">
                <FiPhoneCall className="h-4 w-4" />
                09610-001122
              </span>
            </div>
          </div>

          <div className="grid gap-3">
            {[
              { to: '/upload-prescription', label: isBangla ? 'প্রেসক্রিপশন আপলোড' : 'Upload prescription' },
              { to: '/products', label: isBangla ? 'সব ওষুধ দেখুন' : 'Browse all medicines' },
              { to: '/support', label: isBangla ? 'সহায়তায় যোগাযোগ' : 'Contact support' },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="group flex items-center justify-between border border-[#9de8e1]/25 bg-[#083f49]/40 px-5 py-4 text-sm font-bold backdrop-blur-sm transition hover:border-[#9de8e1]/55 hover:bg-[#0e6574]/55"
              >
                {item.label}
                <FiArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

import { FiMapPin, FiPhoneCall } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import CustomerLogo from './CustomerLogo'

export default function CustomerFooter() {
  const { isBangla } = useLanguage()
  const { settings } = useSiteSettings()
  const t = (bn, en) => (isBangla ? bn : en)
  const banglaFontClass = isBangla ? "[font-family:'Hind_Siliguri','Noto_Sans_Bengali','SolaimanLipi','Vrinda',sans-serif]" : ''
  const footerGroups = [
    {
      title: t('শপ', 'Shop'),
      items: [
        [t('সব ওষুধ', 'All medicines'), '/products'],
        [t('প্রেসক্রিপশন আপলোড', 'Prescription upload'), '/upload-prescription'],
        [t('অর্ডার ট্র্যাক', 'Track order'), '/track-order'],
        [t('কার্ট', 'Cart'), '/cart'],
      ],
    },
    {
      title: t('সাপোর্ট', 'Support'),
      items: [
        [t('কাস্টমার হেল্প', 'Customer help'), '/support'],
        ['FAQ', '/faq'],
        [t('প্রাইভেসি পলিসি', 'Privacy policy'), '/privacy-policy'],
        [t('শর্তাবলি', 'Terms and conditions'), '/terms-and-conditions'],
      ],
    },
  ]

  return (
    <footer className={`border-t border-[#0b5f69] bg-[linear-gradient(135deg,#0d4b59_0%,#0f766e_52%,#13b8b0_100%)] text-white ${banglaFontClass}`}>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.85fr_0.75fr_0.95fr] lg:items-start lg:px-8">
        <div className="space-y-5">
          <CustomerLogo variant="footer" />

          <div className="space-y-3 text-sm text-white/82">
            <div className="flex items-start gap-3 border border-white/18 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <FiPhoneCall className="mt-0.5 h-4 w-4 text-white" />
              <div>
                <div className="font-medium text-white">{settings?.support_phone || '09610-001122'}</div>
                <div>{settings?.support_hours || t('সকাল ৮টা থেকে রাত ১১টা', '8AM to 11PM')}</div>
                <div className="mt-1">{settings?.support_email || 'support@mypharmecy.test'}</div>
              </div>
            </div>
            <div className="flex items-start gap-3 border border-white/18 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <FiMapPin className="mt-0.5 h-4 w-4 text-white" />
              <div>
                <div className="font-medium text-white">{settings?.address || t('ঢাকা সার্ভিস পয়েন্ট', 'Dhaka service point')}</div>
                <div>{settings?.city || t('দ্রুত ওষুধ ডেলিভারি ও প্রেসক্রিপশন সহায়তা', 'Fast medicine delivery and prescription assistance')}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          {footerGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-white/65">{group.title}</h3>
              <div className="mt-4 space-y-3">
                {group.items.map(([label, to]) => (
                  <Link key={to} to={to} className="block text-sm text-white/82 transition hover:text-white">
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3 lg:justify-self-end">
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-white/65">{t('লোকেশন', 'Location')}</div>
          <div className="overflow-hidden border border-white/18 bg-white/95 shadow-[0_24px_48px_-28px_rgba(15,23,42,0.7)]">
            <iframe
              title={`${settings?.site_name || 'My Pharmecy'} location map`}
              src={settings?.map_embed_url || 'https://www.google.com/maps?q=Dhaka%2C%20Bangladesh&z=12&output=embed'}
              className="h-[260px] w-full border-0 lg:w-[340px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-white/12 bg-[#093540]/25">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-sm text-white/76 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex flex-wrap items-center gap-4">
            <span>(c) {new Date().getFullYear()}</span>
            <span className="hidden text-white/25 lg:inline">|</span>
            <span>{settings?.footer_note || t('প্রেসক্রিপশন-সচেতন অনলাইন ফার্মেসি অভিজ্ঞতা', 'Prescription-aware online pharmacy experience')}</span>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link to="/privacy-policy" className="transition hover:text-white">{t('প্রাইভেসি পলিসি', 'Privacy policy')}</Link>
            <Link to="/terms-and-conditions" className="transition hover:text-white">{t('শর্তাবলি', 'Terms')}</Link>
            <Link to="/refund-and-return-policy" className="transition hover:text-white">{t('রিফান্ড পলিসি', 'Refund policy')}</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

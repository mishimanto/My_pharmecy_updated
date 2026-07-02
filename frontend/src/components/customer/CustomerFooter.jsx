import { FiMapPin, FiPhoneCall } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import CustomerLogo from './CustomerLogo'

export default function CustomerFooter() {
  const { isBangla } = useLanguage()
  const { settings } = useSiteSettings()
  const t = (bn, en) => (isBangla ? bn : en)
  const currentYear = new Date().getFullYear().toLocaleString(isBangla ? 'bn-BD' : 'en-US', { useGrouping: false })
  const localizedSetting = (key, fallbackBn, fallbackEn) => {
    if (isBangla) {
      return settings?.[`${key}_bn`] || fallbackBn || settings?.[key]
    }

    return settings?.[key] || fallbackEn
  }
  const banglaFontClass = isBangla ? 'font-bangla' : ''
  const footerGroups = [
    {
      title: t('শপ', 'Shop'),
      items: [
        [t('সব পণ্য', 'All products'), '/products'],
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
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 md:gap-10 lg:px-8 xl:grid-cols-[0.85fr_0.75fr_0.95fr] xl:items-start">
        <div className="space-y-5">
          <CustomerLogo variant="footer" />

          <div className="space-y-3 text-sm text-white/82">
            <div className="flex items-start gap-3 py-2 backdrop-blur-sm">
              <FiPhoneCall className="mt-0.5 h-4 w-4 text-white" />
              <div>
                <div className="font-medium text-white">{settings?.support_phone || '09610-001122'}</div>
                <div>{localizedSetting('support_hours', 'সকাল ৮টা থেকে রাত ১১টা সাপোর্ট', '8AM to 11PM support')}</div>
                <div className="mt-1">{settings?.support_email || 'support@mypharmecy.test'}</div>
              </div>
            </div>
            {/* <div className="flex items-start gap-3 border border-white/18 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <FiMapPin className="mt-0.5 h-4 w-4 text-white" />
              <div>
                <div className="font-medium text-white">{localizedSetting('address', 'ঢাকা সার্ভিস পয়েন্ট', 'Dhaka service point')}</div>
                <div>{localizedSetting('city', 'ঢাকা', 'Dhaka')}</div>
              </div>
            </div> */}
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

        <div className="space-y-3 md:col-span-2 xl:col-span-1 xl:justify-self-end">
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-white/65">{t('লোকেশন', 'Location')}</div>
          <div className="overflow-hidden border border-white/18 bg-white/95 shadow-[0_24px_48px_-28px_rgba(15,23,42,0.7)]">
            <iframe
              title={`${settings?.site_name || 'My Pharmecy'} location map`}
              src={settings?.map_embed_url || 'https://www.google.com/maps?q=Dhaka%2C%20Bangladesh&z=12&output=embed'}
              className="h-[220px] w-full border-0 sm:h-[240px] xl:h-[260px] xl:w-[340px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-white/12 bg-[#093540]/25">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-sm text-white/76 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex flex-wrap items-center gap-4">
            <span>&copy; {currentYear}</span>
            <span className="hidden text-white/25 lg:inline">|</span>
            <span>{localizedSetting('footer_note', 'সর্বস্বত্ব সংরক্ষিত', 'All rights reserved')}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

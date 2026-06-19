import { FiMapPin, FiPhoneCall } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useSiteSettings } from '../../context/SiteSettingsContext'

export default function CustomerFooter() {
  const { isBangla } = useLanguage()
  const { settings } = useSiteSettings()
  const t = (bn, en) => (isBangla ? bn : en)
  const banglaFontClass = isBangla ? "[font-family:'Hind_Siliguri','Noto_Sans_Bengali','SolaimanLipi','Vrinda',sans-serif]" : ''
  const footerGroups = [
    {
      title: t('à¦¶à¦ª', 'Shop'),
      items: [
        [t('à¦¸à¦¬ à¦“à¦·à§à¦§', 'All medicines'), '/products'],
        [t('à¦ªà§à¦°à§‡à¦¸à¦•à§à¦°à¦¿à¦ªà¦¶à¦¨ à¦†à¦ªà¦²à§‹à¦¡', 'Prescription upload'), '/upload-prescription'],
        [t('à¦…à¦°à§à¦¡à¦¾à¦° à¦Ÿà§à¦°à§à¦¯à¦¾à¦•', 'Track order'), '/track-order'],
        [t('à¦•à¦¾à¦°à§à¦Ÿ', 'Cart'), '/cart'],
      ],
    },
    {
      title: t('à¦¸à¦¹à¦¾à§Ÿà¦¤à¦¾', 'Support'),
      items: [
        [t('à¦•à¦¾à¦¸à§à¦Ÿà¦®à¦¾à¦° à¦¹à§‡à¦²à§à¦ª', 'Customer help'), '/support'],
        ['FAQ', '/faq'],
        [t('à¦ªà§à¦°à¦¾à¦‡à¦­à§‡à¦¸à¦¿ à¦ªà¦²à¦¿à¦¸à¦¿', 'Privacy policy'), '/privacy-policy'],
        [t('à¦¶à¦°à§à¦¤à¦¾à¦¬à¦²à¦¿', 'Terms and conditions'), '/terms-and-conditions'],
      ],
    },
  ]

  return (
    <footer
      className={`border-t border-[#0b5f69] bg-[linear-gradient(135deg,#0d4b59_0%,#0f766e_52%,#13b8b0_100%)] text-white ${banglaFontClass}`}
    >
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.85fr_0.75fr_0.95fr] lg:items-start lg:px-8">
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt={settings.site_name || 'Site logo'} className="h-12 bg-white object-contain p-1 shadow-[0_18px_35px_-20px_rgba(15,23,42,0.55)]" />
            ) : (
              <span className="flex h-12 w-12 items-center justify-center bg-white text-sm font-bold uppercase tracking-[0.18em] text-[#0f766e] shadow-[0_18px_35px_-20px_rgba(15,23,42,0.55)]">
                Rx
              </span>
            )}
            
          </div>

          <div className="space-y-3 text-sm text-white/82">
            <div className="flex items-start gap-3 border border-white/18 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <FiPhoneCall className="mt-0.5 h-4 w-4 text-white" />
              <div>
                <div className="font-medium text-white">{settings?.support_phone || '09610-001122'}</div>
                <div>{settings?.support_hours || t('à¦¸à¦•à¦¾à¦² à§®à¦Ÿà¦¾ à¦¥à§‡à¦•à§‡ à¦°à¦¾à¦¤ à§§à§§à¦Ÿà¦¾ à¦¸à¦¹à¦¾à§Ÿà¦¤à¦¾', '8AM to 11PM support')}</div>
                <div className="mt-1">{settings?.support_email || 'support@mypharmecy.test'}</div>
              </div>
            </div>
            <div className="flex items-start gap-3 border border-white/18 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <FiMapPin className="mt-0.5 h-4 w-4 text-white" />
              <div>
                <div className="font-medium text-white">{settings?.address || t('à¦¢à¦¾à¦•à¦¾ à¦¸à¦¾à¦°à§à¦­à¦¿à¦¸ à¦ªà§Ÿà§‡à¦¨à§à¦Ÿ', 'Dhaka service point')}</div>
                <div>{settings?.city || t('à¦¦à§à¦°à§à¦¤ à¦“à¦·à§à¦§ à¦¡à§‡à¦²à¦¿à¦­à¦¾à¦°à¦¿ à¦“ à¦ªà§à¦°à§‡à¦¸à¦•à§à¦°à¦¿à¦ªà¦¶à¦¨ à¦¸à¦¹à¦¾à§Ÿà¦¤à¦¾', 'Fast medicine delivery and prescription assistance')}</div>
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
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-white/65">{t('à¦²à§‹à¦•à§‡à¦¶à¦¨', 'Location')}</div>
          </div>
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
          <div className="flex items-center gap-4">
            <span>(c) {new Date().getFullYear()} {settings?.site_name || 'My Pharmecy'}</span>
            <span className="hidden text-white/25 lg:inline">|</span>
            <span>{settings?.footer_note || t('à¦ªà§à¦°à§‡à¦¸à¦•à§à¦°à¦¿à¦ªà¦¶à¦¨-à¦¸à¦šà§‡à¦¤à¦¨ à¦…à¦¨à¦²à¦¾à¦‡à¦¨ à¦«à¦¾à¦°à§à¦®à§‡à¦¸à¦¿ à¦…à¦­à¦¿à¦œà§à¦žà¦¤à¦¾', 'Prescription-aware online pharmacy experience')}</span>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link to="/privacy-policy" className="transition hover:text-white">{t('à¦ªà§à¦°à¦¾à¦‡à¦­à§‡à¦¸à¦¿ à¦ªà¦²à¦¿à¦¸à¦¿', 'Privacy policy')}</Link>
            <Link to="/terms-and-conditions" className="transition hover:text-white">{t('à¦¶à¦°à§à¦¤à¦¾à¦¬à¦²à¦¿', 'Terms')}</Link>
            <Link to="/refund-and-return-policy" className="transition hover:text-white">{t('à¦°à¦¿à¦«à¦¾à¦¨à§à¦¡ à¦ªà¦²à¦¿à¦¸à¦¿', 'Refund policy')}</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

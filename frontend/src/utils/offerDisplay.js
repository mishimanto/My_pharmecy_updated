export function getLocalizedOffer(offer, isBangla) {
  return {
    id: offer.id,
    label: isBangla ? offer.label_bn || offer.label : offer.label,
    title: isBangla ? offer.title_bn || offer.title : offer.title,
    body: isBangla ? offer.body_bn || offer.body : offer.body,
    buttonLabel: isBangla ? offer.button_label_bn || offer.button_label : offer.button_label,
    linkUrl: offer.link_url || '/products',
    image: offer.image_src || offer.image_url,
    endsAt: offer.ends_at,
  }
}

export function getOfferTimeLeft(endsAt, isBangla = false) {
  if (!endsAt) return null

  const remaining = new Date(endsAt).getTime() - Date.now()

  if (!Number.isFinite(remaining) || remaining <= 0) {
    return { expired: true, label: isBangla ? '০০:০০:০০' : '00:00:00' }
  }

  const totalSeconds = Math.floor(remaining / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const formatPart = (value) => String(value).padStart(2, '0').replace(/\d/g, (digit) => (
    isBangla ? String.fromCharCode(0x09E6 + Number(digit)) : digit
  ))
  const formattedDays = days.toLocaleString(isBangla ? 'bn-BD' : 'en-US')

  return {
    expired: false,
    days,
    label: days > 0
      ? `${formattedDays}${isBangla ? 'দিন' : 'd'} ${formatPart(hours)}:${formatPart(minutes)}:${formatPart(seconds)}`
      : `${formatPart(hours)}:${formatPart(minutes)}:${formatPart(seconds)}`,
  }
}

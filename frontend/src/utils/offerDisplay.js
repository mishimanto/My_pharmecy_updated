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

export function getOfferTimeLeft(endsAt) {
  if (!endsAt) return null

  const remaining = new Date(endsAt).getTime() - Date.now()

  if (!Number.isFinite(remaining) || remaining <= 0) {
    return { expired: true, label: '00:00:00' }
  }

  const totalSeconds = Math.floor(remaining / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (value) => String(value).padStart(2, '0')

  return {
    expired: false,
    days,
    label: days > 0
      ? `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
      : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
  }
}

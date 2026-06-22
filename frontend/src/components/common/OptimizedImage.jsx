import { handleImageFallback, MEDICINE_PLACEHOLDER_SRC, resolveImageUrl } from '../../utils/imageUrl'

export default function OptimizedImage({
  src,
  fallback = MEDICINE_PLACEHOLDER_SRC,
  alt = '',
  className = '',
  loading = 'lazy',
  decoding = 'async',
  onError,
  ...props
}) {
  const resolvedSrc = resolveImageUrl(src, fallback)

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      loading={loading}
      decoding={decoding}
      onError={onError || ((event) => handleImageFallback(event, fallback))}
      {...props}
    />
  )
}

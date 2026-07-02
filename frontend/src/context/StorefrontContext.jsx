/* eslint-disable react-refresh/only-export-components */
import { createContext, startTransition, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { cartApi } from '../api/cartApi'
import { useCustomerAuth } from './CustomerAuthContext'
import { useSiteSettings } from './SiteSettingsContext'

const StorefrontContext = createContext(null)

const CART_CACHE_KEY = 'storefront_cart_cache_v1'
const WISHLIST_CACHE_KEY = 'storefront_wishlist_cache_v1'

function readStorage(key, fallback) {
  if (typeof window === 'undefined') return fallback

  try {
    const value = window.localStorage.getItem(key) || window.sessionStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function writeSession(key, value) {
  if (typeof window === 'undefined') return

  try {
    window.sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore storage failures.
  }
}

function removeSession(key) {
  if (typeof window === 'undefined') return

  try {
    window.sessionStorage.removeItem(key)
  } catch {
    // Ignore storage failures.
  }
}

function writeLocal(key, value) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore storage failures.
  }
}

function removeLocal(key) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.removeItem(key)
  } catch {
    // Ignore storage failures.
  }
}

function normalizeWishlistProduct(product) {
  if (!product?.id) return null

  return {
    id: product.id,
    product_name: product.product_name,
    generic_name: product.generic_name,
    brand_name: product.brand_name,
    display_price: product.display_price,
    available_stock: product.available_stock,
    requires_prescription: product.requires_prescription,
    manufacturer: product.manufacturer || null,
    primary_image: product.primary_image || null,
    images: product.images || [],
    category: product.category || null,
    purchase_options: product.purchase_options || [],
    default_purchase_unit: product.default_purchase_unit,
  }
}

function cartCountFromPayload(cart) {
  return (cart?.items || []).reduce((total, item) => total + Number(item.quantity || 0), 0)
}

function calculateCartSubtotal(items = []) {
  return items.reduce((total, item) => total + Number(item.subtotal || 0), 0)
}

function cloneCart(cart) {
  return cart ? JSON.parse(JSON.stringify(cart)) : cart
}

function normalizeCartWarnings(items = []) {
  const warnings = []

  if (items.some((item) => Boolean(item.requires_prescription))) {
    warnings.push('This cart contains prescription products.')
  }

  return warnings
}

function buildOptimisticCartItem(payload, meta = {}) {
  const quantity = Math.max(1, Number(payload.quantity || 1))
  const piecesPerUnit = Math.max(1, Number(meta.pieces_per_unit || 1))
  const availableStock = Math.max(0, Number(meta.available_stock || 0))
  const unitPrice = Number(meta.unit_price || meta.display_price || 0)
  const pieceQuantity = quantity * piecesPerUnit

  return {
    cart_item_id: `temp-${payload.product_id}-${payload.purchase_unit}-${Date.now()}`,
    id: `temp-${payload.product_id}-${payload.purchase_unit}-${Date.now()}`,
    product_id: payload.product_id,
    product_name: meta.product_name || '',
    product_name_bn: meta.product_name_bn || '',
    generic_name: meta.generic_name || '',
    generic_name_bn: meta.generic_name_bn || '',
    strength: meta.strength || '',
    dosage_form: meta.dosage_form || '',
    requires_prescription: Boolean(meta.requires_prescription),
    image_url: meta.image_url || null,
    thumbnail_url: meta.thumbnail_url || null,
    quantity,
    purchase_quantity: quantity,
    purchase_unit: payload.purchase_unit,
    purchase_unit_label: meta.purchase_unit_label || payload.purchase_unit,
    pieces_per_unit: piecesPerUnit,
    piece_quantity: pieceQuantity,
    conversion_label: meta.conversion_label || '',
    unit_price: unitPrice,
    subtotal: unitPrice * quantity,
    available_stock: availableStock,
    available_quantity: Math.max(0, Math.floor(availableStock / piecesPerUnit)),
  }
}

function createEmptyCartState() {
  return {
    cart_id: null,
    items: [],
    subtotal: 0,
    requires_prescription: false,
    warnings: [],
  }
}

function storageScope(customer, guestToken) {
  if (customer?.id) return `customer:${customer.id}`
  if (guestToken) return `guest:${guestToken}`
  return 'guest:anonymous'
}

function scopedStorageKey(key, scope) {
  return `${key}:${scope}`
}

export function StorefrontProvider({ children }) {
  const { customer, guestToken, loading: authLoading, ensureGuestToken } = useCustomerAuth()
  const { loading: settingsLoading, brandAssetsReady } = useSiteSettings()
  const scope = useMemo(() => storageScope(customer, guestToken), [customer, guestToken])
  const cartCacheKey = useMemo(() => scopedStorageKey(CART_CACHE_KEY, scope), [scope])
  const wishlistCacheKey = useMemo(() => scopedStorageKey(WISHLIST_CACHE_KEY, scope), [scope])
  const [cart, setCart] = useState(() => readStorage(cartCacheKey, null))
  const [cartLoading, setCartLoading] = useState(() => !readStorage(cartCacheKey, null))
  const [cartReady, setCartReady] = useState(() => Boolean(readStorage(cartCacheKey, null)))
  const [wishlist, setWishlist] = useState(() => readStorage(wishlistCacheKey, []))
  const cartRef = useRef(cart)
  const wishlistRef = useRef(wishlist)
  const cartPromiseRef = useRef(null)
  const refreshedScopeRef = useRef(null)

  useEffect(() => {
    const cachedCart = readStorage(cartCacheKey, null)

    cartPromiseRef.current = null
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCart(cachedCart)
    setCartLoading(!cachedCart)
    setCartReady(Boolean(cachedCart))
    setWishlist(readStorage(wishlistCacheKey, []))
  }, [cartCacheKey, wishlistCacheKey])

  useEffect(() => {
    cartRef.current = cart

    if (cart) {
      writeSession(cartCacheKey, cart)
      return
    }

    removeSession(cartCacheKey)
  }, [cart, cartCacheKey])

  useEffect(() => {
    wishlistRef.current = wishlist

    if (wishlist.length) {
      writeLocal(wishlistCacheKey, wishlist)
      return
    }

    removeLocal(wishlistCacheKey)
  }, [wishlist, wishlistCacheKey])

  const updateCartState = useCallback((nextCart) => {
    setCart(nextCart)
    setCartLoading(false)
    setCartReady(true)
  }, [])

  const applyOptimisticCart = useCallback((updater) => {
    const currentCart = cartRef.current || createEmptyCartState()

    const snapshot = cloneCart(currentCart)
    const nextCart = updater(cloneCart(currentCart))

    if (!nextCart) {
      return null
    }

    updateCartState(nextCart)

    return snapshot
  }, [updateCartState])

  const refreshCart = useCallback(async ({ force = false } = {}) => {
    if (authLoading || settingsLoading || !brandAssetsReady) {
      return cartRef.current
    }

    if (!customer) {
      await ensureGuestToken()
    }

    if (!force && cartPromiseRef.current) {
      return cartPromiseRef.current
    }

    if (!force && cartReady && cartRef.current) {
      return cartRef.current
    }

    setCartLoading(!cartRef.current)

    const request = cartApi.get()
      .then(({ data }) => {
        updateCartState(data.data)
        return data.data
      })
      .catch((error) => {
        setCartLoading(false)
        throw error
      })
      .finally(() => {
        cartPromiseRef.current = null
      })

    cartPromiseRef.current = request
    return request
  }, [authLoading, brandAssetsReady, cartReady, customer, ensureGuestToken, settingsLoading, updateCartState])

  useEffect(() => {
    if (authLoading || settingsLoading || !brandAssetsReady) return

    if (refreshedScopeRef.current === scope) return
    refreshedScopeRef.current = scope

    refreshCart().catch(() => {
      refreshedScopeRef.current = null
    })
  }, [authLoading, brandAssetsReady, refreshCart, scope, settingsLoading])

  const addToCart = useCallback(async (payload, meta = null) => {
    if (!customer && !guestToken) {
      await ensureGuestToken()
    }

    let snapshot = null

    snapshot = applyOptimisticCart((currentCart) => {
      const existingItem = currentCart.items?.find((item) => (
        String(item.product_id) === String(payload.product_id)
        && String(item.purchase_unit) === String(payload.purchase_unit)
      ))

      if (!existingItem) {
        return null
      }

      const addedQuantity = Number(payload.quantity || 0)
      existingItem.quantity += addedQuantity
      existingItem.purchase_quantity = existingItem.quantity
      existingItem.piece_quantity += addedQuantity * Number(existingItem.pieces_per_unit || 1)
      existingItem.subtotal = Number(existingItem.unit_price || 0) * existingItem.quantity
      existingItem.available_quantity = Math.max(0, Math.floor(Number(existingItem.available_stock || 0) / Math.max(1, Number(existingItem.pieces_per_unit || 1))))
      currentCart.subtotal = calculateCartSubtotal(currentCart.items)

      return currentCart
    })

    if (!snapshot && meta) {
      snapshot = applyOptimisticCart((currentCart) => {
        const nextItem = buildOptimisticCartItem(payload, meta)
        const nextItems = [nextItem, ...(currentCart.items || [])]

        return {
          ...currentCart,
          items: nextItems,
          subtotal: calculateCartSubtotal(nextItems),
          requires_prescription: nextItems.some((item) => Boolean(item.requires_prescription)),
          warnings: normalizeCartWarnings(nextItems),
        }
      })
    }

    try {
      const { data } = await cartApi.add(payload)
      updateCartState(data.data.cart)
      return data.data.cart
    } catch (error) {
      if (snapshot) {
        updateCartState(snapshot)
      }
      throw error
    }
  }, [applyOptimisticCart, customer, ensureGuestToken, guestToken, updateCartState])

  const updateCartItem = useCallback(async (id, payload) => {
    const nextQuantity = Number(payload.quantity || 0)
    const snapshot = applyOptimisticCart((currentCart) => {
      const item = currentCart.items?.find((entry) => String(entry.cart_item_id || entry.id) === String(id))
      if (!item || nextQuantity < 1) {
        return null
      }

      item.quantity = nextQuantity
      item.purchase_quantity = nextQuantity
      item.piece_quantity = nextQuantity * Number(item.pieces_per_unit || 1)
      item.subtotal = Number(item.unit_price || 0) * nextQuantity
      currentCart.subtotal = calculateCartSubtotal(currentCart.items)

      return currentCart
    })

    try {
      const { data } = await cartApi.update(id, payload)
      updateCartState(data.data.cart)
      return data.data.cart
    } catch (error) {
      if (snapshot) {
        updateCartState(snapshot)
      }
      throw error
    }
  }, [applyOptimisticCart, updateCartState])

  const removeCartItem = useCallback(async (id) => {
    const snapshot = applyOptimisticCart((currentCart) => {
      const nextItems = (currentCart.items || []).filter((item) => String(item.cart_item_id || item.id) !== String(id))
      if (nextItems.length === currentCart.items.length) {
        return null
      }

      currentCart.items = nextItems
      currentCart.subtotal = calculateCartSubtotal(nextItems)
      currentCart.requires_prescription = nextItems.some((item) => Boolean(item.requires_prescription))

      return currentCart
    })

    try {
      const { data } = await cartApi.remove(id)
      updateCartState(data.data)
      return data.data
    } catch (error) {
      if (snapshot) {
        updateCartState(snapshot)
      }
      throw error
    }
  }, [applyOptimisticCart, updateCartState])

  const clearCart = useCallback(async () => {
    const snapshot = applyOptimisticCart((currentCart) => ({
      ...currentCart,
      items: [],
      subtotal: 0,
      requires_prescription: false,
      warnings: [],
    }))

    try {
      const { data } = await cartApi.clear()
      updateCartState(data.data)
      return data.data
    } catch (error) {
      if (snapshot) {
        updateCartState(snapshot)
      }
      throw error
    }
  }, [applyOptimisticCart, updateCartState])

  const isWishlisted = useCallback(
    (productId) => wishlistRef.current.some((item) => String(item.id) === String(productId)),
    [],
  )

  const toggleWishlist = useCallback((product) => {
    const normalized = normalizeWishlistProduct(product)
    if (!normalized) return false

    const exists = wishlistRef.current.some((item) => String(item.id) === String(normalized.id))

    startTransition(() => {
      setWishlist((current) =>
        exists
          ? current.filter((item) => String(item.id) !== String(normalized.id))
          : [normalized, ...current.filter((item) => String(item.id) !== String(normalized.id))],
      )
    })

    return !exists
  }, [])

  const removeFromWishlist = useCallback((productId) => {
    startTransition(() => {
      setWishlist((current) => current.filter((item) => String(item.id) !== String(productId)))
    })
  }, [])

  const clearWishlist = useCallback(() => {
    startTransition(() => {
      setWishlist([])
    })
  }, [])

  const value = useMemo(() => ({
    cart,
    cartLoading,
    cartReady,
    cartCount: cartCountFromPayload(cart),
    wishlist,
    wishlistCount: wishlist.length,
    refreshCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    setCart: updateCartState,
    isWishlisted,
    toggleWishlist,
    removeFromWishlist,
    clearWishlist,
  }), [addToCart, cart, cartLoading, cartReady, clearCart, clearWishlist, isWishlisted, refreshCart, removeCartItem, removeFromWishlist, toggleWishlist, updateCartItem, updateCartState, wishlist])

  return <StorefrontContext.Provider value={value}>{children}</StorefrontContext.Provider>
}

export const useStorefront = () => useContext(StorefrontContext)

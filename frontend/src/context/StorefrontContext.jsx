/* eslint-disable react-refresh/only-export-components */
import { createContext, startTransition, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { cartApi } from '../api/cartApi'
import { useCustomerAuth } from './CustomerAuthContext'

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

function writeLocal(key, value) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
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
  const scope = useMemo(() => storageScope(customer, guestToken), [customer, guestToken])
  const cartCacheKey = useMemo(() => scopedStorageKey(CART_CACHE_KEY, scope), [scope])
  const wishlistCacheKey = useMemo(() => scopedStorageKey(WISHLIST_CACHE_KEY, scope), [scope])
  const [cart, setCart] = useState(() => readStorage(cartCacheKey, null))
  const [cartLoading, setCartLoading] = useState(() => !readStorage(cartCacheKey, null))
  const [cartReady, setCartReady] = useState(() => Boolean(readStorage(cartCacheKey, null)))
  const [wishlist, setWishlist] = useState(() => readStorage(wishlistCacheKey, []))
  const cartRef = useRef(cart)
  const cartPromiseRef = useRef(null)

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
    }
  }, [cart, cartCacheKey])

  useEffect(() => {
    writeLocal(wishlistCacheKey, wishlist)
  }, [wishlist, wishlistCacheKey])

  const updateCartState = useCallback((nextCart) => {
    setCart(nextCart)
    setCartLoading(false)
    setCartReady(true)
  }, [])

  const refreshCart = useCallback(async ({ force = false } = {}) => {
    if (authLoading) {
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
  }, [authLoading, cartReady, customer, ensureGuestToken, updateCartState])

  useEffect(() => {
    if (authLoading) return

    refreshCart({ force: true }).catch(() => {})
  }, [authLoading, customer, refreshCart])

  const addToCart = useCallback(async (payload) => {
    await ensureGuestToken()
    const { data } = await cartApi.add(payload)
    updateCartState(data.data.cart)
    return data.data.cart
  }, [ensureGuestToken, updateCartState])

  const updateCartItem = useCallback(async (id, payload) => {
    const { data } = await cartApi.update(id, payload)
    updateCartState(data.data.cart)
    return data.data.cart
  }, [updateCartState])

  const removeCartItem = useCallback(async (id) => {
    const { data } = await cartApi.remove(id)
    updateCartState(data.data)
    return data.data
  }, [updateCartState])

  const clearCart = useCallback(async () => {
    const { data } = await cartApi.clear()
    updateCartState(data.data)
    return data.data
  }, [updateCartState])

  const isWishlisted = useCallback(
    (productId) => wishlist.some((item) => String(item.id) === String(productId)),
    [wishlist],
  )

  const toggleWishlist = useCallback((product) => {
    const normalized = normalizeWishlistProduct(product)
    if (!normalized) return false

    const exists = wishlist.some((item) => String(item.id) === String(normalized.id))

    startTransition(() => {
      setWishlist((current) =>
        exists
          ? current.filter((item) => String(item.id) !== String(normalized.id))
          : [normalized, ...current.filter((item) => String(item.id) !== String(normalized.id))],
      )
    })

    return !exists
  }, [wishlist])

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
  }), [addToCart, cart, cartLoading, cartReady, clearCart, isWishlisted, refreshCart, removeCartItem, toggleWishlist, updateCartItem, updateCartState, wishlist])

  return <StorefrontContext.Provider value={value}>{children}</StorefrontContext.Provider>
}

export const useStorefront = () => useContext(StorefrontContext)

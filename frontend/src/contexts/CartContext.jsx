import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { isAuth } = useAuth()
  const [cart, setCart] = useState([])
  const [cartCount, setCartCount] = useState(0)
  const [cartTotal, setCartTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchCart = useCallback(async () => {
    if (!isAuth) { setCart([]); setCartCount(0); setCartTotal(0); return }
    try {
      const { data } = await api.get('/marketplace/cart')
      if (data.success) {
        setCart(data.cart)
        setCartCount(data.count)
        setCartTotal(data.total)
      }
    } catch {}
  }, [isAuth])

  useEffect(() => { fetchCart() }, [fetchCart])

  const addToCart = async (productId, quantity = 1) => {
    await api.post('/marketplace/cart', { product_id: productId, quantity })
    fetchCart()
  }

  const removeFromCart = async (itemId) => {
    await api.delete(`/marketplace/cart/${itemId}`)
    fetchCart()
  }

  const updateQuantity = async (itemId, quantity) => {
    if (quantity <= 0) return removeFromCart(itemId)
    await api.put(`/marketplace/cart/${itemId}`, { quantity })
    fetchCart()
  }

  const clearCart = async () => {
    await api.delete('/marketplace/cart/clear')
    setCart([]); setCartCount(0); setCartTotal(0)
  }

  return (
    <CartContext.Provider value={{ cart, cartCount, cartTotal, loading, fetchCart, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)

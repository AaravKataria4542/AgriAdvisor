import { useState, useEffect } from 'react'
import api from '../services/api'
import { useCart } from '../contexts/CartContext'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export default function Cart() {
  const { cart, cartTotal, cartCount, removeFromCart, updateQuantity, clearCart, fetchCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [address, setAddress] = useState('')
  const [payLoading, setPayLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { fetchCart() }, [])

  const handleCheckout = async () => {
    if (!address.trim()) return toast.error('Please enter a delivery address')
    setPayLoading(true)
    try {
      // 1. Create order
      const { data: orderData } = await api.post('/marketplace/orders', { delivery_address: address })
      if (!orderData.success) { toast.error(orderData.message); setPayLoading(false); return }

      const orderId = orderData.order.id
      const totalAmount = orderData.order.total_amount

      // 2. Create Razorpay order
      const { data: payData } = await api.post('/payment/create-order', { order_id: orderId })
      if (!payData.success) { toast.error(payData.message); setPayLoading(false); return }

      // 3. Open Razorpay checkout
      const options = {
        key: payData.key_id,
        amount: payData.amount,
        currency: 'INR',
        name: 'AgriAdvisor Marketplace',
        description: `Order #${orderId}`,
        order_id: payData.razorpay_order_id,
        handler: async (response) => {
          try {
            const { data: verifyData } = await api.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              order_id: orderId,
            })
            if (verifyData.success) {
              toast.success('🎉 Payment successful! Order placed!')
              await clearCart()
              navigate('/orders')
            } else toast.error('Payment verification failed')
          } catch { toast.error('Verification error') }
        },
        prefill: { name: 'AgriAdvisor User' },
        theme: { color: '#16a34a' },
        modal: { ondismiss: () => { toast('Payment cancelled', { icon: 'ℹ️' }); setPayLoading(false) } },
      }

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options)
        rzp.open()
      } else {
        toast.error('Razorpay not loaded. Please refresh page.')
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Checkout failed')
    } finally { setPayLoading(false) }
  }

  if (cart.length === 0) return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div className="page-icon">🛍</div>
        <div><h1 className="page-title">My Cart</h1></div>
      </div>
      <div className="glass-card" style={{padding:'64px',textAlign:'center',color:'var(--text-muted)'}}>
        <div style={{fontSize:'4rem',marginBottom:'16px'}}>🛒</div>
        <h3 style={{fontFamily:'Poppins',fontWeight:700,marginBottom:'12px'}}>Your cart is empty</h3>
        <p style={{marginBottom:'20px'}}>Browse the marketplace to add products</p>
        <a href="/marketplace" className="btn btn-primary">🛒 Go to Marketplace</a>
      </div>
    </div>
  )

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div className="page-icon">🛍</div>
        <div>
          <h1 className="page-title">My Cart</h1>
          <p className="page-subtitle">{cartCount} item{cartCount !== 1 ? 's' : ''} ready for checkout</p>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 360px',gap:'24px',alignItems:'start'}}>
        {/* Cart items */}
        <div className="glass-card" style={{padding:'24px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
            <h3 style={{fontWeight:700,color:'var(--text-secondary)'}}>Cart Items</h3>
            <button className="btn btn-danger btn-sm" onClick={() => { clearCart(); toast.success('Cart cleared') }}>🗑 Clear All</button>
          </div>
          {cart.map(item => (
            <div key={item.id} className="cart-item-row">
              <div style={{width:56,height:56,background:'linear-gradient(135deg,rgba(22,163,74,0.2),rgba(16,185,129,0.1))',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.8rem',flexShrink:0}}>
                🌾
              </div>
              <div style={{flex:1}}>
                <p style={{fontWeight:700,fontSize:'0.95rem'}}>{item.product?.title}</p>
                <p style={{color:'var(--text-muted)',fontSize:'0.78rem'}}>₹{item.product?.price} per {item.product?.unit}</p>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <button className="btn btn-secondary btn-sm" onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                <span style={{fontWeight:700,minWidth:'30px',textAlign:'center'}}>{item.quantity}</span>
                <button className="btn btn-secondary btn-sm" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
              </div>
              <div style={{minWidth:'80px',textAlign:'right'}}>
                <div style={{fontFamily:'Poppins',fontWeight:800,color:'var(--accent-green)'}}>₹{item.subtotal?.toLocaleString()}</div>
              </div>
              <button className="btn btn-danger btn-sm" onClick={() => removeFromCart(item.id)}>✕</button>
            </div>
          ))}
        </div>

        {/* Order summary + checkout */}
        <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
          <div className="glass-card" style={{padding:'24px'}}>
            <h3 style={{fontWeight:700,marginBottom:'16px',color:'var(--text-secondary)'}}>🧾 Order Summary</h3>
            {cart.map(item => (
              <div key={item.id} style={{display:'flex',justifyContent:'space-between',fontSize:'0.85rem',marginBottom:'8px',color:'var(--text-muted)'}}>
                <span>{item.product?.title?.slice(0,25)}... × {item.quantity}</span>
                <span>₹{item.subtotal?.toLocaleString()}</span>
              </div>
            ))}
            <div style={{borderTop:'1px solid var(--border)',marginTop:'14px',paddingTop:'14px',display:'flex',justifyContent:'space-between'}}>
              <span style={{fontWeight:700}}>Total</span>
              <span style={{fontFamily:'Poppins',fontWeight:800,fontSize:'1.4rem',color:'var(--accent-green)'}}>₹{cartTotal.toLocaleString()}</span>
            </div>
          </div>

          <div className="glass-card" style={{padding:'24px'}}>
            <h3 style={{fontWeight:700,marginBottom:'14px',color:'var(--text-secondary)'}}>📍 Delivery Address</h3>
            <textarea className="form-textarea" placeholder="Enter your complete delivery address..." value={address} onChange={e=>setAddress(e.target.value)} style={{minHeight:'90px'}}/>
            <button className="btn btn-primary" onClick={handleCheckout} disabled={payLoading} style={{width:'100%',justifyContent:'center',marginTop:'14px',fontSize:'1rem',padding:'14px'}}>
              {payLoading ? '⏳ Processing...' : '💳 Pay with Razorpay'}
            </button>
            <p style={{fontSize:'0.75rem',color:'var(--text-muted)',textAlign:'center',marginTop:'10px'}}>🔒 Secured by Razorpay. Test mode active.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

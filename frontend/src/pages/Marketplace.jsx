import { useState, useEffect } from 'react'
import api from '../services/api'
import { useCart } from '../contexts/CartContext'
import toast from 'react-hot-toast'

const CATEGORY_ICONS = { crops:'🌽', seeds:'🌱', equipment:'🚜', fertilizer:'🧪' }
const CATEGORIES = ['all','crops','seeds','equipment','fertilizer']

export default function Marketplace() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [addingId, setAddingId] = useState(null)
  const { addToCart } = useCart()

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (category !== 'all') params.append('category', category)
      if (search) params.append('search', search)
      const { data } = await api.get(`/marketplace/products?${params}`)
      if (data.success) setProducts(data.products)
    } catch { toast.error('Failed to load products') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchProducts() }, [category])

  const handleSearch = (e) => { e.preventDefault(); fetchProducts() }

  const handleAddToCart = async (product) => {
    setAddingId(product.id)
    try {
      await addToCart(product.id, 1)
      toast.success(`${product.title} added to cart! 🛒`)
    } catch { toast.error('Failed to add to cart') }
    finally { setAddingId(null) }
  }

  const catEmoji = (c) => CATEGORY_ICONS[c] || '📦'

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div className="page-icon">🛒</div>
        <div>
          <h1 className="page-title">Marketplace</h1>
          <p className="page-subtitle">Buy & sell crops, seeds, equipment and fertilizers</p>
        </div>
      </div>

      {/* Search & filters */}
      <div className="glass-card" style={{padding:'20px',marginBottom:'24px'}}>
        <div style={{display:'flex',gap:'12px',flexWrap:'wrap',alignItems:'center'}}>
          <form onSubmit={handleSearch} style={{display:'flex',gap:'8px',flex:2,minWidth:'200px'}}>
            <input className="form-input" placeholder="Search products..." value={search} onChange={e=>setSearch(e.target.value)} />
            <button className="btn btn-secondary" type="submit">🔍</button>
          </form>
          <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className={`btn btn-sm ${category===c ? 'btn-primary' : 'btn-secondary'}`}>
                {c==='all' ? '🏪 All' : `${catEmoji(c)} ${c.charAt(0).toUpperCase()+c.slice(1)}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products grid */}
      {loading ? (
        <div className="loading-screen"><div className="spinner"/><p>Loading products...</p></div>
      ) : products.length === 0 ? (
        <div className="glass-card" style={{padding:'64px',textAlign:'center',color:'var(--text-muted)'}}>
          <div style={{fontSize:'3rem',marginBottom:'16px'}}>🏪</div>
          <p>No products found. Try a different search or category.</p>
        </div>
      ) : (
        <div className="products-grid">
          {products.map(p => (
            <div key={p.id} className="glass-card product-card">
              <div className="product-img">
                {p.image_url ? <img src={p.image_url} alt={p.title} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <span>{catEmoji(p.category)}</span>}
              </div>
              <div className="product-body">
                <span className="badge badge-info" style={{marginBottom:'8px',fontSize:'0.7rem'}}>{catEmoji(p.category)} {p.category}</span>
                <p className="product-title">{p.title}</p>
                <p style={{fontSize:'0.8rem',color:'var(--text-muted)',margin:'4px 0 10px',lineHeight:1.5}}>{p.description?.slice(0,80)}...</p>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
                  <div>
                    <span className="product-price">₹{p.price.toLocaleString()}</span>
                    <span style={{color:'var(--text-muted)',fontSize:'0.8rem'}}>/{p.unit}</span>
                  </div>
                  <span style={{fontSize:'0.78rem',color:'var(--text-muted)'}}>📦 {p.quantity} {p.unit}</span>
                </div>
                <div style={{fontSize:'0.75rem',color:'var(--text-muted)',marginBottom:'12px'}}>
                  👤 {p.seller_name} · 📍 {p.location || p.seller_location}
                </div>
                <div className="product-actions">
                  <button className="btn btn-primary btn-sm" onClick={() => handleAddToCart(p)} disabled={addingId===p.id} style={{justifyContent:'center'}}>
                    {addingId===p.id ? '⏳' : '🛒 Add to Cart'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

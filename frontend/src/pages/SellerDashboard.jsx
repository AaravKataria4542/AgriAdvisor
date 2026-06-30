import { useState, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const CATS = ['crops','seeds','equipment','fertilizer']

export default function SellerDashboard() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ title:'', description:'', category:'crops', price:'', quantity:'', unit:'kg', location:'' })

  const fetchMyProducts = async () => {
    try {
      const { data } = await api.get('/marketplace/my-products')
      if (data.success) setProducts(data.products)
    } catch { toast.error('Failed to load products') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchMyProducts() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = { ...form, price: +form.price, quantity: +form.quantity }
      const { data } = await api.post('/marketplace/products', payload)
      if (data.success) {
        toast.success('Product listed successfully! 🎉')
        setProducts(p => [data.product, ...p])
        setShowForm(false)
        setForm({ title:'',description:'',category:'crops',price:'',quantity:'',unit:'kg',location:'' })
      } else toast.error(data.message)
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to create listing') }
    finally { setSubmitting(false) }
  }

  const toggleActive = async (product) => {
    try {
      await api.put(`/marketplace/products/${product.id}`, { is_active: !product.is_active })
      setProducts(ps => ps.map(p => p.id === product.id ? {...p, is_active: !p.is_active} : p))
      toast.success(product.is_active ? 'Listing deactivated' : 'Listing reactivated')
    } catch { toast.error('Update failed') }
  }

  const deleteProduct = async (id) => {
    try {
      await api.delete(`/marketplace/products/${id}`)
      setProducts(ps => ps.filter(p => p.id !== id))
      toast.success('Listing removed')
    } catch { toast.error('Delete failed') }
  }

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div className="page-icon">🏪</div>
        <div>
          <h1 className="page-title">Seller Dashboard</h1>
          <p className="page-subtitle">Manage your product listings on the marketplace</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{marginBottom:'24px'}}>
        {[
          {icon:'📦',val:products.length,label:'Total Listings'},
          {icon:'✅',val:products.filter(p=>p.is_active).length,label:'Active'},
          {icon:'🚫',val:products.filter(p=>!p.is_active).length,label:'Inactive'},
          {icon:'💰',val:`₹${products.reduce((s,p)=>s+p.price*p.quantity,0).toLocaleString()}`,label:'Inventory Value'},
        ].map(s=>(
          <div key={s.label} className="glass-card stat-card">
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value">{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Add product button */}
      <div style={{marginBottom:'20px'}}>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Add New Listing'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="glass-card" style={{padding:'28px',marginBottom:'24px'}} className="fade-in">
          <h3 style={{fontWeight:700,marginBottom:'20px',color:'var(--text-secondary)'}}>📋 New Product Listing</h3>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Product Title</label>
              <input className="form-input" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Organic Wheat Seeds HD-2967" required/>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Describe your product..." style={{minHeight:'80px'}}/>
            </div>
            <div className="input-row">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                  {CATS.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Unit</label>
                <select className="form-select" value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})}>
                  {['kg','quintal','tonne','litre','unit','bag (50kg)','bag (25kg)'].map(u=><option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div className="input-row">
              <div className="form-group">
                <label className="form-label">Price (₹ per unit)</label>
                <input className="form-input" type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} min="0" step="0.01" required/>
              </div>
              <div className="form-group">
                <label className="form-label">Available Quantity</label>
                <input className="form-input" type="number" value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})} min="0" required/>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input className="form-input" value={form.location} onChange={e=>setForm({...form,location:e.target.value})} placeholder="e.g. Ludhiana, Punjab"/>
            </div>
            <button className="btn btn-primary" type="submit" disabled={submitting} style={{justifyContent:'center'}}>
              {submitting ? '⏳ Listing...' : '🚀 List Product'}
            </button>
          </form>
        </div>
      )}

      {/* My listings */}
      {loading ? <div className="loading-screen"><div className="spinner"/><p>Loading...</p></div> : (
        products.length === 0 ? (
          <div className="glass-card" style={{padding:'48px',textAlign:'center',color:'var(--text-muted)'}}>
            <div style={{fontSize:'3rem',marginBottom:'12px'}}>🏪</div>
            <p>No listings yet. Click "Add New Listing" to start selling!</p>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
            {products.map(p=>(
              <div key={p.id} className="glass-card" style={{padding:'20px',display:'flex',alignItems:'center',gap:'16px',flexWrap:'wrap'}}>
                <div style={{width:52,height:52,background:'linear-gradient(135deg,rgba(22,163,74,0.2),rgba(16,185,129,0.1))',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.8rem',flexShrink:0}}>
                  {p.category==='crops'?'🌽':p.category==='seeds'?'🌱':p.category==='equipment'?'🚜':'🧪'}
                </div>
                <div style={{flex:1}}>
                  <div style={{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap',marginBottom:'4px'}}>
                    <h3 style={{fontWeight:700,fontSize:'1rem'}}>{p.title}</h3>
                    <span className={`badge ${p.is_active?'badge-success':'badge-danger'}`}>{p.is_active?'Active':'Inactive'}</span>
                  </div>
                  <p style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>
                    ₹{p.price.toLocaleString()}/{p.unit} · {p.quantity} {p.unit} available · 📍{p.location}
                  </p>
                </div>
                <div style={{display:'flex',gap:'8px'}}>
                  <button className={`btn btn-sm ${p.is_active?'btn-secondary':'btn-primary'}`} onClick={()=>toggleActive(p)}>
                    {p.is_active?'⏸ Deactivate':'▶ Reactivate'}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={()=>deleteProduct(p.id)}>🗑 Delete</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}

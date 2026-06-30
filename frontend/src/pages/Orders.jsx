import { useState, useEffect } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('orders')

  useEffect(() => {
    Promise.all([api.get('/marketplace/orders'), api.get('/payment/transactions')])
      .then(([o, t]) => {
        if (o.data.success) setOrders(o.data.orders)
        if (t.data.success) setTransactions(t.data.transactions)
      })
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false))
  }, [])

  const statusColor = {paid:'badge-success',pending:'badge-warning',cancelled:'badge-danger',delivered:'badge-info'}

  const tabStyle = (t) => ({
    padding:'10px 20px',border:'none',borderRadius:'8px',cursor:'pointer',fontWeight:600,fontSize:'0.875rem',
    background:tab===t?'linear-gradient(135deg,#16a34a,#15803d)':'transparent',
    color:tab===t?'#fff':'var(--text-muted)',transition:'all 0.2s'
  })

  if (loading) return <div className="page-container"><div className="loading-screen"><div className="spinner"/><p>Loading orders...</p></div></div>

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div className="page-icon">📦</div>
        <div>
          <h1 className="page-title">Orders & Transactions</h1>
          <p className="page-subtitle">Track your purchases and payment history</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{marginBottom:'24px'}}>
        {[
          {icon:'📦',val:orders.length,label:'Total Orders'},
          {icon:'✅',val:orders.filter(o=>o.status==='paid').length,label:'Paid'},
          {icon:'⏳',val:orders.filter(o=>o.status==='pending').length,label:'Pending'},
          {icon:'💰',val:`₹${orders.reduce((s,o)=>s+o.total_amount,0).toLocaleString()}`,label:'Total Spent'},
        ].map(s=>(
          <div key={s.label} className="glass-card stat-card">
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value">{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:'4px',marginBottom:'20px',background:'var(--bg-secondary)',padding:'6px',borderRadius:'12px',width:'fit-content'}}>
        <button style={tabStyle('orders')} onClick={()=>setTab('orders')}>📦 Orders ({orders.length})</button>
        <button style={tabStyle('transactions')} onClick={()=>setTab('transactions')}>💳 Transactions ({transactions.length})</button>
      </div>

      {tab === 'orders' && (
        orders.length === 0 ? (
          <div className="glass-card" style={{padding:'64px',textAlign:'center',color:'var(--text-muted)'}}>
            <div style={{fontSize:'3.5rem',marginBottom:'16px'}}>📦</div>
            <p>No orders yet. <a href="/marketplace" style={{color:'var(--accent-green)'}}>Browse marketplace →</a></p>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
            {orders.map(order=>(
              <div key={order.id} className="glass-card" style={{padding:'24px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'16px',flexWrap:'wrap',gap:'8px'}}>
                  <div>
                    <h3 style={{fontFamily:'Poppins',fontWeight:700}}>Order #{order.id}</h3>
                    <p style={{fontSize:'0.8rem',color:'var(--text-muted)',marginTop:'2px'}}>{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                  <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                    <span className={`badge ${statusColor[order.status]||'badge-info'}`}>{order.status.toUpperCase()}</span>
                    <span style={{fontFamily:'Poppins',fontWeight:800,fontSize:'1.2rem',color:'var(--accent-green)'}}>₹{order.total_amount.toLocaleString()}</span>
                  </div>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                  {order.items?.map(item=>(
                    <div key={item.id} style={{display:'flex',justifyContent:'space-between',padding:'10px 14px',background:'rgba(0,0,0,0.2)',borderRadius:'8px',fontSize:'0.85rem'}}>
                      <span style={{color:'var(--text-secondary)'}}>{item.product_title} × {item.quantity}</span>
                      <span style={{color:'var(--accent-green)',fontWeight:600}}>₹{item.subtotal?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                {order.delivery_address && (
                  <p style={{fontSize:'0.8rem',color:'var(--text-muted)',marginTop:'12px'}}>📍 {order.delivery_address}</p>
                )}
                {order.transaction && (
                  <div style={{marginTop:'12px',padding:'10px',background:'rgba(74,222,128,0.06)',borderRadius:'8px',border:'1px solid var(--border)',fontSize:'0.78rem',color:'var(--text-muted)'}}>
                    💳 Payment ID: <span style={{color:'var(--accent-green)',fontFamily:'monospace'}}>{order.transaction.razorpay_payment_id || 'N/A'}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'transactions' && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Transaction ID</th><th>Order</th><th>Razorpay Payment ID</th><th>Amount</th><th>Status</th><th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr><td colSpan={6} style={{textAlign:'center',padding:'40px',color:'var(--text-muted)'}}>No transactions yet</td></tr>
              ) : transactions.map(t=>(
                <tr key={t.id}>
                  <td style={{fontFamily:'monospace',fontSize:'0.8rem'}}>#{t.id}</td>
                  <td>#{t.order_id}</td>
                  <td style={{fontFamily:'monospace',fontSize:'0.75rem',color:'var(--accent-green)'}}>{t.razorpay_payment_id||'—'}</td>
                  <td style={{fontWeight:700,color:'var(--accent-green)'}}>₹{t.amount.toLocaleString()}</td>
                  <td><span className={`badge ${t.status==='success'?'badge-success':t.status==='failed'?'badge-danger':'badge-warning'}`}>{t.status}</span></td>
                  <td style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>{new Date(t.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

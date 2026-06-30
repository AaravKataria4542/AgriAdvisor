import { useAuth } from '../contexts/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()
  const tools = [
    { icon:'🔬', label:'Disease Detection', sub:'AI leaf analysis', to:'/disease-prediction', color:'#10b981' },
    { icon:'🪱', label:'Soil Analysis', sub:'Health & nutrients', to:'/soil-prediction', color:'#84cc16' },
    { icon:'🌤', label:'Weather Forecast', sub:'Live + 6-month', to:'/weather', color:'#38bdf8' },
    { icon:'🌱', label:'Crop Advisor', sub:'AI recommendation', to:'/crop-recommendation', color:'#4ade80' },
    { icon:'📊', label:'Yield Prediction', sub:'ML-based forecast', to:'/yield-prediction', color:'#facc15' },
    { icon:'🧪', label:'Fertilizer Guide', sub:'NPK calculator', to:'/fertilizer', color:'#fb923c' },
    { icon:'🛒', label:'Marketplace', sub:'Buy & sell crops', to:'/marketplace', color:'#c084fc' },
    { icon:'📦', label:'My Orders', sub:'Track purchases', to:'/orders', color:'#f472b6' },
  ]

  return (
    <div className="page-container fade-in">
      {/* Welcome hero */}
      <div className="glass-card" style={{padding:'32px',marginBottom:'28px',background:'linear-gradient(135deg,rgba(22,163,74,0.15),rgba(16,185,129,0.08))'}}>
        <div style={{display:'flex',alignItems:'center',gap:'20px'}}>
          <div style={{fontSize:'3rem'}}>👨‍🌾</div>
          <div>
            <h1 style={{fontFamily:'Poppins',fontSize:'1.8rem',fontWeight:800}}>
              Welcome back, {user?.name?.split(' ')[0]} 🌾
            </h1>
            <p style={{color:'var(--text-muted)',marginTop:'6px'}}>
              Your AI-powered agricultural companion. What would you like to do today?
            </p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="stats-grid" style={{marginBottom:'28px'}}>
        {[
          { icon:'🌍', val:'15+', label:'Crop Types' },
          { icon:'🤖', val:'4', label:'AI Models' },
          { icon:'📡', val:'Live', label:'Weather Data' },
          { icon:'🛒', val:'∞', label:'Marketplace' },
        ].map(s => (
          <div key={s.label} className="glass-card stat-card">
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value">{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tools grid */}
      <h2 style={{fontFamily:'Poppins',fontSize:'1.2rem',fontWeight:700,marginBottom:'20px',color:'var(--text-secondary)'}}>
        🚀 Quick Access
      </h2>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'16px'}}>
        {tools.map(t => (
          <a key={t.to} href={t.to} className="glass-card" style={{padding:'24px',cursor:'pointer',textDecoration:'none'}}>
            <div style={{fontSize:'2.2rem',marginBottom:'12px',filter:`drop-shadow(0 0 8px ${t.color}50)`}}>{t.icon}</div>
            <div style={{fontWeight:700,fontSize:'1rem',color:'var(--text-primary)'}}>{t.label}</div>
            <div style={{color:'var(--text-muted)',fontSize:'0.8rem',marginTop:'4px'}}>{t.sub}</div>
            <div style={{marginTop:'14px',paddingTop:'14px',borderTop:'1px solid var(--border)',display:'flex',alignItems:'center',gap:'8px',color:t.color,fontSize:'0.8rem',fontWeight:600}}>
              Open <span>→</span>
            </div>
          </a>
        ))}
      </div>

      {/* Tips */}
      <div className="glass-card" style={{padding:'24px',marginTop:'28px'}}>
        <h3 style={{fontWeight:700,marginBottom:'16px',color:'var(--accent-green)'}}>💡 Today's Farming Tips</h3>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:'12px'}}>
          {[
            {tip:'Upload leaf images to detect plant disease early and save your crop.', icon:'🔬'},
            {tip:'Check live weather before irrigation — optimize water usage with forecasts.', icon:'🌧'},
            {tip:'Use the Marketplace to sell your produce directly to buyers.', icon:'💰'},
          ].map((t,i) => (
            <div key={i} style={{padding:'14px',background:'rgba(0,0,0,0.2)',borderRadius:'10px',border:'1px solid var(--border)'}}>
              <span style={{fontSize:'1.4rem'}}>{t.icon}</span>
              <p style={{fontSize:'0.85rem',color:'var(--text-secondary)',marginTop:'8px'}}>{t.tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

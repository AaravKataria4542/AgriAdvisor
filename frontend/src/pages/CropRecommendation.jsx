import { useState } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function CropRecommendation() {
  const [form, setForm] = useState({ rainfall:'800',temperature:'25',humidity:'65',soil_type:'loamy',ph_level:'6.5',season:'kharif',farm_size:'1',water_availability:'medium',experience_level:'intermediate',market_preference:'food_grain' })
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = { ...form, rainfall: +form.rainfall, temperature: +form.temperature, humidity: +form.humidity, ph_level: +form.ph_level, farm_size: +form.farm_size }
      const { data } = await api.post('/crop/recommend', payload)
      if (data.success) { setResults(data.recommendations); toast.success(`${data.recommendations.length} crops analysed!`) }
      else toast.error(data.message)
    } catch (e) { toast.error('Recommendation failed') }
    finally { setLoading(false) }
  }

  const levelColors = { 'Highly Recommended':'var(--accent-green)', 'Recommended':'#60a5fa', 'Moderately Suitable':'var(--accent-yellow)', 'Not Recommended':'#f87171' }
  const levelBadge  = { 'Highly Recommended':'badge-success', 'Recommended':'badge-info', 'Moderately Suitable':'badge-warning', 'Not Recommended':'badge-danger' }

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div className="page-icon">🌱</div>
        <div>
          <h1 className="page-title">Crop Recommendation</h1>
          <p className="page-subtitle">AI-powered multi-factor crop suitability analysis</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px' }}>
        {/* Form */}
        <div className="glass-card" style={{ padding: '24px', height: 'fit-content' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '20px', color: 'var(--text-secondary)' }}>⚙️ Farm Parameters</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Annual Rainfall (mm)</label>
              <input className="form-input" type="number" value={form.rainfall} onChange={e=>setForm({...form,rainfall:e.target.value})} min="0" max="4000" />
            </div>
            <div className="input-row">
              <div className="form-group">
                <label className="form-label">Temperature (°C)</label>
                <input className="form-input" type="number" value={form.temperature} onChange={e=>setForm({...form,temperature:e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Humidity (%)</label>
                <input className="form-input" type="number" value={form.humidity} onChange={e=>setForm({...form,humidity:e.target.value})} max="100" />
              </div>
            </div>
            <div className="input-row">
              <div className="form-group">
                <label className="form-label">Soil Type</label>
                <select className="form-select" value={form.soil_type} onChange={e=>setForm({...form,soil_type:e.target.value})}>
                  {['loamy','clay','sandy','black','red','alluvial','silt'].map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Soil pH</label>
                <input className="form-input" type="number" step="0.1" value={form.ph_level} onChange={e=>setForm({...form,ph_level:e.target.value})} min="0" max="14" />
              </div>
            </div>
            <div className="input-row">
              <div className="form-group">
                <label className="form-label">Season</label>
                <select className="form-select" value={form.season} onChange={e=>setForm({...form,season:e.target.value})}>
                  {['kharif','rabi','zaid','annual'].map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Farm Size (ha)</label>
                <input className="form-input" type="number" step="0.1" value={form.farm_size} onChange={e=>setForm({...form,farm_size:e.target.value})} min="0.1" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Water Availability</label>
              <select className="form-select" value={form.water_availability} onChange={e=>setForm({...form,water_availability:e.target.value})}>
                {['low','medium','high','very_high'].map(s=><option key={s} value={s}>{s.replace('_',' ').replace(/\b\w/g,l=>l.toUpperCase())}</option>)}
              </select>
            </div>
            <div className="input-row">
              <div className="form-group">
                <label className="form-label">Experience</label>
                <select className="form-select" value={form.experience_level} onChange={e=>setForm({...form,experience_level:e.target.value})}>
                  {['beginner','intermediate','advanced'].map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Market</label>
                <select className="form-select" value={form.market_preference} onChange={e=>setForm({...form,market_preference:e.target.value})}>
                  {['food_grain','cash_crop','vegetable','oilseed','spice','mixed'].map(s=><option key={s} value={s}>{s.replace('_',' ').replace(/\b\w/g,l=>l.toUpperCase())}</option>)}
                </select>
              </div>
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{width:'100%',justifyContent:'center'}}>
              {loading ? '⏳ Analyzing...' : '🌱 Get Recommendations'}
            </button>
          </form>
        </div>

        {/* Results */}
        <div>
          {loading && <div className="loading-screen glass-card" style={{padding:'64px'}}><div className="spinner"/><p>Analyzing 12 crops...</p></div>}
          {!loading && results.length === 0 && (
            <div className="glass-card" style={{padding:'64px',textAlign:'center',color:'var(--text-muted)'}}>
              <div style={{fontSize:'4rem',marginBottom:'16px'}}>🌾</div>
              <p>Fill the form and click Recommend to see AI-ranked crops</p>
            </div>
          )}
          {results.length > 0 && (
            <div className="fade-in">
              {results.map((r, i) => (
                <div key={r.crop} className="glass-card" style={{padding:'20px',marginBottom:'14px',borderLeft:`3px solid ${levelColors[r.level]||'var(--border)'}`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'12px',flexWrap:'wrap',gap:'8px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                      <span style={{fontFamily:'Poppins',fontWeight:800,fontSize:'1.3rem',color:levelColors[r.level]||'#fff'}}>#{i+1}</span>
                      <div>
                        <h3 style={{fontFamily:'Poppins',fontWeight:700,fontSize:'1.1rem'}}>{r.crop}</h3>
                        <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginTop:'4px'}}>
                          <span className={`badge ${levelBadge[r.level]||'badge-info'}`}>{r.level}</span>
                          <span className="badge badge-orange">⏱ {r.duration}</span>
                          <span className="badge badge-info">💹 {r.profit.replace('_',' ').replace(/\b\w/g,l=>l.toUpperCase())} profit</span>
                        </div>
                      </div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontFamily:'Poppins',fontSize:'1.8rem',fontWeight:800,color:levelColors[r.level]||'#fff'}}>{r.score}%</div>
                      <div style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>Suitability</div>
                    </div>
                  </div>
                  <div className="progress-bar" style={{marginBottom:'14px'}}>
                    <div className="progress-fill" style={{width:`${r.score}%`,background:`linear-gradient(90deg,${levelColors[r.level]||'#4ade80'},${levelColors[r.level]||'#4ade80'}88)`}} />
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:'8px',marginBottom:'12px'}}>
                    <div style={{padding:'10px',background:'rgba(0,0,0,0.2)',borderRadius:'8px',fontSize:'0.82rem'}}>
                      <span style={{color:'var(--text-muted)'}}>Est. Yield: </span>
                      <strong style={{color:'var(--accent-green)'}}>{r.estimated_yield_kg_ha?.toLocaleString()} kg/ha</strong>
                    </div>
                    <div style={{padding:'10px',background:'rgba(0,0,0,0.2)',borderRadius:'8px',fontSize:'0.82rem'}}>
                      <span style={{color:'var(--text-muted)'}}>Investment: </span>
                      <strong style={{color:'var(--accent-yellow)'}}>₹{r.investment_per_ha?.toLocaleString()}/ha</strong>
                    </div>
                    <div style={{padding:'10px',background:'rgba(0,0,0,0.2)',borderRadius:'8px',fontSize:'0.82rem'}}>
                      <span style={{color:'var(--text-muted)'}}>Market: </span>
                      <strong>{r.market}</strong>
                    </div>
                    <div style={{padding:'10px',background:'rgba(0,0,0,0.2)',borderRadius:'8px',fontSize:'0.82rem'}}>
                      <span style={{color:'var(--text-muted)'}}>Water: </span>
                      <strong>{r.water_need}</strong>
                    </div>
                  </div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:'4px'}}>
                    {r.details?.slice(0,4).map((d,j)=>(
                      <span key={j} style={{fontSize:'0.75rem',padding:'2px 8px',borderRadius:'8px',background:'rgba(0,0,0,0.25)',color:d.includes('✓')?'var(--accent-green)':'var(--accent-yellow)'}}>{d}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

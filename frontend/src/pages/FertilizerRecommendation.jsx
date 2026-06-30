import { useState } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function FertilizerRecommendation() {
  const [form, setForm] = useState({ crop:'Maize', rainfall:'800', soil_type:'loamy', field_size:'1', growth_stage:'vegetative' })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const CROPS = ['Maize','Rice','Potatoes','Soybeans','Wheat','Sorghum','Cotton','Sugarcane','Tomatoes']
  const SOILS = ['loamy','clay','sandy','black','red','silt']
  const STAGES = ['pre-sowing','sowing','vegetative','flowering','maturity']

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/fertilizer/recommend', { ...form, rainfall:+form.rainfall, field_size:+form.field_size })
      if (data.success) { setResult(data.recommendation); toast.success('NPK recommendation ready!') }
      else toast.error(data.message)
    } catch { toast.error('Recommendation failed') }
    finally { setLoading(false) }
  }

  const nutrients = result ? [
    { name:'Nitrogen (N)', val: result.nitrogen_kg_ha, total: result.total_nitrogen_kg, color:'#4ade80', icon:'🟢' },
    { name:'Phosphorus (P)', val: result.phosphorus_kg_ha, total: result.total_phosphorus_kg, color:'#fb923c', icon:'🟠' },
    { name:'Potassium (K)', val: result.potassium_kg_ha, total: result.total_potassium_kg, color:'#facc15', icon:'🟡' },
  ] : []

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div className="page-icon">🧪</div>
        <div>
          <h1 className="page-title">Fertilizer Recommendation</h1>
          <p className="page-subtitle">Precision NPK calculator based on crop, soil & growth stage</p>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'380px 1fr',gap:'24px'}}>
        <div className="glass-card" style={{padding:'28px',height:'fit-content'}}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Crop</label>
              <select className="form-select" value={form.crop} onChange={e=>setForm({...form,crop:e.target.value})}>
                {CROPS.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Growth Stage</label>
              <select className="form-select" value={form.growth_stage} onChange={e=>setForm({...form,growth_stage:e.target.value})}>
                {STAGES.map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Soil Type</label>
              <select className="form-select" value={form.soil_type} onChange={e=>setForm({...form,soil_type:e.target.value})}>
                {SOILS.map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
              </select>
            </div>
            <div className="input-row">
              <div className="form-group">
                <label className="form-label">Rainfall (mm)</label>
                <input className="form-input" type="number" value={form.rainfall} onChange={e=>setForm({...form,rainfall:e.target.value})}/>
              </div>
              <div className="form-group">
                <label className="form-label">Field Size (ha)</label>
                <input className="form-input" type="number" step="0.1" value={form.field_size} onChange={e=>setForm({...form,field_size:e.target.value})} min="0.1"/>
              </div>
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{width:'100%',justifyContent:'center'}}>
              {loading ? '⏳ Calculating...' : '🧪 Get NPK Recommendation'}
            </button>
          </form>
        </div>

        <div className="glass-card" style={{padding:'28px'}}>
          <h3 style={{fontWeight:700,marginBottom:'20px',color:'var(--text-secondary)'}}>📋 NPK Recommendation</h3>
          {loading && <div className="loading-screen"><div className="spinner"/><p>Calculating optimal NPK...</p></div>}
          {!result && !loading && (
            <div style={{textAlign:'center',padding:'64px',color:'var(--text-muted)'}}>
              <div style={{fontSize:'4rem',marginBottom:'16px'}}>🧪</div><p>Set crop parameters to get NPK recommendation</p>
            </div>
          )}
          {result && (
            <div className="fade-in">
              <div style={{padding:'16px',background:'rgba(74,222,128,0.08)',borderRadius:'12px',marginBottom:'20px',textAlign:'center'}}>
                <p style={{color:'var(--text-muted)',fontSize:'0.8rem',marginBottom:'4px'}}>Recommendation for</p>
                <h2 style={{fontFamily:'Poppins',fontWeight:800,color:'var(--accent-green)'}}>{result.crop}</h2>
                <div style={{display:'flex',gap:'8px',justifyContent:'center',marginTop:'8px',flexWrap:'wrap'}}>
                  <span className="badge badge-info">{result.soil_type} Soil</span>
                  <span className="badge badge-warning">{result.growth_stage} Stage</span>
                  <span className="badge badge-success">{result.field_size} ha</span>
                </div>
              </div>

              {/* NPK bars */}
              {nutrients.map(n => (
                <div key={n.name} style={{marginBottom:'18px',padding:'16px',background:'rgba(0,0,0,0.2)',borderRadius:'12px',border:'1px solid var(--border)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}>
                    <span style={{fontWeight:600,color:'var(--text-secondary)'}}>{n.icon} {n.name}</span>
                    <span style={{fontFamily:'Poppins',fontWeight:800,color:n.color}}>{n.val} kg/ha</span>
                  </div>
                  <div className="progress-bar">
                    <div style={{height:'100%',borderRadius:'4px',width:`${Math.min(100,(n.val/300)*100)}%`,background:n.color,transition:'width 1s ease'}}/>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',marginTop:'6px',fontSize:'0.78rem',color:'var(--text-muted)'}}>
                    <span>Per Hectare</span>
                    <span>Total for {result.field_size}ha: <strong style={{color:n.color}}>{n.total} kg</strong></span>
                  </div>
                </div>
              ))}

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginTop:'4px'}}>
                <div style={{padding:'14px',background:'rgba(0,0,0,0.2)',borderRadius:'10px',textAlign:'center',border:'1px solid var(--border)'}}>
                  <div style={{color:'var(--text-muted)',fontSize:'0.75rem',marginBottom:'4px'}}>COST PER HECTARE</div>
                  <div style={{fontFamily:'Poppins',fontWeight:800,fontSize:'1.4rem',color:'var(--accent-yellow)'}}>₹{result.cost_estimate?.per_hectare?.toLocaleString()}</div>
                </div>
                <div style={{padding:'14px',background:'rgba(0,0,0,0.2)',borderRadius:'10px',textAlign:'center',border:'1px solid var(--border)'}}>
                  <div style={{color:'var(--text-muted)',fontSize:'0.75rem',marginBottom:'4px'}}>TOTAL COST</div>
                  <div style={{fontFamily:'Poppins',fontWeight:800,fontSize:'1.4rem',color:'var(--accent-orange)'}}>₹{result.cost_estimate?.total_field?.toLocaleString()}</div>
                </div>
              </div>

              {result.rainfall_note && (
                <div className="alert alert-info" style={{marginTop:'14px',fontSize:'0.85rem'}}>
                  💧 {result.rainfall_note}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

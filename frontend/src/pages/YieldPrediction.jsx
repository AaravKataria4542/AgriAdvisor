import { useState } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

const CROPS = ['Maize','Rice','Potatoes','Soybeans','Wheat','Sorghum','Cotton','Sugarcane','Tomatoes']

export default function YieldPrediction() {
  const [form, setForm] = useState({ rainfall:'800', pesticide:'100', temperature:'25', crop:'Maize' })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/yield/predict', { ...form, rainfall:+form.rainfall, pesticide:+form.pesticide, temperature:+form.temperature })
      if (data.success) { setResult(data.prediction); toast.success('Yield predicted!') }
      else toast.error(data.message)
    } catch { toast.error('Prediction failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div className="page-icon">📊</div>
        <div>
          <h1 className="page-title">Yield Prediction</h1>
          <p className="page-subtitle">ML model trained on global crop yield dataset</p>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'380px 1fr',gap:'24px'}}>
        <div className="glass-card" style={{padding:'28px',height:'fit-content'}}>
          <h3 style={{fontWeight:700,marginBottom:'20px',color:'var(--text-secondary)'}}>⚙️ Parameters</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Crop Type</label>
              <select className="form-select" value={form.crop} onChange={e=>setForm({...form,crop:e.target.value})}>
                {CROPS.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Annual Rainfall (mm)</label>
              <input className="form-input" type="number" value={form.rainfall} onChange={e=>setForm({...form,rainfall:e.target.value})} min="0" max="5000"/>
              <input type="range" min="0" max="5000" step="50" value={form.rainfall} onChange={e=>setForm({...form,rainfall:e.target.value})} style={{marginTop:'8px'}}/>
            </div>
            <div className="form-group">
              <label className="form-label">Avg Temperature (°C)</label>
              <input className="form-input" type="number" value={form.temperature} onChange={e=>setForm({...form,temperature:e.target.value})} min="-10" max="50"/>
              <input type="range" min="-10" max="50" step="0.5" value={form.temperature} onChange={e=>setForm({...form,temperature:e.target.value})} style={{marginTop:'8px'}}/>
            </div>
            <div className="form-group">
              <label className="form-label">Pesticide Use (tonnes)</label>
              <input className="form-input" type="number" value={form.pesticide} onChange={e=>setForm({...form,pesticide:e.target.value})} min="0"/>
              <input type="range" min="0" max="500" step="5" value={form.pesticide} onChange={e=>setForm({...form,pesticide:e.target.value})} style={{marginTop:'8px'}}/>
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{width:'100%',justifyContent:'center'}}>
              {loading ? '⏳ Predicting...' : '📊 Predict Yield'}
            </button>
          </form>
        </div>

        <div className="glass-card" style={{padding:'28px'}}>
          <h3 style={{fontWeight:700,marginBottom:'20px',color:'var(--text-secondary)'}}>📈 Prediction Result</h3>
          {loading && <div className="loading-screen"><div className="spinner"/><p>Running ML model...</p></div>}
          {!result && !loading && (
            <div style={{textAlign:'center',padding:'64px',color:'var(--text-muted)'}}>
              <div style={{fontSize:'4rem',marginBottom:'16px'}}>🌾</div><p>Set parameters and predict yield</p>
            </div>
          )}
          {result && (
            <div className="fade-in">
              <div style={{textAlign:'center',padding:'32px',background:'rgba(74,222,128,0.08)',borderRadius:'16px',marginBottom:'24px'}}>
                <div style={{fontSize:'2rem',marginBottom:'12px'}}>🌾</div>
                <div style={{fontSize:'0.85rem',color:'var(--text-muted)',marginBottom:'4px',textTransform:'uppercase',letterSpacing:'0.08em'}}>Predicted Yield for {result.crop}</div>
                <div style={{fontFamily:'Poppins',fontWeight:800,fontSize:'3.5rem',color:'var(--accent-green)',lineHeight:1}}>{result.yield_kg_ha?.toLocaleString()}</div>
                <div style={{color:'var(--text-secondary)',fontSize:'1rem',marginTop:'4px'}}>kg per hectare</div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'14px',marginBottom:'24px'}}>
                {[
                  {val:`${result.yield_hg_ha?.toLocaleString()} hg/ha`,label:'Hectogram/Ha'},
                  {val:`${result.yield_kg_ha?.toLocaleString()} kg/ha`,label:'Kilogram/Ha'},
                  {val:`${result.yield_ton_ha} t/ha`,label:'Tonnes/Ha'},
                ].map(m=>(
                  <div key={m.label} style={{padding:'16px',background:'rgba(0,0,0,0.25)',borderRadius:'10px',textAlign:'center',border:'1px solid var(--border)'}}>
                    <div style={{fontFamily:'Poppins',fontWeight:700,fontSize:'1.1rem',color:'var(--accent-green)'}}>{m.val}</div>
                    <div style={{fontSize:'0.72rem',color:'var(--text-muted)',marginTop:'4px'}}>{m.label}</div>
                  </div>
                ))}
              </div>
              <div style={{padding:'16px',background:'rgba(0,0,0,0.2)',borderRadius:'10px',border:'1px solid var(--border)'}}>
                <h4 style={{color:'var(--text-secondary)',marginBottom:'10px',fontSize:'0.85rem',fontWeight:700}}>📊 Input Summary</h4>
                <div style={{display:'flex',gap:'20px',flexWrap:'wrap',fontSize:'0.85rem'}}>
                  <span>🌧 Rainfall: <strong>{result.parameters?.rainfall}mm</strong></span>
                  <span>🌡 Temperature: <strong>{result.parameters?.temperature}°C</strong></span>
                  <span>🧴 Pesticide: <strong>{result.parameters?.pesticide}t</strong></span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

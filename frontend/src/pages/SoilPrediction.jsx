import { useState, useRef } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function SoilPrediction() {
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [numeric, setNumeric] = useState({ ph:'6.5', nitrogen:'40', phosphorus:'25', potassium:'200', moisture:'50', organic_carbon:'1.0' })
  const fileRef = useRef()

  const handlePredict = async () => {
    setLoading(true)
    try {
      const fd = new FormData()
      if (image) fd.append('image', image)
      Object.entries(numeric).forEach(([k,v]) => fd.append(k, v))
      const { data } = await api.post('/soil/predict', fd, { headers:{'Content-Type':'multipart/form-data'} })
      if (data.success) { setResult(data.prediction); toast.success('Soil analysis complete!') }
      else toast.error(data.message)
    } catch (e) { toast.error(e.response?.data?.message || 'Analysis failed') }
    finally { setLoading(false) }
  }

  const healthColor = (score) => score >= 70 ? '#4ade80' : score >= 50 ? '#facc15' : '#f87171'

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div className="page-icon">🪱</div>
        <div>
          <h1 className="page-title">Soil Analysis</h1>
          <p className="page-subtitle">EfficientNetB0 image classification + nutrient analysis</p>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'24px'}}>
        {/* Input panel */}
        <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>
          {/* Image */}
          <div className="glass-card" style={{padding:'24px'}}>
            <h3 style={{fontWeight:700,marginBottom:'16px',color:'var(--text-secondary)'}}>📷 Soil Image (Optional)</h3>
            <div className="upload-zone" style={{padding:'24px'}} onClick={() => fileRef.current.click()}>
              {preview
                ? <img src={preview} alt="soil" style={{maxHeight:150,borderRadius:10,objectFit:'cover',width:'100%'}} />
                : <><div style={{fontSize:'2.5rem'}}>🌍</div><p style={{color:'var(--text-muted)',fontSize:'0.85rem',marginTop:'8px'}}>Click to upload soil image</p></>
              }
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={e => { const f=e.target.files[0]; setImage(f); setPreview(URL.createObjectURL(f)) }} style={{display:'none'}} />
          </div>

          {/* Numeric inputs */}
          <div className="glass-card" style={{padding:'24px'}}>
            <h3 style={{fontWeight:700,marginBottom:'16px',color:'var(--text-secondary)'}}>🧪 Soil Parameters</h3>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
              {[
                ['pH Level', 'ph', '0', '14', '0.1'],
                ['Nitrogen (mg/kg)', 'nitrogen', '0', '200', '1'],
                ['Phosphorus (mg/kg)', 'phosphorus', '0', '100', '1'],
                ['Potassium (mg/kg)', 'potassium', '0', '600', '5'],
                ['Moisture (%)', 'moisture', '0', '100', '1'],
                ['Organic Carbon (%)', 'organic_carbon', '0', '5', '0.1'],
              ].map(([label, key, min, max, step]) => (
                <div key={key}>
                  <label className="form-label">{label}</label>
                  <input className="form-input" type="number" min={min} max={max} step={step}
                    value={numeric[key]} onChange={e => setNumeric({...numeric,[key]:e.target.value})} />
                </div>
              ))}
            </div>
            <button className="btn btn-primary" onClick={handlePredict} disabled={loading} style={{width:'100%',justifyContent:'center',marginTop:'20px'}}>
              {loading ? '⏳ Analyzing...' : '🔍 Analyze Soil'}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="glass-card" style={{padding:'28px'}}>
          <h3 style={{fontWeight:700,marginBottom:'20px',color:'var(--text-secondary)'}}>📋 Analysis Results</h3>
          {loading && <div className="loading-screen"><div className="spinner"/><p>Analyzing soil composition...</p></div>}
          {!result && !loading && (
            <div style={{textAlign:'center',padding:'48px',color:'var(--text-muted)'}}>
              <div style={{fontSize:'3rem',marginBottom:'16px'}}>🌱</div>
              <p>Fill in the parameters and click Analyze</p>
            </div>
          )}
          {result && (
            <div className="fade-in">
              {/* Soil type */}
              <div style={{textAlign:'center',padding:'20px',borderRadius:'12px',background:'rgba(74,222,128,0.08)',marginBottom:'20px'}}>
                <div style={{fontSize:'2.5rem'}}>🪱</div>
                <h2 style={{fontFamily:'Poppins',fontWeight:800,fontSize:'1.5rem',color:'var(--accent-green)',margin:'8px 0'}}>{result.soil_type} Soil</h2>
                <span className="badge badge-info">Confidence: {result.confidence}%</span>
              </div>

              {/* Health score */}
              <div style={{marginBottom:'20px'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}>
                  <span style={{fontWeight:600,color:'var(--text-secondary)'}}>Soil Health Score</span>
                  <span style={{fontFamily:'Poppins',fontWeight:800,fontSize:'1.3rem',color:healthColor(result.health_score)}}>{result.health_score}/100</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{width:`${result.health_score}%`,background:`linear-gradient(90deg,${healthColor(result.health_score)},${healthColor(result.health_score)}aa)`}} />
                </div>
              </div>

              {/* Alerts */}
              {result.alerts?.map((a,i) => (
                <div key={i} className={`alert alert-${a.type==='danger'?'danger':a.type==='warning'?'warning':'success'}`} style={{fontSize:'0.85rem'}}>
                  {a.message}
                </div>
              ))}

              {/* Best crops */}
              <div style={{marginBottom:'16px'}}>
                <h4 style={{color:'var(--text-secondary)',marginBottom:'10px',fontSize:'0.85rem',fontWeight:700}}>🌾 Best Crops for This Soil</h4>
                <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
                  {result.best_crops?.map(c => <span key={c} className="badge badge-success">{c}</span>)}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h4 style={{color:'var(--text-secondary)',marginBottom:'10px',fontSize:'0.85rem',fontWeight:700}}>💡 Recommendations</h4>
                {result.recommendations?.map((r,i) => (
                  <div key={i} style={{padding:'8px 12px',background:'rgba(0,0,0,0.2)',borderRadius:'8px',marginBottom:'6px',fontSize:'0.83rem',color:'var(--text-secondary)'}}>→ {r}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

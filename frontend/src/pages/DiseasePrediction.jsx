import { useState, useRef } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function DiseasePrediction() {
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [drag, setDrag] = useState(false)
  const fileRef = useRef()

  const handleFile = (file) => {
    if (!file) return
    setImage(file)
    setPreview(URL.createObjectURL(file))
    setResult(null)
  }

  const handlePredict = async () => {
    if (!image) return toast.error('Please upload an image first')
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('image', image)
      const { data } = await api.post('/disease/predict', fd, { headers:{'Content-Type':'multipart/form-data'} })
      if (data.success) { setResult(data.prediction); toast.success('Analysis complete!') }
      else toast.error(data.message)
    } catch (e) { toast.error(e.response?.data?.message || 'Prediction failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div className="page-icon">🔬</div>
        <div>
          <h1 className="page-title">Plant Disease Detection</h1>
          <p className="page-subtitle">AI-powered EfficientNetB4 model – 38 disease classes</p>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'24px'}}>
        {/* Upload */}
        <div className="glass-card" style={{padding:'28px'}}>
          <h3 style={{fontWeight:700,marginBottom:'20px',color:'var(--text-secondary)'}}>📷 Upload Leaf Image</h3>
          <div
            className={`upload-zone${drag ? ' drag-over' : ''}`}
            onClick={() => fileRef.current.click()}
            onDragOver={e => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]) }}
          >
            {preview ? (
              <img src={preview} alt="preview" style={{maxHeight:220,borderRadius:12,objectFit:'cover',width:'100%'}} />
            ) : (
              <>
                <div className="upload-icon">🍃</div>
                <p style={{fontWeight:600,color:'var(--text-secondary)'}}>Drop leaf image here</p>
                <p style={{color:'var(--text-muted)',fontSize:'0.85rem',marginTop:'6px'}}>or click to browse</p>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={e => handleFile(e.target.files[0])} style={{display:'none'}} />
          {preview && (
            <div style={{display:'flex',gap:'10px',marginTop:'16px'}}>
              <button className="btn btn-primary" onClick={handlePredict} disabled={loading} style={{flex:1,justifyContent:'center'}}>
                {loading ? '⏳ Analyzing...' : '🔬 Analyze Disease'}
              </button>
              <button className="btn btn-secondary" onClick={() => {setImage(null);setPreview(null);setResult(null)}}>✕</button>
            </div>
          )}
        </div>

        {/* Result */}
        <div className="glass-card" style={{padding:'28px'}}>
          <h3 style={{fontWeight:700,marginBottom:'20px',color:'var(--text-secondary)'}}>📋 Analysis Result</h3>
          {loading && <div className="loading-screen"><div className="spinner"/><p>Analyzing with EfficientNetB4...</p></div>}
          {!loading && !result && (
            <div style={{textAlign:'center',padding:'48px',color:'var(--text-muted)'}}>
              <div style={{fontSize:'3rem',marginBottom:'16px'}}>🌿</div>
              <p>Upload and analyze an image to see results</p>
            </div>
          )}
          {result && (
            <div className="fade-in">
              <div style={{textAlign:'center',padding:'20px',borderRadius:'12px',background:result.is_healthy?'rgba(74,222,128,0.1)':'rgba(239,68,68,0.1)',marginBottom:'20px'}}>
                <div style={{fontSize:'3rem'}}>{result.is_healthy ? '✅' : '⚠️'}</div>
                <h2 style={{fontFamily:'Poppins',fontSize:'1.3rem',fontWeight:800,margin:'10px 0',color:result.is_healthy?'var(--accent-green)':'#f87171'}}>
                  {result.disease}
                </h2>
                <div style={{display:'flex',justifyContent:'center',gap:'12px',flexWrap:'wrap'}}>
                  <span className={`badge ${result.is_healthy?'badge-success':'badge-danger'}`}>
                    {result.is_healthy ? 'Healthy' : `Severity: ${result.severity}`}
                  </span>
                  <span className="badge badge-info">Confidence: {result.confidence}%</span>
                </div>
              </div>

              <div className="confidence-bar" style={{marginBottom:'20px'}}>
                <div className="confidence-fill" style={{width:`${result.confidence}%`,background:result.is_healthy?'linear-gradient(90deg,#16a34a,#4ade80)':'linear-gradient(90deg,#dc2626,#f87171)'}} />
              </div>

              {!result.is_healthy && (
                <>
                  <div className="alert alert-warning">
                    <strong>📝 Description:</strong> {result.description}
                  </div>
                  <div className="alert alert-success">
                    <strong>💊 Treatment:</strong> {result.treatment}
                  </div>
                </>
              )}

              {result.top_predictions?.length > 0 && (
                <div>
                  <h4 style={{color:'var(--text-secondary)',marginBottom:'10px',fontSize:'0.85rem'}}>Top Predictions</h4>
                  {result.top_predictions.map((p,i) => (
                    <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--border)',fontSize:'0.83rem'}}>
                      <span style={{color:'var(--text-secondary)'}}>{p.disease}</span>
                      <span style={{color:'var(--accent-green)',fontWeight:600}}>{p.confidence}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="glass-card" style={{padding:'24px',marginTop:'24px'}}>
        <h3 style={{fontWeight:700,marginBottom:'14px',color:'var(--accent-green)'}}>ℹ️ Supported Plants & Diseases</h3>
        <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
          {['Apple Scab','Black Rot','Cedar Rust','Corn Rust','Gray Leaf Spot','Northern Blight','Grape Blight','Potato Early Blight','Potato Late Blight','Tomato Early Blight','Tomato Late Blight','Tomato Mosaic Virus','Yellow Leaf Curl'].map(d => (
            <span key={d} className="badge badge-info">{d}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

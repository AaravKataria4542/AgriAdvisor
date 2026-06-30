import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', form)
      if (data.success) {
        login(data.access_token, data.user)
        toast.success(`Welcome back, ${data.user.name}! 🌾`)
        navigate('/dashboard')
      } else {
        if (data.needs_verification) {
          toast.error('Email not verified. OTP resent.')
          navigate(`/register?email=${form.email}&step=otp`)
        } else toast.error(data.message)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-page">
      <div className="glass-card auth-card fade-in">
        <div className="auth-logo">
          <div className="logo-icon">🌾</div>
          <h1>AgriAdvisor</h1>
          <p>AI-Powered Agricultural Intelligence</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" placeholder="you@example.com"
              value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="Enter password"
              value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          </div>
          <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{width:'100%',justifyContent:'center'}}>
            {loading ? '⏳ Signing in...' : '🚀 Sign In'}
          </button>
        </form>

        <p style={{textAlign:'center',marginTop:'24px',color:'var(--text-muted)',fontSize:'0.9rem'}}>
          Don't have an account?{' '}
          <Link to="/register" style={{color:'var(--accent-green)',fontWeight:600}}>Register here</Link>
        </p>

        <div style={{marginTop:'20px',padding:'14px',background:'rgba(74,222,128,0.05)',borderRadius:'10px',border:'1px solid var(--border)'}}>
          <p style={{fontSize:'0.78rem',color:'var(--text-muted)',textAlign:'center'}}>
            🔑 Demo: <strong style={{color:'var(--text-secondary)'}}>demo@agri.com</strong> / <strong style={{color:'var(--text-secondary)'}}>Demo@12345</strong>
          </p>
        </div>
      </div>
    </div>
  )
}

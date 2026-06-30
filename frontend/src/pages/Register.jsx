import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function Register() {
  const [step, setStep] = useState('register') // register | otp
  const [form, setForm] = useState({ name:'', email:'', password:'', phone:'', location:'' })
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  useEffect(() => {
    if (params.get('step') === 'otp' && params.get('email')) {
      setForm(f => ({...f, email: params.get('email')}))
      setStep('otp')
    }
  }, [params])

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/auth/register', form)
      if (data.success) {
        toast.success('OTP sent to your email! 📧')
        setStep('otp')
      } else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || 'Registration failed') }
    finally { setLoading(false) }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/auth/verify-otp', { email: form.email, otp })
      if (data.success) {
        login(data.access_token, data.user)
        toast.success('Email verified! Welcome to AgriAdvisor 🌾')
        navigate('/dashboard')
      } else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || 'OTP verification failed') }
    finally { setLoading(false) }
  }

  const resendOtp = async () => {
    try {
      await api.post('/auth/resend-otp', { email: form.email })
      toast.success('OTP resent!')
    } catch { toast.error('Failed to resend OTP') }
  }

  if (step === 'otp') return (
    <div className="auth-page">
      <div className="glass-card auth-card fade-in">
        <div className="auth-logo">
          <div className="logo-icon">📧</div>
          <h1>Verify Email</h1>
          <p>OTP sent to <strong style={{color:'var(--accent-green)'}}>{form.email}</strong></p>
        </div>
        <form onSubmit={handleVerifyOtp}>
          <div className="form-group">
            <label className="form-label">Enter 6-Digit OTP</label>
            <input className="form-input" type="text" placeholder="000000" maxLength={6}
              value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,''))} required
              style={{textAlign:'center',fontSize:'1.8rem',letterSpacing:'12px',fontWeight:800}} />
          </div>
          <button className="btn btn-primary btn-lg" type="submit" disabled={loading || otp.length!==6} style={{width:'100%',justifyContent:'center'}}>
            {loading ? '⏳ Verifying...' : '✅ Verify & Continue'}
          </button>
        </form>
        <p style={{textAlign:'center',marginTop:'20px',color:'var(--text-muted)',fontSize:'0.9rem'}}>
          Didn't get it?{' '}
          <button onClick={resendOtp} style={{background:'none',border:'none',color:'var(--accent-green)',cursor:'pointer',fontWeight:600}}>Resend OTP</button>
        </p>
      </div>
    </div>
  )

  return (
    <div className="auth-page">
      <div className="glass-card auth-card fade-in">
        <div className="auth-logo">
          <div className="logo-icon">🌾</div>
          <h1>Join AgriAdvisor</h1>
          <p>Create your farmer account</p>
        </div>
        <form onSubmit={handleRegister}>
          <div className="input-row">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" type="text" placeholder="Rajesh Kumar"
                value={form.name} onChange={e => setForm({...form,name:e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" type="tel" placeholder="+91 9876543210"
                value={form.phone} onChange={e => setForm({...form,phone:e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" placeholder="you@example.com"
              value={form.email} onChange={e => setForm({...form,email:e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password (min 6 chars)</label>
            <input className="form-input" type="password" placeholder="Strong password"
              value={form.password} onChange={e => setForm({...form,password:e.target.value})} required minLength={6} />
          </div>
          <div className="form-group">
            <label className="form-label">Location / Village</label>
            <input className="form-input" type="text" placeholder="e.g. Ludhiana, Punjab"
              value={form.location} onChange={e => setForm({...form,location:e.target.value})} />
          </div>
          <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{width:'100%',justifyContent:'center'}}>
            {loading ? '⏳ Sending OTP...' : '📧 Register & Get OTP'}
          </button>
        </form>
        <p style={{textAlign:'center',marginTop:'20px',color:'var(--text-muted)',fontSize:'0.9rem'}}>
          Already have an account?{' '}
          <Link to="/login" style={{color:'var(--accent-green)',fontWeight:600}}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}

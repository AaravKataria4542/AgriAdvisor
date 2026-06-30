import { useState } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function WeatherForecast() {
  const [city, setCity] = useState('')
  const [weather, setWeather] = useState(null)
  const [forecast, setForecast] = useState([])
  const [calendar, setCalendar] = useState([])
  const [soilType, setSoilType] = useState('loamy')
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('current')

  const fetchWeather = async () => {
    if (!city.trim()) return toast.error('Enter a city name')
    setLoading(true)
    try {
      const [curr, fore, cal] = await Promise.all([
        api.get(`/weather/current?city=${encodeURIComponent(city)}`),
        api.get(`/weather/forecast?city=${encodeURIComponent(city)}`),
        api.post('/weather/crop-calendar', { city, soil_type: soilType }),
      ])
      if (curr.data.success) setWeather(curr.data.weather)
      else toast.error(curr.data.message)
      if (fore.data.success) setForecast(fore.data.forecast.slice(0, 8))
      if (cal.data.success) setCalendar(cal.data.calendar)
      if (curr.data.success) toast.success('Live weather loaded! 🌤')
    } catch (e) { toast.error(e.response?.data?.message || 'Weather fetch failed') }
    finally { setLoading(false) }
  }

  const tabStyle = (t) => ({
    padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
    background: tab === t ? 'linear-gradient(135deg,#16a34a,#15803d)' : 'transparent',
    color: tab === t ? '#fff' : 'var(--text-muted)', transition: 'all 0.2s'
  })

  const sunTime = (ts) => new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div className="page-icon">🌤</div>
        <div>
          <h1 className="page-title">Weather Forecast</h1>
          <p className="page-subtitle">Live weather + 6-month crop calendar via OpenWeatherMap</p>
        </div>
      </div>

      {/* Search */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input className="form-input" style={{ flex: 2, minWidth: '200px' }} placeholder="Enter city name (e.g. Mumbai, Delhi, Pune)"
            value={city} onChange={e => setCity(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchWeather()} />
          <select className="form-select" style={{ flex: 1, minWidth: '140px' }} value={soilType} onChange={e => setSoilType(e.target.value)}>
            {['loamy','clay','sandy','black','red','alluvial','silt'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </select>
          <button className="btn btn-primary" onClick={fetchWeather} disabled={loading}>
            {loading ? '⏳ Loading...' : '🔍 Get Weather'}
          </button>
        </div>
      </div>

      {weather && (
        <>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'var(--bg-secondary)', padding: '6px', borderRadius: '12px', width: 'fit-content' }}>
            {['current','forecast','calendar'].map(t => (
              <button key={t} style={tabStyle(t)} onClick={() => setTab(t)}>
                {t === 'current' ? '🌡 Current' : t === 'forecast' ? '📅 5-Day' : '🌾 6-Month Calendar'}
              </button>
            ))}
          </div>

          {/* Current weather */}
          {tab === 'current' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }} className="fade-in">
              <div className="glass-card weather-main">
                <div style={{ fontSize: '4rem' }}>
                  {weather.description.toLowerCase().includes('rain') ? '🌧' : weather.description.toLowerCase().includes('cloud') ? '☁️' : weather.description.toLowerCase().includes('thunder') ? '⛈' : '☀️'}
                </div>
                <div className="weather-temp">{weather.temperature}°C</div>
                <div className="weather-desc">{weather.description}</div>
                <div style={{ marginTop: '12px' }}>
                  <span className="badge badge-info" style={{ marginRight: '8px' }}>{weather.city}, {weather.country}</span>
                  <span className="badge badge-warning">Feels like {weather.feels_like}°C</span>
                </div>
              </div>
              <div className="glass-card" style={{ padding: '24px' }}>
                <h3 style={{ fontWeight: 700, marginBottom: '16px', color: 'var(--text-secondary)' }}>📊 Details</h3>
                <div className="weather-grid">
                  {[
                    { label: 'Humidity', value: `${weather.humidity}%`, icon: '💧' },
                    { label: 'Wind', value: `${weather.wind_speed} km/h`, icon: '💨' },
                    { label: 'Pressure', value: `${weather.pressure} hPa`, icon: '🌡' },
                    { label: 'Clouds', value: `${weather.clouds}%`, icon: '☁️' },
                    { label: 'Rainfall', value: `${weather.rainfall_1h} mm`, icon: '🌧' },
                    { label: 'Visibility', value: `${weather.visibility} km`, icon: '👁' },
                    { label: 'Sunrise', value: sunTime(weather.sunrise), icon: '🌅' },
                    { label: 'Sunset', value: sunTime(weather.sunset), icon: '🌇' },
                  ].map(m => (
                    <div key={m.label} className="weather-metric">
                      <div style={{ fontSize: '1.4rem' }}>{m.icon}</div>
                      <div className="value">{m.value}</div>
                      <div className="label">{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 5-day forecast */}
          {tab === 'forecast' && (
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '20px', color: 'var(--text-secondary)' }}>📅 5-Day Forecast</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: '12px' }}>
                {forecast.map((f, i) => (
                  <div key={i} style={{ padding: '16px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', textAlign: 'center', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>{f.datetime.split(' ')[0]} {f.datetime.split(' ')[1]?.slice(0,5)}</div>
                    <div style={{ fontSize: '1.8rem' }}>{f.rain > 0 ? '🌧' : f.description.toLowerCase().includes('cloud') ? '☁️' : '☀️'}</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-green)', margin: '6px 0' }}>{f.temp}°C</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{f.description}</div>
                    <div style={{ fontSize: '0.72rem', color: '#93c5fd', marginTop: '4px' }}>💧 {f.humidity}% | 💨 {f.wind_speed}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6-month crop calendar */}
          {tab === 'calendar' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '16px' }} className="fade-in">
              {calendar.map((m, i) => (
                <div key={i} className="glass-card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h3 style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '1rem' }}>{m.month}</h3>
                    <span className={`badge ${m.season === 'Kharif' ? 'badge-success' : m.season === 'Rabi' ? 'badge-info' : 'badge-warning'}`}>{m.season}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', fontSize: '0.83rem', color: 'var(--text-muted)' }}>
                    <span>🌡 {m.temperature}°C</span>
                    <span>🌧 {m.expected_rainfall}mm</span>
                    <span>💧 {m.humidity}%</span>
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>RECOMMENDED CROPS</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {m.recommended_crops.map(c => <span key={c} className="badge badge-success">{c}</span>)}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                    💡 {m.soil_note}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!weather && !loading && (
        <div className="glass-card" style={{ padding: '64px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🌏</div>
          <h3 style={{ fontFamily: 'Poppins', fontWeight: 700, marginBottom: '8px' }}>Enter a city to get started</h3>
          <p style={{ fontSize: '0.9rem' }}>Get live weather conditions + a 6-month crop planting calendar</p>
        </div>
      )}
    </div>
  )
}

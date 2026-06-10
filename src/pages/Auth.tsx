import { useState } from 'react'
import { supabase } from '../supabase'
import { useLang } from '../LanguageContext'

export default function Auth() {
  const { t, lang, setLang } = useLang()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAuth = async () => {
    setLoading(true)
    setError('')
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      if (!name.trim()) { setError(lang === 'ko' ? '이름을 입력해주세요!' : 'Please enter your name!'); setLoading(false); return }
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      if (data.user) {
        await supabase.from('profiles').upsert({ id: data.user.id, email, name })
      }
    }
    setLoading(false)
  }

  return (
    <div style={styles.container}>
      {/* 언어 선택 */}
      <div style={styles.langSwitch}>
        <button style={{...styles.langBtn, ...(lang === 'ko' ? styles.langBtnActive : {})}} onClick={() => setLang('ko')}>한국어</button>
        <button style={{...styles.langBtn, ...(lang === 'en' ? styles.langBtnActive : {})}} onClick={() => setLang('en')}>English</button>
      </div>

      <div style={styles.hero}>
        <div style={styles.logoWrap}>
          <div style={styles.logo}>🎁</div>
        </div>
        <div style={styles.appName}>{t.app_name}</div>
        <div style={styles.tagline}>{t.app_tagline}</div>
      </div>

      <div style={styles.card}>
        <div style={styles.tabs}>
          <button style={{...styles.tabBtn, ...(isLogin ? styles.tabBtnActive : {})}} onClick={() => { setIsLogin(true); setError('') }}>
            {lang === 'ko' ? '로그인' : 'Sign In'}
          </button>
          <button style={{...styles.tabBtn, ...(!isLogin ? styles.tabBtnActive : {})}} onClick={() => { setIsLogin(false); setError('') }}>
            {lang === 'ko' ? '회원가입' : 'Sign Up'}
          </button>
        </div>

        {!isLogin && (
          <div style={styles.inputWrap}>
            <label style={styles.label}>{t.name}</label>
            <input style={styles.input} placeholder={lang === 'ko' ? '이름을 입력해주세요' : 'Enter your name'} value={name} onChange={e => setName(e.target.value)} />
          </div>
        )}

        <div style={styles.inputWrap}>
          <label style={styles.label}>{t.email}</label>
          <input style={styles.input} placeholder="hello@email.com" value={email} onChange={e => setEmail(e.target.value)} type="email" />
        </div>

        <div style={styles.inputWrap}>
          <label style={styles.label}>{t.password}</label>
          <input style={styles.input} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} type="password" />
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <button style={{...styles.btn, opacity: loading ? 0.7 : 1}} onClick={handleAuth} disabled={loading}>
          {loading ? t.loading : (isLogin ? t.login : t.signup)}
        </button>

        <button style={styles.switchBtn} onClick={() => { setIsLogin(!isLogin); setError('') }}>
          {isLogin ? t.no_account : t.have_account}
        </button>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#FAFAF9',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '24px'
  },
  langSwitch: {
    position: 'fixed', top: '20px', right: '20px',
    display: 'flex', gap: '4px', background: '#F3F3F2', borderRadius: '20px', padding: '3px'
  },
  langBtn: {
    padding: '5px 12px', borderRadius: '16px', border: 'none', cursor: 'pointer',
    fontSize: '12px', fontWeight: 500, color: '#6B7280', background: 'transparent',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
  },
  langBtnActive: { background: 'white', color: '#111827', fontWeight: 600, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  hero: { textAlign: 'center', marginBottom: '32px' },
  logoWrap: {
    width: '72px', height: '72px', background: 'white', borderRadius: '20px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
  },
  logo: { fontSize: '36px' },
  appName: { fontSize: '28px', fontWeight: 700, color: '#111827', letterSpacing: '-0.5px', marginBottom: '6px' },
  tagline: { fontSize: '15px', color: '#6B7280', fontWeight: 400 },
  card: {
    background: 'white', borderRadius: '24px', padding: '28px 24px',
    width: '100%', maxWidth: '400px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.06)'
  },
  tabs: { display: 'flex', background: '#F3F3F2', borderRadius: '12px', padding: '3px', marginBottom: '24px' },
  tabBtn: {
    flex: 1, padding: '9px', borderRadius: '9px', border: 'none', cursor: 'pointer',
    fontSize: '14px', fontWeight: 500, color: '#6B7280', background: 'transparent',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
  },
  tabBtnActive: { background: 'white', color: '#111827', fontWeight: 600, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' },
  inputWrap: { marginBottom: '16px' },
  label: { fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px', display: 'block' },
  input: {
    width: '100%', padding: '12px 14px', border: '1.5px solid #E5E7EB', borderRadius: '12px',
    fontSize: '15px', outline: 'none', boxSizing: 'border-box', color: '#111827',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
    background: '#FAFAF9'
  },
  error: { background: '#FEF2F2', color: '#EF4444', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px' },
  btn: {
    width: '100%', padding: '14px', background: '#111827', color: 'white',
    border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: 600, cursor: 'pointer',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
    letterSpacing: '-0.2px', marginTop: '8px'
  },
  switchBtn: {
    width: '100%', padding: '12px', background: 'none', border: 'none',
    color: '#6B7280', fontSize: '13px', cursor: 'pointer', marginTop: '8px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
  }
}
import { supabase } from '../supabase'
import { useLang } from '../LanguageContext'

export default function Settings({ session, onBack, onGoProfile, onGoNotifications }: {
  session: any
  onBack: () => void
  onGoProfile: () => void
  onGoNotifications: () => void
}) {
  const { t, lang, setLang } = useLang()

  return (
    <div style={styles.container}>
      <div style={styles.topbar}>
        <button style={styles.backBtn} onClick={onBack}>←</button>
        <div style={{fontWeight:700, fontSize:'17px'}}>{lang === 'ko' ? '설정' : 'Settings'}</div>
        <div style={{width:'32px'}} />
      </div>

      <div style={styles.content}>
        {/* 언어 설정 */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>🌐 {lang === 'ko' ? '언어 설정' : 'Language'}</div>
          <div style={{display:'flex', gap:'8px'}}>
            {[
              { value: 'ko', label: '한국어' },
              { value: 'en', label: 'English' }
            ].map(opt => (
              <div key={opt.value} onClick={() => setLang(opt.value as 'ko' | 'en')} style={{
                flex:1, padding:'12px', borderRadius:'12px', cursor:'pointer', textAlign:'center',
                border:`1.5px solid ${lang === opt.value ? '#111827' : '#E5E7EB'}`,
                background: lang === opt.value ? '#111827' : 'white'
              }}>
                <div style={{fontSize:'14px', fontWeight:600, color: lang === opt.value ? 'white' : '#374151'}}>{opt.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 메뉴 */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>👤 {lang === 'ko' ? '계정' : 'Account'}</div>
          <div style={styles.menuItem} onClick={onGoProfile}>
            <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
              <span style={styles.menuIcon}>👤</span>
              <span style={styles.menuLabel}>{lang === 'ko' ? '프로필 설정' : 'Profile Settings'}</span>
            </div>
            <span style={styles.menuArrow}>›</span>
          </div>
          <div style={styles.menuItem} onClick={onGoNotifications}>
            <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
              <span style={styles.menuIcon}>🔔</span>
              <span style={styles.menuLabel}>{lang === 'ko' ? '알림 설정' : 'Notification Settings'}</span>
            </div>
            <span style={styles.menuArrow}>›</span>
          </div>
        </div>

        {/* 앱 정보 */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>📱 {lang === 'ko' ? '앱 정보' : 'App Info'}</div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>{lang === 'ko' ? '버전' : 'Version'}</span>
            <span style={styles.infoValue}>1.0.0</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>{lang === 'ko' ? '만든 곳' : 'Made by'}</span>
            <span style={styles.infoValue}>WishPick Team</span>
          </div>
        </div>

        {/* 로그아웃 */}
        <button style={styles.logoutBtn} onClick={() => supabase.auth.signOut()}>
          🚪 {lang === 'ko' ? '로그아웃' : 'Sign Out'}
        </button>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh', background: '#FAFAF9',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
  },
  topbar: {
    background: 'white', padding: '14px 20px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    borderBottom: '1px solid #F3F4F6', position: 'sticky', top: 0, zIndex: 50
  },
  backBtn: { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6B7280', padding: '4px' },
  content: { padding: '16px 16px 100px' },
  section: {
    background: 'white', borderRadius: '16px', padding: '16px',
    marginBottom: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
  },
  sectionTitle: { fontSize: '13px', fontWeight: 700, color: '#6B7280', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  menuItem: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 0', cursor: 'pointer', borderBottom: '1px solid #F9FAFB'
  },
  menuIcon: { fontSize: '18px', width: '28px', textAlign: 'center' },
  menuLabel: { fontSize: '15px', color: '#111827', fontWeight: 500 },
  menuArrow: { fontSize: '18px', color: '#D1D5DB' },
  infoRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 0', borderBottom: '1px solid #F9FAFB'
  },
  infoLabel: { fontSize: '14px', color: '#6B7280' },
  infoValue: { fontSize: '14px', color: '#111827', fontWeight: 500 },
  logoutBtn: {
    width: '100%', padding: '14px', background: 'white',
    border: '1.5px solid #FEE2E2', borderRadius: '14px',
    fontSize: '15px', fontWeight: 600, cursor: 'pointer',
    color: '#EF4444', marginTop: '8px'
  }
}
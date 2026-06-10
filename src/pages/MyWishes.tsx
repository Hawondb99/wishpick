import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useLang } from '../LanguageContext'

export default function MyWishes({ session, onBack }: { session: any, onBack: () => void }) {
  const { lang } = useLang()
  const [wishes, setWishes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'bought' | 'received'>('all')

  useEffect(() => { fetchMyWishes() }, [])

  const fetchMyWishes = async () => {
    const { data } = await supabase
      .from('wishes')
      .select('*, groups(name)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
    if (data) setWishes(data)
    setLoading(false)
  }

  const filtered = wishes.filter(w => {
    if (filterStatus === 'all') return true
    return w.status === filterStatus
  })

  const statusConfig = {
    available: { label: lang === 'ko' ? '구매 가능' : 'Available', bg: '#F0FDF4', color: '#15803D' },
    bought:    { label: lang === 'ko' ? '예약 중' : 'Reserved',  bg: '#FEF9C3', color: '#A16207' },
    received:  { label: lang === 'ko' ? '받은 것' : 'Received',  bg: '#EFF6FF', color: '#1D4ED8' },
  }

  const filters = [
    { value: 'all',       label: lang === 'ko' ? '전체' : 'All' },
    { value: 'available', label: lang === 'ko' ? '🛒 구매 가능' : '🛒 Available' },
    { value: 'bought',    label: lang === 'ko' ? '🛍️ 예약 중' : '🛍️ Reserved' },
    { value: 'received',  label: lang === 'ko' ? '✅ 받은 것' : '✅ Received' },
  ]

  const counts = {
    all: wishes.length,
    available: wishes.filter(w => w.status === 'available').length,
    bought: wishes.filter(w => w.status === 'bought').length,
    received: wishes.filter(w => w.status === 'received').length,
  }

  return (
    <div style={s.container}>

      {/* 헤더 */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={onBack}>←</button>
        <p style={s.headerTitle}>{lang === 'ko' ? '내 위시리스트' : 'My Wishlist'}</p>
        <div style={{width:'32px'}} />
      </div>

      {/* 통계 */}
      <div style={s.statsRow}>
        <div style={s.statBox}>
          <p style={s.statNum}>{counts.all}</p>
          <p style={s.statLabel}>{lang === 'ko' ? '전체' : 'Total'}</p>
        </div>
        <div style={s.statDivider} />
        <div style={s.statBox}>
          <p style={s.statNum}>{counts.available}</p>
          <p style={s.statLabel}>{lang === 'ko' ? '구매 가능' : 'Available'}</p>
        </div>
        <div style={s.statDivider} />
        <div style={s.statBox}>
          <p style={s.statNum}>{counts.bought}</p>
          <p style={s.statLabel}>{lang === 'ko' ? '예약 중' : 'Reserved'}</p>
        </div>
        <div style={s.statDivider} />
        <div style={s.statBox}>
          <p style={s.statNum}>{counts.received}</p>
          <p style={s.statLabel}>{lang === 'ko' ? '받은 것' : 'Received'}</p>
        </div>
      </div>

      {/* 필터 */}
      <div style={s.filterRow}>
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilterStatus(f.value as any)}
            style={{
              ...s.filterBtn,
              background: filterStatus === f.value ? '#111827' : 'white',
              color: filterStatus === f.value ? 'white' : '#6B7280',
              border: `1.5px solid ${filterStatus === f.value ? '#111827' : '#F0F0F0'}`,
              fontWeight: filterStatus === f.value ? 700 : 400,
            }}
          >{f.label}</button>
        ))}
      </div>

      {/* 위시 목록 */}
      <div style={s.list}>
        {loading ? (
          <div style={{textAlign:'center', padding:'60px', fontSize:'28px'}}>🎁</div>
        ) : filtered.length === 0 ? (
          <div style={s.empty}>
            <p style={{fontSize:'44px', margin:'0 0 14px'}}>🎁</p>
            <p style={{fontSize:'16px', fontWeight:700, color:'#111827', margin:'0 0 6px'}}>
              {lang === 'ko' ? '위시가 없어요' : 'No wishes yet'}
            </p>
            <p style={{fontSize:'13px', color:'#9CA3AF', margin:0}}>
              {lang === 'ko' ? '그룹에서 위시를 추가해보세요!' : 'Add wishes in your groups!'}
            </p>
          </div>
        ) : filtered.map((w, i) => {
          const cfg = statusConfig[w.status as keyof typeof statusConfig]
          return (
            <div key={w.id} style={{
              ...s.item,
              borderBottom: i < filtered.length - 1 ? '1px solid #F5F5F5' : 'none'
            }}>
              {/* 썸네일 */}
              <div style={s.thumb}>
                {w.image_url
                  ? <img src={w.image_url} style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:'12px'}} onError={e => { e.currentTarget.style.display = 'none' }} />
                  : <span style={{fontSize:'24px'}}>🎁</span>
                }
              </div>
              {/* 정보 */}
              <div style={{flex:1, minWidth:0}}>
                <div style={{display:'flex', alignItems:'center', gap:'6px', marginBottom:'3px'}}>
                  {cfg && (
                    <span style={{
                      fontSize:'10px', fontWeight:600, padding:'2px 7px',
                      borderRadius:'50px', background: cfg.bg, color: cfg.color
                    }}>{cfg.label}</span>
                  )}
                </div>
                <p style={s.wishName}>{w.name}</p>
                <p style={s.wishPrice}>
                  {w.price ? `₩${w.price.toLocaleString()}` : (lang === 'ko' ? '가격 미정' : 'No price')}
                </p>
                <p style={s.wishGroup}>{w.groups?.name || ''}</p>
                {w.status === 'received' && w.thanks_message && (
                  <div style={{
                    marginTop:'6px', background:'#F9FAFB', borderRadius:'8px',
                    padding:'6px 10px', display:'flex', gap:'6px', alignItems:'flex-start'
                  }}>
                    <span style={{fontSize:'14px'}}>{w.thanks_emoji || '💝'}</span>
                    <p style={{fontSize:'12px', color:'#6B7280', margin:0, lineHeight:1.4}}>{w.thanks_message}</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  container: { minHeight:'100vh', background:'#fff', fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif' },
  header: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'54px 20px 14px', background:'#fff', borderBottom:'1px solid #F3F4F6', position:'sticky', top:0, zIndex:50 },
  backBtn: { background:'none', border:'none', fontSize:'22px', cursor:'pointer', color:'#111827', padding:'4px', lineHeight:1 },
  headerTitle: { fontSize:'20px', fontWeight:800, color:'#111827', margin:0, letterSpacing:'-0.5px' },
  statsRow: { display:'flex', padding:'20px', borderBottom:'1px solid #F5F5F5' },
  statBox: { flex:1, textAlign:'center' },
  statNum: { fontSize:'22px', fontWeight:800, color:'#111827', margin:'0 0 4px', letterSpacing:'-0.5px' },
  statLabel: { fontSize:'11px', color:'#9CA3AF', margin:0, fontWeight:500 },
  statDivider: { width:'1px', background:'#F0F0F0', margin:'0 4px' },
  filterRow: { display:'flex', gap:'8px', padding:'14px 20px', overflowX:'auto', borderBottom:'1px solid #F5F5F5' },
  filterBtn: { padding:'7px 14px', borderRadius:'50px', fontSize:'12px', cursor:'pointer', whiteSpace:'nowrap', flexShrink:0, fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif' },
  list: { paddingBottom:'40px' },
  item: { display:'flex', gap:'14px', padding:'16px 20px', alignItems:'flex-start' },
  thumb: { width:'70px', height:'70px', background:'#F5F5F5', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, overflow:'hidden' },
  wishName: { fontSize:'14px', fontWeight:600, color:'#111827', margin:'0 0 3px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  wishPrice: { fontSize:'14px', fontWeight:700, color:'#111827', margin:'0 0 2px' },
  wishGroup: { fontSize:'12px', color:'#9CA3AF', margin:0 },
  empty: { textAlign:'center', padding:'80px 24px' },
}
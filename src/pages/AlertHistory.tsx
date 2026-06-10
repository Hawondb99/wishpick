import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useLang } from '../LanguageContext'

const typeConfig: Record<string, { emoji: string, color: string }> = {
  wish_added:     { emoji: '🎁', color: '#F0FDF4' },
  will_buy:       { emoji: '🛍️', color: '#FEF9C3' },
  received:       { emoji: '✅', color: '#F0FDF4' },
  thanks:         { emoji: '💝', color: '#FFF1F2' },
  secret_comment: { emoji: '🤫', color: '#F5F3FF' },
  dday:           { emoji: '🎂', color: '#FFF7ED' },
}

export default function AlertHistory({ session, onBack, onGoGroup }: {
  session: any
  onBack: () => void
  onGoGroup: (groupId: string) => void
}) {
  const { lang } = useLang()
  const [tab, setTab] = useState<'all' | 'activity' | 'event'>('all')
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchNotifications() }, [])

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*, actor:actor_id(name), groups(name)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) setNotifications(data)
    setLoading(false)
  }

  const markAllRead = async () => {
    await supabase.from('notifications')
      .update({ is_read: true })
      .eq('user_id', session.user.id)
      .eq('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const activityTypes = ['wish_added', 'will_buy', 'received', 'thanks', 'secret_comment']
  const eventTypes = ['dday']

  const filtered = notifications.filter(n => {
    if (tab === 'activity') return activityTypes.includes(n.type)
    if (tab === 'event') return eventTypes.includes(n.type)
    return true
  })

  const unreadCount = notifications.filter(n => !n.is_read).length

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (lang === 'ko') {
      if (mins < 1) return '방금 전'
      if (mins < 60) return `${mins}분 전`
      if (hours < 24) return `${hours}시간 전`
      return `${days}일 전`
    } else {
      if (mins < 1) return 'just now'
      if (mins < 60) return `${mins}m ago`
      if (hours < 24) return `${hours}h ago`
      return `${days}d ago`
    }
  }

  const tabs = [
    { key: 'all', label: lang === 'ko' ? '전체' : 'All' },
    { key: 'activity', label: lang === 'ko' ? '활동' : 'Activity' },
    { key: 'event', label: lang === 'ko' ? '이벤트' : 'Events' },
  ]

  return (
    <div style={s.container}>

      {/* 헤더 */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={onBack}>←</button>
        <div style={{flex:1}}>
          <p style={s.headerTitle}>{lang === 'ko' ? '알림' : 'Notifications'}</p>
        </div>
        {unreadCount > 0 && (
          <button style={s.readAllBtn} onClick={markAllRead}>
            {lang === 'ko' ? '모두 읽음' : 'Mark all read'}
          </button>
        )}
      </div>

      {/* 탭 */}
      <div style={s.tabRow}>
        {tabs.map(tb => (
          <button
            key={tb.key}
            style={{
              ...s.tabBtn,
              borderBottom: tab === tb.key ? '2px solid #111827' : '2px solid transparent',
              color: tab === tb.key ? '#111827' : '#9CA3AF',
              fontWeight: tab === tb.key ? 700 : 400,
            }}
            onClick={() => setTab(tb.key as any)}
          >
            {tb.label}
            {tb.key === 'all' && unreadCount > 0 && (
              <span style={s.tabBadge}>{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* 알림 목록 */}
      <div style={s.list}>
        {loading ? (
          <div style={{textAlign:'center', padding:'60px', fontSize:'28px'}}>🔔</div>
        ) : filtered.length === 0 ? (
          <div style={s.empty}>
            <p style={{fontSize:'44px', margin:'0 0 14px'}}>🔔</p>
            <p style={{fontSize:'16px', fontWeight:700, color:'#111827', margin:'0 0 6px'}}>
              {lang === 'ko' ? '알림이 없어요' : 'No notifications'}
            </p>
            <p style={{fontSize:'13px', color:'#9CA3AF', margin:0}}>
              {lang === 'ko' ? '새로운 소식이 생기면 알려드릴게요!' : "We'll let you know when something happens!"}
            </p>
          </div>
        ) : filtered.map((n, i) => {
          const cfg = typeConfig[n.type] || { emoji: '📢', color: '#F5F5F5' }
          return (
            <div
              key={n.id}
              style={{
                ...s.item,
                background: n.is_read ? 'white' : '#FAFAFA',
                borderBottom: i < filtered.length - 1 ? '1px solid #F5F5F5' : 'none',
              }}
              onClick={() => {
                markRead(n.id)
                if (n.group_id) onGoGroup(n.group_id)
              }}
            >
              {/* 이모지 아이콘 */}
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%',
                background: cfg.color, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '20px', flexShrink: 0,
              }}>
                {cfg.emoji}
              </div>

              {/* 텍스트 */}
              <div style={{flex:1, minWidth:0}}>
                <p style={{
                  fontSize: '14px', fontWeight: n.is_read ? 500 : 700,
                  color: '#111827', margin: '0 0 3px', lineHeight: 1.4,
                }}>
                  {n.title}
                </p>
                {n.body && (
                  <p style={{fontSize:'13px', color:'#6B7280', margin:'0 0 4px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                    {n.body}
                  </p>
                )}
                <p style={{fontSize:'11px', color:'#9CA3AF', margin:0}}>
                  {n.groups?.name && <span>{n.groups.name} · </span>}
                  {timeAgo(n.created_at)}
                </p>
              </div>

              {/* 읽지 않음 점 */}
              {!n.is_read && (
                <div style={{width:'8px', height:'8px', borderRadius:'50%', background:'#111827', flexShrink:0}} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  container: { minHeight:'100vh', background:'#fff', fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif' },
  header: { display:'flex', alignItems:'center', gap:'12px', padding:'54px 20px 14px', background:'#fff', borderBottom:'1px solid #F3F4F6', position:'sticky', top:0, zIndex:50 },
  backBtn: { background:'none', border:'none', fontSize:'22px', cursor:'pointer', color:'#111827', padding:'4px', lineHeight:1 },
  headerTitle: { fontSize:'20px', fontWeight:800, color:'#111827', margin:0, letterSpacing:'-0.5px' },
  readAllBtn: { background:'none', border:'none', fontSize:'13px', color:'#9CA3AF', cursor:'pointer', whiteSpace:'nowrap' },
  tabRow: { display:'flex', borderBottom:'1px solid #F3F4F6', padding:'0 20px' },
  tabBtn: { flex:1, padding:'14px 0', background:'none', border:'none', borderRadius:0, cursor:'pointer', fontSize:'14px', fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' },
  tabBadge: { background:'#111827', color:'white', fontSize:'10px', fontWeight:700, padding:'1px 6px', borderRadius:'50px' },
  list: { paddingBottom:'40px' },
  item: { display:'flex', alignItems:'center', gap:'14px', padding:'16px 20px', cursor:'pointer' },
  empty: { textAlign:'center', padding:'80px 24px' },
}
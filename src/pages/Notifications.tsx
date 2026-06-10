import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useLang } from '../LanguageContext'

const EVENT_TYPES_KO = ['생일', '결혼기념일', '연애기념일', '졸업', '입사/승진', '결혼', '베이비샤워', '돌잔치', '집들이', '크리스마스', '발렌타인데이', '화이트데이', '명절', '기타']
const EVENT_TYPES_EN = ['Birthday', 'Anniversary', 'Dating Anniversary', 'Graduation', 'Promotion', 'Wedding', 'Baby Shower', 'Housewarming', 'Christmas', "Valentine's Day", 'White Day', 'Holiday', 'Other']

const eventEmoji: Record<string, string> = {
  '생일': '🎂', 'Birthday': '🎂', '결혼기념일': '💑', 'Anniversary': '💑',
  '연애기념일': '💕', 'Dating Anniversary': '💕', '졸업': '🎓', 'Graduation': '🎓',
  '입사/승진': '💼', 'Promotion': '💼', '결혼': '💍', 'Wedding': '💍',
  '베이비샤워': '👶', 'Baby Shower': '👶', '돌잔치': '🎈', '집들이': '🏠',
  'Housewarming': '🏠', '크리스마스': '🎄', 'Christmas': '🎄',
  '발렌타인데이': '💝', "Valentine's Day": '💝', '화이트데이': '🤍',
  '명절': '🎆', 'Holiday': '🎆', '기타': '📅', 'Other': '📅'
}

const NOTIFY_DAY_OPTIONS_KO = [
  { value: 30, label: 'D-30', desc: '한달 전' },
  { value: 14, label: 'D-14', desc: '2주 전' },
  { value: 7,  label: 'D-7',  desc: '1주 전' },
  { value: 3,  label: 'D-3',  desc: '3일 전' },
  { value: 1,  label: 'D-1',  desc: '하루 전' },
  { value: 0,  label: 'D-DAY', desc: '당일' },
]
const NOTIFY_DAY_OPTIONS_EN = [
  { value: 30, label: 'D-30', desc: '1 month before' },
  { value: 14, label: 'D-14', desc: '2 weeks before' },
  { value: 7,  label: 'D-7',  desc: '1 week before' },
  { value: 3,  label: 'D-3',  desc: '3 days before' },
  { value: 1,  label: 'D-1',  desc: '1 day before' },
  { value: 0,  label: 'D-DAY', desc: 'On the day' },
]

// 활동 알림 타입 정의
const ACTIVITY_TYPES_KO = [
  { key: 'wish_added',     emoji: '🎁', label: '물품 추가',    desc: '그룹원이 위시를 추가했을 때' },
  { key: 'will_buy',       emoji: '🛍️', label: '살게요 체크',  desc: '누군가 구매 예정으로 표시했을 때' },
  { key: 'received',       emoji: '✅', label: '받았어요',     desc: '위시를 받았다고 표시했을 때' },
  { key: 'thanks',         emoji: '💝', label: '감사 카드',    desc: '감사 메시지를 남겼을 때' },
  { key: 'secret_comment', emoji: '🤫', label: '비밀 댓글',   desc: '비밀 댓글이 달렸을 때' },
]
const ACTIVITY_TYPES_EN = [
  { key: 'wish_added',     emoji: '🎁', label: 'Wish Added',      desc: 'When a member adds a wish' },
  { key: 'will_buy',       emoji: '🛍️', label: 'Will Buy',        desc: 'When someone marks as buying' },
  { key: 'received',       emoji: '✅', label: 'Received',        desc: 'When a wish is marked received' },
  { key: 'thanks',         emoji: '💝', label: 'Thank You Card',  desc: 'When a thank you message is left' },
  { key: 'secret_comment', emoji: '🤫', label: 'Secret Comment',  desc: 'When a secret comment is added' },
]

export default function Notifications({ session, onBack }: { session: any, onBack: () => void }) {
  const { lang } = useLang()
  const [tab, setTab] = useState<'event' | 'activity'>('event')
  const [groups, setGroups] = useState<any[]>([])
  const [settings, setSettings] = useState<Record<string, any>>({})
  const [activitySettings, setActivitySettings] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)

  const EVENT_TYPES = lang === 'ko' ? EVENT_TYPES_KO : EVENT_TYPES_EN
  const NOTIFY_DAY_OPTIONS = lang === 'ko' ? NOTIFY_DAY_OPTIONS_KO : NOTIFY_DAY_OPTIONS_EN
  const ACTIVITY_TYPES = lang === 'ko' ? ACTIVITY_TYPES_KO : ACTIVITY_TYPES_EN

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    // 그룹 목록
    const { data: memberData } = await supabase
      .from('group_members')
      .select('group_id, groups(*)')
      .eq('user_id', session.user.id)

    if (memberData) {
      const groupList = memberData.map((d: any) => d.groups).filter(Boolean)
      setGroups(groupList)

      // 이벤트 알림 설정
      const { data: settingsData } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', session.user.id)

      const settingsMap: Record<string, any> = {}
      const activityMap: Record<string, boolean> = {}

      if (settingsData) {
        settingsData.forEach((s: any) => {
          if (s.setting_type === 'activity') {
            // 활동 알림: key = activity_타입
            activityMap[s.event_type] = s.is_enabled ?? true
          } else {
            // 이벤트 알림: key = groupId_eventType
            const key = `${s.group_id}_${s.event_type}`
            settingsMap[key] = s
          }
        })
      }
      setSettings(settingsMap)
      setActivitySettings(activityMap)
    }
    setLoading(false)
  }

  const getSetting = (groupId: string, eventType: string) => {
    const key = `${groupId}_${eventType}`
    return settings[key] || { is_enabled: true, notify_days: [7, 1] }
  }

  const getActivityEnabled = (key: string) => {
    return activitySettings[key] ?? true
  }

  const toggleEvent = async (groupId: string, eventType: string) => {
    const key = `${groupId}_${eventType}`
    const current = getSetting(groupId, eventType)
    const newEnabled = !current.is_enabled
    setSaving(true)
    const { data, error } = await supabase
      .from('notification_settings')
      .upsert({
        user_id: session.user.id, group_id: groupId,
        event_type: eventType, is_enabled: newEnabled,
        notify_days: current.notify_days || [7, 1],
        setting_type: 'event'
      }, { onConflict: 'user_id,group_id,event_type' })
      .select().single()
    if (!error && data) setSettings(prev => ({ ...prev, [key]: data }))
    setSaving(false)
  }

  const toggleNotifyDay = async (groupId: string, eventType: string, day: number) => {
    const key = `${groupId}_${eventType}`
    const current = getSetting(groupId, eventType)
    const currentDays: number[] = current.notify_days || [7, 1]
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].sort((a, b) => b - a)
    setSaving(true)
    const { data, error } = await supabase
      .from('notification_settings')
      .upsert({
        user_id: session.user.id, group_id: groupId,
        event_type: eventType, is_enabled: current.is_enabled ?? true,
        notify_days: newDays, setting_type: 'event'
      }, { onConflict: 'user_id,group_id,event_type' })
      .select().single()
    if (!error && data) setSettings(prev => ({ ...prev, [key]: data }))
    setSaving(false)
  }

  const toggleActivity = async (activityKey: string) => {
    const current = getActivityEnabled(activityKey)
    const newEnabled = !current
    setSaving(true)
    // 활동 알림은 group_id 없이 user 전체 설정
    const { data, error } = await supabase
      .from('notification_settings')
      .upsert({
        user_id: session.user.id,
        group_id: null,
        event_type: activityKey,
        is_enabled: newEnabled,
        notify_days: [],
        setting_type: 'activity'
      }, { onConflict: 'user_id,event_type' })
      .select().single()
    if (!error && data) setActivitySettings(prev => ({ ...prev, [activityKey]: newEnabled }))
    setSaving(false)
  }

  const Toggle = ({ enabled, onToggle }: { enabled: boolean, onToggle: () => void }) => (
    <div onClick={onToggle} style={{
      width:'44px', height:'24px', borderRadius:'12px',
      background: enabled ? '#111827' : '#E5E7EB',
      cursor:'pointer', position:'relative', flexShrink:0
    }}>
      <div style={{
        position:'absolute', top:'2px',
        left: enabled ? '22px' : '2px',
        width:'20px', height:'20px', borderRadius:'50%',
        background:'white', boxShadow:'0 1px 3px rgba(0,0,0,0.2)',
        transition:'left 0.15s'
      }} />
    </div>
  )

  if (loading) return (
    <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontSize:'32px'}}>🎁</div>
  )

  return (
    <div style={s.container}>

      {/* 헤더 */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={onBack}>←</button>
        <p style={s.headerTitle}>{lang === 'ko' ? '알림 설정' : 'Notification Settings'}</p>
        <div style={{width:'32px'}} />
      </div>

      {/* 탭 */}
      <div style={s.tabRow}>
        <button style={{
          ...s.tabBtn,
          borderBottom: tab === 'event' ? '2px solid #111827' : '2px solid transparent',
          color: tab === 'event' ? '#111827' : '#9CA3AF',
          fontWeight: tab === 'event' ? 700 : 400,
        }} onClick={() => setTab('event')}>
          {lang === 'ko' ? '이벤트 알림' : 'Event Alerts'}
        </button>
        <button style={{
          ...s.tabBtn,
          borderBottom: tab === 'activity' ? '2px solid #111827' : '2px solid transparent',
          color: tab === 'activity' ? '#111827' : '#9CA3AF',
          fontWeight: tab === 'activity' ? 700 : 400,
        }} onClick={() => setTab('activity')}>
          {lang === 'ko' ? '활동 알림' : 'Activity Alerts'}
        </button>
      </div>

      <div style={s.content}>

        {/* ── 이벤트 알림 탭 ── */}
        {tab === 'event' && (
          <>
            <div style={s.infoBox}>
              <p style={s.infoText}>
                {lang === 'ko'
                  ? '각 그룹에서 받을 이벤트 알림과 알림 시점을 설정해요.'
                  : 'Set which event notifications you receive for each group.'}
              </p>
            </div>

            {groups.length === 0 ? (
              <div style={s.empty}>
                <p style={{fontSize:'44px', margin:'0 0 12px'}}>🔔</p>
                <p style={{fontWeight:700, fontSize:'16px', color:'#111827', margin:'0 0 6px'}}>
                  {lang === 'ko' ? '아직 그룹이 없어요' : 'No groups yet'}
                </p>
                <p style={{fontSize:'13px', color:'#9CA3AF', margin:0}}>
                  {lang === 'ko' ? '그룹에 참여하면 설정할 수 있어요!' : 'Join a group to configure!'}
                </p>
              </div>
            ) : groups.map(g => (
              <div key={g.id} style={s.groupCard}>
                <div style={s.groupHeader} onClick={() => setExpandedGroup(expandedGroup === g.id ? null : g.id)}>
                  <div style={{flex:1}}>
                    <p style={{fontWeight:700, fontSize:'15px', color:'#111827', margin:0}}>{g.name}</p>
                    <p style={{fontSize:'12px', color:'#9CA3AF', margin:'2px 0 0'}}>{g.group_type}</p>
                  </div>
                  <span style={{
                    fontSize:'16px', color:'#9CA3AF',
                    display:'inline-block',
                    transform: expandedGroup === g.id ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition:'transform 0.2s'
                  }}>›</span>
                </div>

                {expandedGroup === g.id && (
                  <div style={{borderTop:'1px solid #F5F5F5', paddingTop:'14px', marginTop:'12px'}}>
                    <p style={s.subLabel}>{lang === 'ko' ? '이벤트별 알림' : 'By Event Type'}</p>
                    {EVENT_TYPES.map(eventType => {
                      const setting = getSetting(g.id, eventType)
                      const isEnabled = setting.is_enabled ?? true
                      const notifyDays: number[] = setting.notify_days || [7, 1]
                      return (
                        <div key={eventType} style={{
                          marginBottom:'8px', borderRadius:'12px',
                          border:'1px solid #F0F0F0',
                          background: isEnabled ? 'white' : '#FAFAFA',
                          overflow:'hidden'
                        }}>
                          <div style={{display:'flex', alignItems:'center', padding:'10px 12px', gap:'10px'}}>
                            <span style={{fontSize:'18px'}}>{eventEmoji[eventType] || '📅'}</span>
                            <span style={{flex:1, fontSize:'14px', fontWeight:500, color: isEnabled ? '#111827' : '#9CA3AF'}}>{eventType}</span>
                            <Toggle enabled={isEnabled} onToggle={() => toggleEvent(g.id, eventType)} />
                          </div>
                          {isEnabled && (
                            <div style={{padding:'8px 12px 10px', borderTop:'1px solid #F5F5F5', background:'#FAFAFA'}}>
                              <p style={s.timingLabel}>{lang === 'ko' ? '알림 시점' : 'Timing'}</p>
                              <div style={{display:'flex', flexWrap:'wrap', gap:'6px'}}>
                                {NOTIFY_DAY_OPTIONS.map(opt => {
                                  const isSelected = notifyDays.includes(opt.value)
                                  return (
                                    <div key={opt.value} onClick={() => toggleNotifyDay(g.id, eventType, opt.value)} style={{
                                      padding:'4px 10px', borderRadius:'50px', cursor:'pointer',
                                      border:`1.5px solid ${isSelected ? '#111827' : '#E5E7EB'}`,
                                      background: isSelected ? '#111827' : 'white',
                                      fontSize:'11px', fontWeight: isSelected ? 600 : 400,
                                      color: isSelected ? 'white' : '#6B7280'
                                    }}>
                                      {opt.label}
                                      <span style={{marginLeft:'3px', color: isSelected ? 'rgba(255,255,255,0.7)' : '#9CA3AF'}}>
                                        {opt.desc}
                                      </span>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {/* ── 활동 알림 탭 ── */}
        {tab === 'activity' && (
          <>
            <div style={s.infoBox}>
              <p style={s.infoText}>
                {lang === 'ko'
                  ? '그룹에서 발생하는 활동 알림을 받을지 설정해요.'
                  : 'Choose which activity notifications you want to receive.'}
              </p>
            </div>

            <div style={s.groupCard}>
              {ACTIVITY_TYPES.map((act, i) => {
                const enabled = getActivityEnabled(act.key)
                return (
                  <div key={act.key} style={{
                    display:'flex', alignItems:'center', gap:'14px',
                    padding:'14px 0',
                    borderBottom: i < ACTIVITY_TYPES.length - 1 ? '1px solid #F5F5F5' : 'none'
                  }}>
                    {/* 아이콘 원형 */}
                    <div style={{
                      width:'40px', height:'40px', borderRadius:'50%',
                      background: enabled ? '#F5F5F5' : '#FAFAFA',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:'18px', flexShrink:0
                    }}>
                      {act.emoji}
                    </div>
                    {/* 텍스트 */}
                    <div style={{flex:1, minWidth:0}}>
                      <p style={{fontSize:'14px', fontWeight:600, color: enabled ? '#111827' : '#9CA3AF', margin:'0 0 2px'}}>{act.label}</p>
                      <p style={{fontSize:'12px', color:'#9CA3AF', margin:0}}>{act.desc}</p>
                    </div>
                    {/* 토글 */}
                    <Toggle enabled={enabled} onToggle={() => toggleActivity(act.key)} />
                  </div>
                )
              })}
            </div>

            <p style={{fontSize:'12px', color:'#9CA3AF', textAlign:'center', marginTop:'16px', lineHeight:1.6}}>
              {lang === 'ko'
                ? '내가 속한 모든 그룹에 동일하게 적용돼요'
                : 'These settings apply to all your groups'}
            </p>
          </>
        )}
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  container: { minHeight:'100vh', background:'#fff', fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif' },
  header: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'54px 20px 14px', background:'#fff', borderBottom:'1px solid #F3F4F6', position:'sticky', top:0, zIndex:50 },
  backBtn: { background:'none', border:'none', fontSize:'22px', cursor:'pointer', color:'#111827', padding:'4px', lineHeight:1 },
  headerTitle: { fontSize:'20px', fontWeight:800, color:'#111827', margin:0, letterSpacing:'-0.5px' },
  tabRow: { display:'flex', borderBottom:'1px solid #F3F4F6', padding:'0 20px' },
  tabBtn: { flex:1, padding:'14px 0', background:'none', border:'none', borderRadius:0, cursor:'pointer', fontSize:'14px', fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif' },
  content: { padding:'16px 20px 100px' },
  infoBox: { background:'#F9F9F9', borderRadius:'14px', padding:'14px 16px', marginBottom:'16px' },
  infoText: { fontSize:'13px', color:'#6B7280', margin:0, lineHeight:1.6 },
  subLabel: { fontSize:'11px', fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.5px', margin:'0 0 10px' },
  timingLabel: { fontSize:'11px', color:'#9CA3AF', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.3px', margin:'0 0 8px' },
  groupCard: { background:'white', borderRadius:'16px', padding:'0 16px', marginBottom:'12px', border:'1px solid #F0F0F0' },
  groupHeader: { display:'flex', alignItems:'center', cursor:'pointer', gap:'10px', padding:'16px 0' },
  empty: { textAlign:'center', padding:'60px 24px' },
}
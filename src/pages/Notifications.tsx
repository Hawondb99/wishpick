import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const EVENT_TYPES = [
  '생일', '결혼기념일', '연애기념일', '졸업', '입사/승진',
  '결혼', '베이비샤워', '돌잔치', '집들이', '크리스마스',
  '발렌타인데이', '화이트데이', '명절', '기타'
]

const eventEmoji: Record<string, string> = {
  '생일': '🎂', '결혼기념일': '💑', '연애기념일': '💕', '졸업': '🎓',
  '입사/승진': '💼', '결혼': '💍', '베이비샤워': '👶', '돌잔치': '🎈',
  '집들이': '🏠', '크리스마스': '🎄', '발렌타인데이': '💝', '화이트데이': '🤍',
  '명절': '🎆', '기타': '📅'
}

const NOTIFY_DAY_OPTIONS = [
  { value: 30, label: 'D-30', desc: '한달 전' },
  { value: 14, label: 'D-14', desc: '2주 전' },
  { value: 7, label: 'D-7', desc: '1주 전' },
  { value: 3, label: 'D-3', desc: '3일 전' },
  { value: 1, label: 'D-1', desc: '하루 전' },
  { value: 0, label: 'D-DAY', desc: '당일' },
]

export default function Notifications({ session, onBack }: { session: any, onBack: () => void }) {
  const [groups, setGroups] = useState<any[]>([])
  const [settings, setSettings] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)

  useEffect(() => {
    fetchGroupsAndSettings()
  }, [])

  const fetchGroupsAndSettings = async () => {
    const { data: memberData } = await supabase
      .from('group_members')
      .select('group_id, groups(*)')
      .eq('user_id', session.user.id)

    if (memberData) {
      const groupList = memberData.map((d: any) => d.groups).filter(Boolean)
      setGroups(groupList)

      const { data: settingsData } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', session.user.id)

      const settingsMap: Record<string, any> = {}
      if (settingsData) {
        settingsData.forEach((s: any) => {
          const key = `${s.group_id}_${s.event_type}`
          settingsMap[key] = s
        })
      }
      setSettings(settingsMap)
    }
    setLoading(false)
  }

  const getSettingKey = (groupId: string, eventType: string) => `${groupId}_${eventType}`

  const getSetting = (groupId: string, eventType: string) => {
    const key = getSettingKey(groupId, eventType)
    return settings[key] || { is_enabled: true, notify_days: [7, 1] }
  }

  const toggleEvent = async (groupId: string, eventType: string) => {
    const key = getSettingKey(groupId, eventType)
    const current = getSetting(groupId, eventType)
    const newEnabled = !current.is_enabled

    setSaving(true)
    const { data, error } = await supabase
      .from('notification_settings')
      .upsert({
        user_id: session.user.id,
        group_id: groupId,
        event_type: eventType,
        is_enabled: newEnabled,
        notify_days: current.notify_days || [7, 1]
      }, { onConflict: 'user_id,group_id,event_type' })
      .select()
      .single()

    if (!error && data) {
      setSettings(prev => ({ ...prev, [key]: data }))
    }
    setSaving(false)
  }

  const toggleNotifyDay = async (groupId: string, eventType: string, day: number) => {
    const key = getSettingKey(groupId, eventType)
    const current = getSetting(groupId, eventType)
    const currentDays: number[] = current.notify_days || [7, 1]
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].sort((a, b) => b - a)

    setSaving(true)
    const { data, error } = await supabase
      .from('notification_settings')
      .upsert({
        user_id: session.user.id,
        group_id: groupId,
        event_type: eventType,
        is_enabled: current.is_enabled ?? true,
        notify_days: newDays
      }, { onConflict: 'user_id,group_id,event_type' })
      .select()
      .single()

    if (!error && data) {
      setSettings(prev => ({ ...prev, [key]: data }))
    }
    setSaving(false)
  }

  if (loading) return (
    <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontSize:'32px'}}>🎁</div>
  )

  return (
    <div style={styles.container}>
      <div style={styles.topbar}>
        <button style={styles.backBtn} onClick={onBack}>←</button>
        <div style={{fontWeight:700, fontSize:'17px'}}>알림 설정</div>
        <div style={{width:'32px'}} />
      </div>

      <div style={styles.content}>
        <div style={styles.infoCard}>
          <div style={{fontSize:'14px', fontWeight:600, color:'#374151', marginBottom:'4px'}}>🔔 그룹별 알림 설정</div>
          <div style={{fontSize:'12px', color:'#6B7280', lineHeight:'1.6'}}>
            각 그룹에서 어떤 이벤트 알림을 받을지, 얼마나 미리 받을지 설정할 수 있어요.
          </div>
        </div>

        {groups.length === 0 ? (
          <div style={styles.empty}>
            <div style={{fontSize:'48px', marginBottom:'12px'}}>🔔</div>
            <div style={{fontWeight:600, marginBottom:'6px'}}>아직 그룹이 없어요</div>
            <div style={{fontSize:'13px', color:'#9CA3AF'}}>그룹에 참여하면 알림을 설정할 수 있어요!</div>
          </div>
        ) : groups.map(g => (
          <div key={g.id} style={styles.groupCard}>
            {/* 그룹 헤더 */}
            <div
              style={styles.groupHeader}
              onClick={() => setExpandedGroup(expandedGroup === g.id ? null : g.id)}
            >
              <div style={{flex:1}}>
                <div style={{fontWeight:700, fontSize:'15px', color:'#111827'}}>{g.name}</div>
                <div style={{fontSize:'12px', color:'#9CA3AF', marginTop:'2px'}}>{g.group_type}</div>
              </div>
              <span style={{fontSize:'16px', color:'#9CA3AF', transition:'transform 0.2s', transform: expandedGroup === g.id ? 'rotate(90deg)' : 'rotate(0deg)'}}>›</span>
            </div>

            {/* 이벤트 알림 설정 */}
            {expandedGroup === g.id && (
              <div style={{borderTop:'1px solid #F3F4F6', paddingTop:'12px'}}>
                <div style={{fontSize:'12px', fontWeight:600, color:'#6B7280', marginBottom:'10px', padding:'0 4px'}}>이벤트별 알림</div>

                {EVENT_TYPES.map(eventType => {
                  const setting = getSetting(g.id, eventType)
                  const isEnabled = setting.is_enabled ?? true
                  const notifyDays: number[] = setting.notify_days || [7, 1]

                  return (
                    <div key={eventType} style={{
                      marginBottom:'10px', borderRadius:'12px', border:'1.5px solid #E5E7EB',
                      overflow:'hidden', background: isEnabled ? 'white' : '#F9FAFB'
                    }}>
                      {/* 이벤트 토글 */}
                      <div style={{display:'flex', alignItems:'center', padding:'10px 12px', gap:'10px'}}>
                        <span style={{fontSize:'20px'}}>{eventEmoji[eventType] || '📅'}</span>
                        <span style={{flex:1, fontSize:'14px', fontWeight:500, color: isEnabled ? '#111827' : '#9CA3AF'}}>{eventType}</span>
                        <div
                          onClick={() => toggleEvent(g.id, eventType)}
                          style={{
                            width:'44px', height:'24px', borderRadius:'12px',
                            background: isEnabled ? '#F472B6' : '#E5E7EB',
                            cursor:'pointer', position:'relative', transition:'background 0.2s',
                            flexShrink:0
                          }}
                        >
                          <div style={{
                            position:'absolute', top:'2px',
                            left: isEnabled ? '22px' : '2px',
                            width:'20px', height:'20px', borderRadius:'50%',
                            background:'white', transition:'left 0.2s',
                            boxShadow:'0 1px 3px rgba(0,0,0,0.2)'
                          }} />
                        </div>
                      </div>

                      {/* 알림 시점 설정 */}
                      {isEnabled && (
                        <div style={{padding:'8px 12px 10px', borderTop:'1px solid #F3F4F6', background:'#FAFAFA'}}>
                          <div style={{fontSize:'11px', color:'#6B7280', marginBottom:'8px', fontWeight:600}}>알림 시점</div>
                          <div style={{display:'flex', flexWrap:'wrap', gap:'6px'}}>
                            {NOTIFY_DAY_OPTIONS.map(opt => {
                              const isSelected = notifyDays.includes(opt.value)
                              return (
                                <div
                                  key={opt.value}
                                  onClick={() => toggleNotifyDay(g.id, eventType, opt.value)}
                                  style={{
                                    padding:'4px 10px', borderRadius:'50px', cursor:'pointer',
                                    border:`1.5px solid ${isSelected ? '#F472B6' : '#E5E7EB'}`,
                                    background: isSelected ? '#FDF2F8' : 'white',
                                    fontSize:'12px', fontWeight: isSelected ? 600 : 400,
                                    color: isSelected ? '#F472B6' : '#6B7280'
                                  }}
                                >
                                  {opt.label}
                                  <span style={{fontSize:'10px', color: isSelected ? '#F472B6' : '#9CA3AF', marginLeft:'3px'}}>
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
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight:'100vh', background:'#F9FAFB', fontFamily:'sans-serif' },
  topbar: { background:'white', padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #F3F4F6', position:'sticky', top:0, zIndex:50 },
  backBtn: { background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'#6B7280', padding:'4px' },
  content: { padding:'16px 16px 100px' },
  infoCard: { background:'linear-gradient(135deg, #FDF2F8, #EDE9FE)', borderRadius:'16px', padding:'16px', marginBottom:'16px' },
  empty: { textAlign:'center', padding:'48px 24px', color:'#6B7280' },
  groupCard: { background:'white', borderRadius:'16px', padding:'16px', marginBottom:'12px', boxShadow:'0 1px 3px rgba(0,0,0,0.08)' },
  groupHeader: { display:'flex', alignItems:'center', cursor:'pointer', gap:'10px' },
}
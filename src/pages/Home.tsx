import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useLang } from '../LanguageContext'
import Group from './Group'
import Profile from './Profile'
import Notifications from './Notifications'
import Settings from './Settings'

const eventEmoji: Record<string, string> = {
  '생일': '🎂', 'birthday': '🎂',
  '결혼기념일': '💑', '연애기념일': '💕', '졸업': '🎓',
  '입사/승진': '💼', '결혼': '💍', '베이비샤워': '👶', '돌잔치': '🎈',
  '집들이': '🏠', '크리스마스': '🎄', '발렌타인데이': '💝', '화이트데이': '🤍',
  '명절': '🎆', '기타': '📅'
}

interface DdayCard {
  groupId: string
  groupName: string
  memberName: string
  eventType: string
  eventTitle: string
  dday: number
  wishCount: number
  memberId: string
}

export default function Home({ session }: { session: any }) {
  const { t, lang } = useLang()
  const [groups, setGroups] = useState<any[]>([])
  const [currentGroup, setCurrentGroup] = useState<any>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupType, setNewGroupType] = useState('친구')
  const [newGroupVisibility, setNewGroupVisibility] = useState('surprise')
  const [newEventMode, setNewEventMode] = useState('individual')
  const [newGroupEventType, setNewGroupEventType] = useState('생일')
  const [newGroupEventTitle, setNewGroupEventTitle] = useState('')
  const [newGroupEventDate, setNewGroupEventDate] = useState('')
  const [newGroupCustomEvent, setNewGroupCustomEvent] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [ddayCards, setDdayCards] = useState<DdayCard[]>([])

  useEffect(() => {
    fetchProfile()
    fetchGroups()
  }, [])

  const fetchProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    setProfile(data)
  }

  const fetchGroups = async () => {
    const { data } = await supabase.from('group_members').select('group_id, groups(*)').eq('user_id', session.user.id)
    if (data) {
      const groupList = data.map((d: any) => d.groups).filter(Boolean)
      setGroups(groupList)
      await fetchDdayCards(groupList)
    }
    setLoading(false)
  }

  const fetchDdayCards = async (groupList: any[]) => {
    const cards: DdayCard[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data: myProfile } = await supabase.from('profiles').select('dday_alert_days').eq('id', session.user.id).single()
    const alertDays = myProfile?.dday_alert_days || 30
    const maxDays = alertDays === 9999 ? 99999 : alertDays

    const { data: notifSettings } = await supabase.from('notification_settings').select('*').eq('user_id', session.user.id)

    const isEventEnabled = (groupId: string, eventType: string) => {
      if (!notifSettings) return true
      const setting = notifSettings.find(s => s.group_id === groupId && s.event_type === eventType)
      return setting ? setting.is_enabled : true
    }

    for (const g of groupList) {
      if (g.event_mode === 'group' && g.group_event_type) {
        if (g.group_event_type === '생일') {
          if (!isEventEnabled(g.id, '생일')) continue
          const { data: members } = await supabase.from('group_members').select('profiles(id, name, birthday)').eq('group_id', g.id)
          if (members) {
            for (const m of members) {
              const p: any = m.profiles
              if (p?.birthday && p.id !== session.user.id) {
                const bd = new Date(p.birthday)
                bd.setFullYear(today.getFullYear())
                if (bd < today) bd.setFullYear(today.getFullYear() + 1)
                const diff = Math.ceil((bd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                if (diff <= maxDays) {
                  const { data: wishes } = await supabase.from('wishes').select('id').eq('group_id', g.id).eq('user_id', p.id).eq('status', 'available')
                  cards.push({ groupId: g.id, groupName: g.name, memberName: p.name, eventType: '생일', eventTitle: lang === 'ko' ? `${p.name}님 생일` : `${p.name}'s Birthday`, dday: diff, wishCount: wishes?.length || 0, memberId: p.id })
                }
              }
            }
          }
        } else if (g.group_event_date) {
          if (!isEventEnabled(g.id, g.group_event_type)) continue
          const eventDate = new Date(g.group_event_date)
          const diff = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          if (diff >= 0 && diff <= maxDays) {
            const { data: wishes } = await supabase.from('wishes').select('id').eq('group_id', g.id).eq('status', 'available')
            cards.push({ groupId: g.id, groupName: g.name, memberName: '', eventType: g.group_event_type, eventTitle: g.group_event_title || g.group_event_type, dday: diff, wishCount: wishes?.length || 0, memberId: '' })
          }
        }
      }

      if (g.event_mode === 'individual') {
        const { data: members } = await supabase.from('group_members').select('profiles(id, name, birthday)').eq('group_id', g.id)
        if (members) {
          for (const m of members) {
            const p: any = m.profiles
            if (p?.birthday && p.id !== session.user.id) {
              if (!isEventEnabled(g.id, '생일')) continue
              const bd = new Date(p.birthday)
              bd.setFullYear(today.getFullYear())
              if (bd < today) bd.setFullYear(today.getFullYear() + 1)
              const diff = Math.ceil((bd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
              if (diff <= maxDays) {
                const { data: wishes } = await supabase.from('wishes').select('id').eq('group_id', g.id).eq('user_id', p.id).eq('status', 'available')
                cards.push({ groupId: g.id, groupName: g.name, memberName: p.name, eventType: '생일', eventTitle: lang === 'ko' ? `${p.name}님 생일` : `${p.name}'s Birthday`, dday: diff, wishCount: wishes?.length || 0, memberId: p.id })
              }
            }
          }
        }
        const { data: events } = await supabase.from('events').select('*, profiles(name)').eq('is_group_event', false).neq('user_id', session.user.id)
        if (events && members) {
          for (const ev of events) {
            const memberInGroup = members.find((m: any) => m.profiles?.id === ev.user_id)
            if (!memberInGroup || !ev.event_date) continue
            if (!isEventEnabled(g.id, ev.event_type)) continue
            const evDate = new Date(ev.event_date)
            if (ev.is_recurring) { evDate.setFullYear(today.getFullYear()); if (evDate < today) evDate.setFullYear(today.getFullYear() + 1) }
            const diff = Math.ceil((evDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
            if (diff >= 0 && diff <= maxDays) {
              const p: any = memberInGroup.profiles
              cards.push({ groupId: g.id, groupName: g.name, memberName: p?.name || '', eventType: ev.event_type, eventTitle: ev.title, dday: diff, wishCount: 0, memberId: ev.user_id })
            }
          }
        }
      }
    }
    cards.sort((a, b) => a.dday - b.dday)
    setDdayCards(cards)
  }

  const resetCreateForm = () => {
    setNewGroupName(''); setNewGroupType('친구'); setNewGroupVisibility('surprise')
    setNewEventMode('individual'); setNewGroupEventType('생일')
    setNewGroupEventTitle(''); setNewGroupEventDate(''); setNewGroupCustomEvent('')
  }

  const createGroup = async () => {
    if (!newGroupName.trim()) { alert(lang === 'ko' ? '그룹 이름을 입력해주세요!' : 'Please enter a group name!'); return }
    const code = Math.random().toString(36).substr(2, 6).toUpperCase()
    const eventType = newGroupEventType === '기타' ? newGroupCustomEvent : newGroupEventType
    const { data: groupData, error: groupError } = await supabase.from('groups').insert({
      name: newGroupName.trim(), group_type: newGroupType,
      invite_code: code, created_by: session.user.id,
      buyer_visibility: newGroupVisibility, event_mode: newEventMode,
      group_event_type: newEventMode === 'group' ? eventType : null,
      group_event_title: newEventMode === 'group' ? (newGroupEventTitle || eventType) : null,
      group_event_date: newEventMode === 'group' && newGroupEventType !== '생일' ? newGroupEventDate : null,
    }).select().single()
    if (groupError) { alert('Error: ' + groupError.message); return }
    await supabase.from('group_members').insert({ group_id: groupData.id, user_id: session.user.id })
    setGroups(prev => [...prev, groupData])
    setShowCreate(false); resetCreateForm()
    alert(lang === 'ko' ? '🎉 그룹이 만들어졌어요!' : '🎉 Group created!')
  }

  const joinGroup = async () => {
    if (!joinCode.trim()) return
    const { data: group } = await supabase.from('groups').select('*').eq('invite_code', joinCode.toUpperCase()).single()
    if (!group) { alert(lang === 'ko' ? '❌ 초대 코드를 찾을 수 없어요!' : '❌ Invalid invite code!'); return }
    const { error } = await supabase.from('group_members').insert({ group_id: group.id, user_id: session.user.id })
    if (!error) { setGroups(prev => [...prev, group]); setShowJoin(false); setJoinCode(''); alert(lang === 'ko' ? `🎉 "${group.name}" 그룹에 참여했어요!` : `🎉 Joined "${group.name}"!`) }
    else alert(lang === 'ko' ? '이미 참여한 그룹이에요!' : 'Already a member!')
  }

  const visibilityInfo: Record<string, { label: string, emoji: string }> = {
    surprise: { label: lang === 'ko' ? '서프라이즈 모드' : 'Surprise Mode', emoji: '🎁' },
    public: { label: lang === 'ko' ? '모두 공개' : 'Public', emoji: '👀' },
    private: { label: lang === 'ko' ? '완전 비공개' : 'Private', emoji: '🔒' },
  }

  const groupTypeEmoji: Record<string, string> = { '커플': '💑', '가족': '👨‍👩‍👧', '친구': '🎂', '직장': '💼', '기타': '🎁', 'Couple': '💑', 'Family': '👨‍👩‍👧', 'Friends': '🎂', 'Work': '💼', 'Other': '🎁' }

  if (showProfile) return <Profile session={session} onBack={() => { setShowProfile(false); fetchProfile() }} />
  if (showNotifications) return <Notifications session={session} onBack={() => setShowNotifications(false)} />
  if (showSettings) return (
    <Settings
      session={session}
      onBack={() => setShowSettings(false)}
      onGoProfile={() => { setShowSettings(false); setShowProfile(true) }}
      onGoNotifications={() => { setShowSettings(false); setShowNotifications(true) }}
    />
  )
  if (currentGroup) return <Group group={currentGroup} session={session} onBack={() => { setCurrentGroup(null); fetchGroups() }} />

  const EVENT_TYPES_LOCAL = lang === 'ko'
    ? ['생일', '결혼기념일', '연애기념일', '졸업', '입사/승진', '결혼', '베이비샤워', '돌잔치', '집들이', '크리스마스', '발렌타인데이', '화이트데이', '명절', '기타']
    : ['Birthday', 'Anniversary', 'Graduation', 'Promotion', 'Wedding', 'Baby Shower', 'Housewarming', 'Christmas', "Valentine's Day", 'Other']

  return (
    <div style={styles.container}>
      {/* 헤더 */}
      <div style={styles.header}>
        <div>
          <div style={styles.greeting}>{t.greeting}</div>
          <div style={styles.username}>
            <span style={{color:'#111827', fontWeight:700}}>{profile?.name || 'WishPick'}</span>
            <span style={{color:'#6B7280', fontWeight:400, fontSize:'18px'}}>{lang === 'ko' ? '님의 그룹' : "'s Groups"}</span>
          </div>
        </div>
        <button style={styles.settingsBtn} onClick={() => setShowSettings(true)}>⚙️</button>
      </div>

      {/* D-day 카드 */}
      {ddayCards.length > 0 && (
        <div style={styles.ddaySection}>
          <div style={styles.ddaySectionTitle}>{t.upcoming_events}</div>
          <div style={styles.ddayList}>
            {ddayCards.map((card, i) => (
              <div key={i} style={styles.ddayCard} onClick={() => { const g = groups.find(g => g.id === card.groupId); if (g) setCurrentGroup(g) }}>
                <div style={styles.ddayEmoji}>{eventEmoji[card.eventType] || '📅'}</div>
                <div style={{flex:1, minWidth:0}}>
                  <div style={styles.ddayTitle}>{card.eventTitle}</div>
                  <div style={styles.ddayMeta}>
                    {card.groupName} · {card.wishCount > 0 ? t.wish_count(card.wishCount) : t.no_wishes}
                  </div>
                </div>
                <div style={{
                  ...styles.ddayBadge,
                  background: card.dday === 0 ? '#111827' : card.dday <= 7 ? '#FEF3C7' : '#F3F4F6',
                  color: card.dday === 0 ? 'white' : card.dday <= 7 ? '#92400E' : '#6B7280',
                }}>
                  {card.dday === 0 ? t.d_day : `D-${card.dday}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 액션 버튼 */}
      <div style={styles.actions}>
        <button style={styles.actionBtn} onClick={() => { resetCreateForm(); setShowCreate(true) }}>
          <span style={{fontSize:'22px'}}>✨</span>
          <span style={{fontSize:'12px', fontWeight:600, color:'#374151'}}>{t.new_group}</span>
        </button>
        <button style={styles.actionBtn} onClick={() => setShowJoin(true)}>
          <span style={{fontSize:'22px'}}>📩</span>
          <span style={{fontSize:'12px', fontWeight:600, color:'#374151'}}>{t.join_group}</span>
        </button>
      </div>

      <div style={styles.sectionTitle}>{t.my_groups}</div>

      {loading ? (
        <div style={{textAlign:'center', padding:'40px', fontSize:'24px'}}>🎁</div>
      ) : groups.length === 0 ? (
        <div style={styles.empty}>
          <div style={{fontSize:'48px', marginBottom:'12px'}}>🎁</div>
          <div style={{fontWeight:600, marginBottom:'6px', color:'#111827'}}>{t.no_groups}</div>
          <div style={{fontSize:'13px', color:'#9CA3AF'}}>{t.no_groups_desc}</div>
        </div>
      ) : (
        <div style={styles.groupList}>
          {groups.map(g => (
            <div key={g.id} style={styles.groupCard} onClick={() => setCurrentGroup(g)}>
              <div style={styles.groupEmoji}>{groupTypeEmoji[g.group_type] || '🎁'}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:600, fontSize:'16px', color:'#111827'}}>{g.name}</div>
                <div style={{fontSize:'12px', color:'#9CA3AF', marginTop:'3px', display:'flex', gap:'6px', alignItems:'center', flexWrap:'wrap'}}>
                  <span>{g.group_type}</span>
                  <span>·</span>
                  <span>{visibilityInfo[g.buyer_visibility]?.emoji} {visibilityInfo[g.buyer_visibility]?.label}</span>
                </div>
              </div>
              <div style={{fontSize:'18px', color:'#D1D5DB'}}>›</div>
            </div>
          ))}
        </div>
      )}

      {/* 그룹 만들기 모달 */}
      {showCreate && (
        <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) { setShowCreate(false); resetCreateForm() } }}>
          <div style={{...styles.modal, maxHeight:'92vh', overflowY:'auto'}}>
            <div style={styles.modalHandle} />
            <div style={styles.modalTitle}>{t.create_group}</div>
            <label style={styles.label}>{t.group_name}</label>
            <input style={styles.input} placeholder={lang === 'ko' ? '그룹 이름 *' : 'Group Name *'} value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
            <label style={styles.label}>{t.group_type}</label>
            <div style={{display:'flex', gap:'8px', marginBottom:'16px', flexWrap:'wrap'}}>
              {(lang === 'ko'
                ? ['커플', '가족', '친구', '직장', '기타']
                : ['Couple', 'Family', 'Friends', 'Work', 'Other']
              ).map(type => (
                <div key={type} onClick={() => setNewGroupType(type)} style={{
                  padding:'8px 14px', borderRadius:'50px', cursor:'pointer', fontSize:'13px', fontWeight:500,
                  border:`1.5px solid ${newGroupType === type ? '#111827' : '#E5E7EB'}`,
                  background: newGroupType === type ? '#111827' : 'white',
                  color: newGroupType === type ? 'white' : '#374151'
                }}>{type}</div>
              ))}
            </div>

            <label style={styles.label}>📅 {lang === 'ko' ? '이벤트 설정' : 'Event Settings'}</label>
            <div style={{display:'flex', gap:'8px', marginBottom:'12px'}}>
              {[
                { value: 'individual', label: lang === 'ko' ? '👤 개별 이벤트' : '👤 Individual', desc: lang === 'ko' ? '각자의 생일·기념일' : 'Each member\'s events' },
                { value: 'group', label: lang === 'ko' ? '🎉 공통 이벤트' : '🎉 Group Event', desc: lang === 'ko' ? '베이비샤워·승진 등' : 'Baby shower, promotion...' }
              ].map(opt => (
                <div key={opt.value} onClick={() => setNewEventMode(opt.value)} style={{
                  flex:1, padding:'10px', borderRadius:'12px', cursor:'pointer', textAlign:'center',
                  border:`1.5px solid ${newEventMode === opt.value ? '#111827' : '#E5E7EB'}`,
                  background: newEventMode === opt.value ? '#111827' : 'white'
                }}>
                  <div style={{fontSize:'13px', fontWeight:600, color: newEventMode === opt.value ? 'white' : '#374151'}}>{opt.label}</div>
                  <div style={{fontSize:'11px', color: newEventMode === opt.value ? 'rgba(255,255,255,0.7)' : '#9CA3AF', marginTop:'2px'}}>{opt.desc}</div>
                </div>
              ))}
            </div>

            {newEventMode === 'group' && (
              <div style={{background:'#F9FAFB', borderRadius:'12px', padding:'12px', marginBottom:'12px'}}>
                <select style={styles.input} value={newGroupEventType} onChange={e => setNewGroupEventType(e.target.value)}>
                  {EVENT_TYPES_LOCAL.map(t => <option key={t}>{t}</option>)}
                </select>
                <input style={styles.input} placeholder={lang === 'ko' ? '이벤트 이름 (예: 민수씨 생일)' : 'Event name (e.g. John\'s Birthday)'} value={newGroupEventTitle} onChange={e => setNewGroupEventTitle(e.target.value)} />
                {newGroupEventType !== '생일' && newGroupEventType !== 'Birthday' && (
                  <input style={{...styles.input, marginBottom:0}} type="date" value={newGroupEventDate} onChange={e => setNewGroupEventDate(e.target.value)} />
                )}
              </div>
            )}

            <label style={styles.label}>👀 {lang === 'ko' ? '구매자 공개 설정' : 'Buyer Visibility'}</label>
            {[
              { value: 'surprise', label: lang === 'ko' ? '🎁 서프라이즈 모드' : '🎁 Surprise Mode', desc: lang === 'ko' ? '받는 사람에게 구매자가 보이지 않아요' : 'Buyer hidden from recipient' },
              { value: 'public', label: lang === 'ko' ? '👀 모두 공개' : '👀 Public', desc: lang === 'ko' ? '모두 구매자를 볼 수 있어요' : 'Everyone can see the buyer' },
              { value: 'private', label: lang === 'ko' ? '🔒 완전 비공개' : '🔒 Private', desc: lang === 'ko' ? '구매자를 모두에게 숨겨요' : 'Buyer hidden from everyone' },
            ].map(opt => (
              <div key={opt.value} onClick={() => setNewGroupVisibility(opt.value)} style={{
                padding:'10px 12px', marginBottom:'8px', borderRadius:'12px', cursor:'pointer',
                border:`1.5px solid ${newGroupVisibility === opt.value ? '#111827' : '#E5E7EB'}`,
                background: newGroupVisibility === opt.value ? '#111827' : 'white',
                display:'flex', alignItems:'center', justifyContent:'space-between'
              }}>
                <div>
                  <div style={{fontSize:'13px', fontWeight:600, color: newGroupVisibility === opt.value ? 'white' : '#374151'}}>{opt.label}</div>
                  <div style={{fontSize:'11px', color: newGroupVisibility === opt.value ? 'rgba(255,255,255,0.7)' : '#9CA3AF', marginTop:'2px'}}>{opt.desc}</div>
                </div>
                {newGroupVisibility === opt.value && <span style={{color:'white'}}>✓</span>}
              </div>
            ))}

            <button style={styles.btn} onClick={createGroup}>{t.make}</button>
            <button style={styles.cancelBtn} onClick={() => { setShowCreate(false); resetCreateForm() }}>{t.cancel}</button>
          </div>
        </div>
      )}

      {/* 코드로 참여 모달 */}
      {showJoin && (
        <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) setShowJoin(false) }}>
          <div style={styles.modal}>
            <div style={styles.modalHandle} />
            <div style={styles.modalTitle}>{t.join_with_code}</div>
            <input
              style={{...styles.input, textAlign:'center', letterSpacing:'6px', fontSize:'20px', fontWeight:700, textTransform:'uppercase'}}
              placeholder={t.enter_code} value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())} maxLength={6}
            />
            <button style={styles.btn} onClick={joinGroup}>{t.join}</button>
            <button style={styles.cancelBtn} onClick={() => setShowJoin(false)}>{t.cancel}</button>
          </div>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight:'100vh', background:'#FAFAF9', fontFamily:'-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' },
  header: { background:'white', padding:'20px 20px 16px', display:'flex', alignItems:'flex-start', justifyContent:'space-between', borderBottom:'1px solid #F3F4F6' },
  greeting: { fontSize:'13px', color:'#9CA3AF', marginBottom:'4px', fontWeight:400 },
  username: { fontSize:'22px', fontWeight:700, color:'#111827', letterSpacing:'-0.5px' },
  settingsBtn: { background:'#F3F4F6', border:'none', borderRadius:'50%', width:'38px', height:'38px', fontSize:'18px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', marginTop:'4px' },
  ddaySection: { padding:'16px 16px 0' },
  ddaySectionTitle: { fontSize:'13px', fontWeight:700, color:'#6B7280', marginBottom:'10px', textTransform:'uppercase', letterSpacing:'0.5px' },
  ddayList: { display:'flex', flexDirection:'column', gap:'8px' },
  ddayCard: { background:'white', borderRadius:'14px', padding:'14px', display:'flex', alignItems:'center', gap:'12px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)', cursor:'pointer' },
  ddayEmoji: { fontSize:'28px', flexShrink:0 },
  ddayTitle: { fontSize:'14px', fontWeight:600, color:'#111827', marginBottom:'2px' },
  ddayMeta: { fontSize:'12px', color:'#9CA3AF' },
  ddayBadge: { padding:'5px 12px', borderRadius:'50px', fontSize:'12px', fontWeight:700, flexShrink:0 },
  actions: { display:'flex', gap:'12px', padding:'16px 16px 8px' },
  actionBtn: { flex:1, background:'white', border:'none', borderRadius:'16px', padding:'16px 12px', display:'flex', flexDirection:'column', alignItems:'center', gap:'6px', cursor:'pointer', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' },
  sectionTitle: { fontSize:'13px', fontWeight:700, color:'#6B7280', padding:'8px 20px', textTransform:'uppercase', letterSpacing:'0.5px' },
  empty: { textAlign:'center', padding:'48px 24px', color:'#6B7280' },
  groupList: { padding:'0 16px 100px', display:'flex', flexDirection:'column', gap:'10px' },
  groupCard: { background:'white', borderRadius:'16px', padding:'16px', display:'flex', alignItems:'center', cursor:'pointer', boxShadow:'0 1px 3px rgba(0,0,0,0.06)', gap:'12px' },
  groupEmoji: { fontSize:'32px', flexShrink:0 },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:200 },
  modal: { background:'white', borderRadius:'24px 24px 0 0', width:'100%', maxWidth:'480px', padding:'20px 20px 40px' },
  modalHandle: { width:'36px', height:'4px', background:'#E5E7EB', borderRadius:'2px', margin:'0 auto 20px' },
  modalTitle: { fontSize:'18px', fontWeight:700, marginBottom:'20px', color:'#111827', letterSpacing:'-0.3px' },
  label: { fontSize:'13px', fontWeight:600, color:'#6B7280', marginBottom:'8px', display:'block', textTransform:'uppercase', letterSpacing:'0.3px' },
  input: { width:'100%', padding:'13px 14px', marginBottom:'12px', border:'1.5px solid #E5E7EB', borderRadius:'12px', fontSize:'14px', outline:'none', boxSizing:'border-box', fontFamily:'-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', background:'#FAFAF9', color:'#111827' },
  btn: { width:'100%', padding:'14px', background:'#111827', color:'white', border:'none', borderRadius:'14px', fontSize:'15px', fontWeight:600, cursor:'pointer', fontFamily:'-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', letterSpacing:'-0.2px' },
  cancelBtn: { width:'100%', padding:'12px', background:'none', border:'none', color:'#9CA3AF', fontSize:'14px', cursor:'pointer', marginTop:'4px', fontFamily:'-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }
}